// Called by the client after a successful bulk import.
import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { notify } from '@/lib/notify';

interface ImportCompleteBody {
  imported: number;
  skipped: number;
  source?: string; // 'csv' | 'bank-statement' | 'receipt'
}

export async function POST(req: Request) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await getSupabaseServerClient() as any;
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body: ImportCompleteBody = await req.json().catch(() => ({ imported: 0, skipped: 0 }));
  const { imported = 0, skipped = 0, source = 'csv' } = body;

  if (imported === 0) return NextResponse.json({ ok: true });

  const sourceLabel = source === 'bank-statement' ? 'Bank statement' : 'CSV';

  await notify({
    supabase,
    userId:  user.id,
    type:    'import_complete',
    title:   `${sourceLabel} import complete`,
    body:    `${imported} transaction${imported !== 1 ? 's' : ''} imported${skipped > 0 ? `, ${skipped} skipped` : ''}.`,
    data:    { imported, skipped, source },
    subject: `Import complete — ${imported} transactions added`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="color:#6366f1;margin-bottom:8px;font-size:18px">Personal Tracker</h2>
        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;margin-bottom:16px">
          <h3 style="color:#16a34a;margin:0 0 8px;font-size:15px">✅ Import Complete</h3>
          <p style="color:#374151;font-size:14px;margin:0 0 4px">
            <strong>${imported}</strong> transaction${imported !== 1 ? 's' : ''} successfully imported
          </p>
          ${skipped > 0 ? `<p style="color:#6b7280;font-size:13px;margin:0">${skipped} rows skipped (invalid data)</p>` : ''}
        </div>
        <a href="${process.env.NEXT_PUBLIC_APP_URL ?? ''}/transactions"
           style="display:inline-block;background:#6366f1;color:white;text-decoration:none;padding:10px 20px;border-radius:8px;font-size:14px">
          View Transactions
        </a>
      </div>
    `,
  });

  return NextResponse.json({ ok: true });
}
