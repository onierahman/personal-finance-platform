// Called after any transaction is created/imported.
// Checks all active budgets and fires a notification when any exceed 90%.
// Deduplicates: skips categories already notified within the last 24 hours.
import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { notify } from '@/lib/notify';

export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  const debug = searchParams.get('debug') === 'true';

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await getSupabaseServerClient() as any;
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Small wait to ensure the DB budget trigger has finished writing spent_amount
  await new Promise(r => setTimeout(r, 300));

  // Fetch all budgets for this user
  const { data: budgets, error: budgetsError } = await supabase
    .from('budgets')
    .select('id, category, limit_amount, spent_amount, start_date, period')
    .eq('user_id', user.id);

  if (debug) {
    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: recentDebug } = await supabase
      .from('notifications')
      .select('type, data, created_at')
      .eq('user_id', user.id)
      .eq('type', 'budget_exceeded')
      .gte('created_at', since24h);

    return NextResponse.json({
      userId: user.id,
      budgetsError: budgetsError?.message ?? null,
      budgets: (budgets ?? []).map((b: { category: string; limit_amount: number; spent_amount: number; start_date?: string; period?: string }) => ({
        category:     b.category,
        limit:        b.limit_amount,
        spent:        b.spent_amount,
        pct:          b.limit_amount > 0 ? Math.round((b.spent_amount / b.limit_amount) * 100) : 0,
        wouldTrigger: b.limit_amount > 0 && b.spent_amount / b.limit_amount >= 0.9,
        start_date:   b.start_date,
        period:       b.period,
      })),
      recentBudgetAlerts: (recentDebug ?? []).map((n: { data: Record<string, unknown>; created_at: string }) => ({
        category:   n.data?.category,
        createdAt:  n.created_at,
        blocked:    true,
      })),
    });
  }

  if (!budgets?.length) return NextResponse.json({ ok: true, fired: 0, reason: 'no budgets found' });

  // Fetch recently sent budget_exceeded notifications (last 24 hours) to avoid spam
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: recentNotifs } = await supabase
    .from('notifications')
    .select('data')
    .eq('user_id', user.id)
    .eq('type', 'budget_exceeded')
    .gte('created_at', since);

  const recentCategories = new Set<string>(
    (recentNotifs ?? []).map((n: { data: Record<string, unknown> }) => n.data?.category as string).filter(Boolean),
  );

  let fired = 0;

  for (const budget of budgets) {
    const pct = budget.limit_amount > 0 ? budget.spent_amount / budget.limit_amount : 0;
    if (pct < 0.9) continue;
    if (recentCategories.has(budget.category)) continue;

    const isOver   = pct >= 1;
    const pctLabel = Math.round(pct * 100);

    await notify({
      supabase,
      userId: user.id,
      type:   'budget_exceeded',
      title:  isOver
        ? `${budget.category} budget exceeded (${pctLabel}%)`
        : `${budget.category} budget at ${pctLabel}%`,
      body:   isOver
        ? `You've gone over your ${budget.category} budget. Spent $${budget.spent_amount.toFixed(2)} of $${budget.limit_amount.toFixed(2)}.`
        : `You've used ${pctLabel}% of your ${budget.category} budget. $${(budget.limit_amount - budget.spent_amount).toFixed(2)} remaining.`,
      data:    { category: budget.category, pct, spent: budget.spent_amount, limit: budget.limit_amount },
      subject: isOver ? `Budget Alert: ${budget.category} exceeded` : `Budget Warning: ${budget.category} at ${pctLabel}%`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
          <h2 style="color:#6366f1;margin-bottom:8px;font-size:18px">Personal Tracker</h2>
          <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:16px;margin-bottom:16px">
            <h3 style="color:#dc2626;margin:0 0 8px;font-size:15px">
              ${isOver ? '⚠️ Budget Exceeded' : '⚡ Budget Alert'}
            </h3>
            <p style="color:#374151;font-size:14px;margin:0 0 8px">
              <strong>${budget.category}</strong>: $${budget.spent_amount.toFixed(2)} spent of $${budget.limit_amount.toFixed(2)} limit (${pctLabel}%)
            </p>
            <div style="background:#e5e7eb;border-radius:4px;height:8px;overflow:hidden">
              <div style="background:${pct >= 1 ? '#dc2626' : '#f97316'};height:100%;width:${Math.min(pct * 100, 100)}%"></div>
            </div>
          </div>
          <a href="${process.env.NEXT_PUBLIC_APP_URL ?? ''}/budgets"
             style="display:inline-block;background:#6366f1;color:white;text-decoration:none;padding:10px 20px;border-radius:8px;font-size:14px">
            View Budgets
          </a>
        </div>
      `,
    });

    fired++;
  }

  return NextResponse.json({ ok: true, fired });
}
