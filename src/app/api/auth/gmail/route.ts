// Initiate Gmail OAuth flow
import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { getGmailAuthUrl } from '@/lib/gmail';
import { signPayload } from '@/lib/crypto';

export async function GET() {
   
  const supabase = await getSupabaseServerClient() as any;
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_REDIRECT_URI) {
    return NextResponse.json(
      { error: 'Gmail OAuth is not configured. Add GOOGLE_CLIENT_ID and GOOGLE_REDIRECT_URI to your environment.' },
      { status: 503 },
    );
  }

  // Sign the state so the callback can trust the userId and reject forged/replayed
  // values (CSRF / account-linking protection). 15-minute validity window.
  const state = signPayload(
    { userId: user.id, exp: Date.now() + 15 * 60 * 1000 },
    'gmail-oauth-state',
  );
  const url = getGmailAuthUrl(state);

  return NextResponse.redirect(url);
}
