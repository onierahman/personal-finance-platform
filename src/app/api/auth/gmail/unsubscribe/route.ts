// One-click unsubscribe — validates token, removes Gmail connection
import { NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase/server';
import { verifyUnsubscribeToken } from '@/lib/notify';
import { revokeToken } from '@/lib/gmail';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token  = searchParams.get('token');
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  if (!token) {
    return NextResponse.redirect(`${appUrl}/unsubscribe?status=invalid`);
  }

  const userId = verifyUnsubscribeToken(token);
  if (!userId) {
    return NextResponse.redirect(`${appUrl}/unsubscribe?status=expired`);
  }

   
  const supabase = await getSupabaseServiceClient() as any;

  const { data: tokenRow } = await supabase
    .from('gmail_tokens')
    .select('access_token')
    .eq('user_id', userId)
    .single();

  if (tokenRow?.access_token) {
    try { await revokeToken(tokenRow.access_token); } catch { /* ignore */ }
  }

  await supabase
    .from('gmail_tokens')
    .delete()
    .eq('user_id', userId);

  return NextResponse.redirect(`${appUrl}/unsubscribe?status=success`);
}
