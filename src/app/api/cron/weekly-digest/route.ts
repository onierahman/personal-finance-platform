// Weekly spending digest — invoked by Vercel Cron every Monday at 8 AM UTC.
// Iterates all users with Gmail connected and sends a summary of last week's spending.
import { NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase/server';
import { notify } from '@/lib/notify';

export const runtime = 'nodejs';

function weekRange(): { start: string; end: string } {
  const now    = new Date();
  const day    = now.getUTCDay(); // 0=Sun, 1=Mon … 6=Sat
  const monday = new Date(now);
  monday.setUTCDate(now.getUTCDate() - day - 6); // last Monday
  monday.setUTCHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);
  sunday.setUTCHours(23, 59, 59, 999);

  return {
    start: monday.toISOString().slice(0, 10),
    end:   sunday.toISOString().slice(0, 10),
  };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const debug = searchParams.get('debug') === 'true';
  const force = searchParams.get('force') === 'true'; // bypass zero-spend skip

  // Verify Vercel Cron secret
  const cronSecret = req.headers.get('authorization');
  if (process.env.CRON_SECRET && cronSecret !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY === 'your-service-role-key-here') {
    return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY is not set in environment variables.' }, { status: 500 });
  }

   
  const supabase = await getSupabaseServiceClient() as any;
  const { start, end } = weekRange();

  const { data: tokens, error: tokensError } = await supabase
    .from('gmail_tokens')
    .select('user_id, email');

  if (debug) {
    return NextResponse.json({
      week: { start, end },
      tokenCount: tokens?.length ?? 0,
      tokensError: tokensError?.message ?? null,
      tokens: tokens?.map((t: { user_id: string; email: string }) => t.email) ?? [],
    });
  }

  if (!tokens?.length) return NextResponse.json({ ok: true, sent: 0, reason: 'no gmail tokens found' });

  let sent = 0;
  const errors: string[] = [];

  for (const token of tokens) {
    try {
      const accountIds = await getUserAccountIds(supabase, token.user_id);

      // Guard: skip the .in() call entirely if there are no accounts
      const rows: { amount: number; category: string }[] = accountIds.length === 0 ? [] : await (async () => {
        const { data } = await supabase
          .from('transactions')
          .select('amount, category')
          .eq('is_deleted', false)
          .eq('type', 'expense')
          .gte('date', start)
          .lte('date', end)
          .in('account_id', accountIds);
        return data ?? [];
      })();

      const totalSpent = rows.reduce((s, r) => s + Number(r.amount), 0);

      if (totalSpent === 0 && !force) continue;

      // Group by category
      const byCategory = new Map<string, number>();
      rows.forEach(r => {
        byCategory.set(r.category, (byCategory.get(r.category) ?? 0) + Number(r.amount));
      });

      const topCategories = Array.from(byCategory.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

      const categoryRows = topCategories.length > 0
        ? topCategories.map(([cat, amt]) =>
          `<tr>
            <td style="padding:6px 0;color:#374151;font-size:14px">${cat}</td>
            <td style="padding:6px 0;color:#374151;font-size:14px;text-align:right">$${amt.toFixed(2)}</td>
          </tr>`,
        ).join('')
        : '<tr><td colspan="2" style="color:#9ca3af;font-size:13px;padding:8px 0">No expenses recorded this week.</td></tr>';

      const weekLabel = `${start} – ${end}`;

      await notify({
        supabase,
        userId:  token.user_id,
        type:    'weekly_digest',
        title:   totalSpent > 0 ? `Weekly spending: $${totalSpent.toFixed(2)}` : 'Weekly digest',
        body:    totalSpent > 0
          ? `You spent $${totalSpent.toFixed(2)} last week (${weekLabel}).`
          : `No expenses recorded last week (${weekLabel}).`,
        data:    { totalSpent, weekStart: start, weekEnd: end, topCategories },
        subject: `Your weekly spending digest — $${totalSpent.toFixed(2)}`,
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
            <h2 style="color:#6366f1;margin-bottom:4px;font-size:18px">Weekly Spending Digest</h2>
            <p style="color:#6b7280;font-size:13px;margin:0 0 20px">${weekLabel}</p>

            <div style="background:#f5f3ff;border-radius:12px;padding:20px;margin-bottom:20px;text-align:center">
              <p style="color:#6b7280;font-size:12px;margin:0 0 4px;text-transform:uppercase;letter-spacing:.05em">Total Spent</p>
              <p style="color:#4f46e5;font-size:32px;font-weight:700;margin:0">$${totalSpent.toFixed(2)}</p>
            </div>

            <h3 style="color:#374151;font-size:14px;margin:0 0 12px">Top Categories</h3>
            <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
              ${categoryRows}
            </table>

            <a href="${process.env.NEXT_PUBLIC_APP_URL ?? ''}/analytics"
               style="display:inline-block;background:#6366f1;color:white;text-decoration:none;padding:10px 20px;border-radius:8px;font-size:14px">
              View Full Analytics
            </a>
          </div>
        `,
      });

      sent++;
    } catch (err) {
      errors.push(String(err));
    }
  }

  return NextResponse.json({ ok: true, sent, ...(errors.length ? { errors } : {}) });
}

async function getUserAccountIds(
   
  supabase: any,
  userId: string,
): Promise<string[]> {
  const { data } = await supabase
    .from('accounts')
    .select('id')
    .eq('user_id', userId)
    .eq('is_active', true);
  return (data ?? []).map((a: { id: string }) => a.id);
}
