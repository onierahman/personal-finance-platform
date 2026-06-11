// Initiate Gmail OAuth flow
import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { getGmailAuthUrl } from '@/lib/gmail';

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

  // Encode user ID in state so we know who to attach the token to on callback
  const state = Buffer.from(JSON.stringify({ userId: user.id })).toString('base64url');
  const url = getGmailAuthUrl(state);

  return NextResponse.redirect(url);
}
