import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { rateLimit } from '@/lib/rateLimit';
import {
  writeRuleBasedInsight,
  buildInsightPrompt,
  type InsightStats,
  type InsightPayload,
} from '@/lib/insights';

export const dynamic = 'force-dynamic';

function monthRange(d: Date): { start: string; end: string; key: string } {
  const y = d.getFullYear();
  const m = d.getMonth();
  const start = new Date(Date.UTC(y, m, 1));
  const end = new Date(Date.UTC(y, m + 1, 0));
  const iso = (x: Date) => x.toISOString().slice(0, 10);
  return { start: iso(start), end: iso(end), key: iso(start).slice(0, 7) };
}

interface TxnRow {
  amount: number;
  type: 'expense' | 'income' | 'transfer';
  category: string;
  merchant: string | null;
}

async function computeStats(
  supabase: any,
  monthKey: string,
): Promise<InsightStats> {
  const base = new Date(`${monthKey}-01T00:00:00Z`);
  const curr = monthRange(base);
  const prev = monthRange(new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() - 1, 1)));

  const fetchMonth = async (start: string, end: string): Promise<TxnRow[]> => {
    const { data } = await supabase
      .from('transactions')
      .select('amount, type, category, merchant')
      .eq('is_deleted', false)
      .gte('date', start)
      .lte('date', end);
    return (data ?? []) as TxnRow[];
  };

  const [currTxns, prevTxns] = await Promise.all([
    fetchMonth(curr.start, curr.end),
    fetchMonth(prev.start, prev.end),
  ]);

  const sum = (rows: TxnRow[], type: TxnRow['type']) =>
    rows.filter((r) => r.type === type).reduce((s, r) => s + Number(r.amount), 0);

  const income = sum(currTxns, 'income');
  const expense = sum(currTxns, 'expense');
  const prevExpense = sum(prevTxns, 'expense');

  const byCategory = new Map<string, number>();
  let largest: InsightStats['largestExpense'] = null;
  for (const r of currTxns) {
    if (r.type !== 'expense') continue;
    const amt = Number(r.amount);
    byCategory.set(r.category, (byCategory.get(r.category) ?? 0) + amt);
    if (!largest || amt > largest.amount) {
      largest = { merchant: r.merchant, category: r.category, amount: amt };
    }
  }
  const topCategories = [...byCategory.entries()]
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 3);

  return {
    month: monthKey,
    income,
    expense,
    net: income - expense,
    savingsRate: income > 0 ? (income - expense) / income : null,
    prevExpense,
    topCategories,
    transactionCount: currTxns.length,
    largestExpense: largest,
  };
}

/** Optional AI pass. Returns null on any failure so callers fall back to rules. */
async function generateWithAI(
  stats: InsightStats,
  currency: string,
): Promise<InsightPayload | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  try {
    const { default: Anthropic } = await import('@anthropic-ai/sdk');
    const client = new Anthropic();
    const msg = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      messages: [{ role: 'user', content: buildInsightPrompt(stats, currency) }],
    });
    const text = msg.content.find((c) => c.type === 'text')?.type === 'text'
      ? (msg.content.find((c) => c.type === 'text') as { text: string }).text
      : '';
    const jsonStart = text.indexOf('{');
    const jsonEnd = text.lastIndexOf('}');
    if (jsonStart === -1 || jsonEnd === -1) return null;
    const parsed = JSON.parse(text.slice(jsonStart, jsonEnd + 1)) as {
      headline?: string;
      body?: string[];
    };
    if (!parsed.headline || !Array.isArray(parsed.body) || parsed.body.length === 0) return null;
    return {
      headline: String(parsed.headline).slice(0, 120),
      body: parsed.body.slice(0, 4).map((s) => String(s).slice(0, 240)),
      stats,
      generatedBy: 'ai',
      generatedAt: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  // The generated DB types make some chained queries resolve to `never`; the
  // codebase convention is to use an untyped client for these handlers.
  const supabase = (await getSupabaseServerClient()) as any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(req.url);
  const refresh = url.searchParams.get('refresh') === '1';
  const monthKey = url.searchParams.get('month') || monthRange(new Date()).key;

  // Return cached insight unless a refresh is requested.
  if (!refresh) {
    const { data: cached } = await supabase
      .from('ai_insights')
      .select('payload')
      .eq('user_id', user.id)
      .eq('type', 'monthly_summary')
      .eq('period', monthKey)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (cached?.payload) {
      return NextResponse.json({ insight: cached.payload, cached: true });
    }
  }

  // Generating is the only place that may hit a paid API — rate-limit it.
  const limit = rateLimit(`insights:${user.id}`, 10, 60 * 1000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait a moment.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil(limit.retryAfterMs / 1000)) } },
    );
  }

  const stats = await computeStats(supabase, monthKey);

  const { data: profile } = await supabase
    .from('users')
    .select('currency')
    .eq('id', user.id)
    .maybeSingle();
  const currency = (profile as { currency?: string } | null)?.currency ?? 'USD';

  const payload = (await generateWithAI(stats, currency)) ?? writeRuleBasedInsight(stats);

  // Cache: replace any existing summary for this period.
  await supabase
    .from('ai_insights')
    .delete()
    .eq('user_id', user.id)
    .eq('type', 'monthly_summary')
    .eq('period', monthKey);
  await supabase.from('ai_insights').insert({
    user_id: user.id,
    type: 'monthly_summary',
    period: monthKey,
    payload: payload as unknown as Record<string, unknown>,
    is_read: false,
  });

  return NextResponse.json({ insight: payload, cached: false });
}
