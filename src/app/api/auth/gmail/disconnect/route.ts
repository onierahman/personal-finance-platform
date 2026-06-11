import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { revokeToken } from '@/lib/gmail';

export async function DELETE() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await getSupabaseServerClient() as any;
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: tokenRow } = await supabase
    .from('gmail_tokens')
    .select('access_token')
    .eq('user_id', user.id)
    .single();

  if (tokenRow?.access_token) {
    // Best-effort revoke — don't fail if Google returns an error
    try { await revokeToken(tokenRow.access_token); } catch { /* ignore */ }
  }

  await supabase
    .from('gmail_tokens')
    .delete()
    .eq('user_id', user.id);

  return NextResponse.json({ ok: true });
}
