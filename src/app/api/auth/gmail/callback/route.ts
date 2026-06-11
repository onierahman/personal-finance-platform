// Handle Google OAuth callback — exchange code, store tokens
import { NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase/server';
import { exchangeCodeForTokens } from '@/lib/gmail';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code  = searchParams.get('code');
  const state = searchParams.get('state');
  const errParam = searchParams.get('error');

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  if (errParam) {
    return NextResponse.redirect(`${baseUrl}/settings?tab=notifications&gmail_error=access_denied`);
  }

  if (!code || !state) {
    return NextResponse.redirect(`${baseUrl}/settings?tab=notifications&gmail_error=missing_params`);
  }

  let userId: string;
  try {
    const decoded = JSON.parse(Buffer.from(state, 'base64url').toString());
    userId = decoded.userId;
  } catch {
    return NextResponse.redirect(`${baseUrl}/settings?tab=notifications&gmail_error=invalid_state`);
  }

  try {
    const tokens = await exchangeCodeForTokens(code);
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

    // Use service client — session cookie is not present in OAuth redirect requests
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = await getSupabaseServiceClient() as any;

    // Upsert so reconnecting replaces the old token
    const { error } = await supabase
      .from('gmail_tokens')
      .upsert(
        {
          user_id:       userId,
          email:         tokens.email,
          access_token:  tokens.access_token,
          refresh_token: tokens.refresh_token,
          expires_at:    expiresAt,
          updated_at:    new Date().toISOString(),
        },
        { onConflict: 'user_id' },
      );

    if (error) {
      console.error('Gmail token upsert error:', error);
      return NextResponse.redirect(`${baseUrl}/settings?tab=notifications&gmail_error=db_error`);
    }

    return NextResponse.redirect(`${baseUrl}/settings?tab=notifications&gmail_connected=1`);
  } catch (err) {
    console.error('Gmail callback error:', err);
    return NextResponse.redirect(`${baseUrl}/settings?tab=notifications&gmail_error=token_exchange`);
  }
}
