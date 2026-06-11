import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { sendGmailMessage, refreshAccessToken } from '@/lib/gmail';

export async function POST() {
   
  const supabase = await getSupabaseServerClient() as any;
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: tokenRow } = await supabase
    .from('gmail_tokens')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (!tokenRow) {
    return NextResponse.json({ error: 'Gmail not connected' }, { status: 400 });
  }

  // Refresh token if expired
  let accessToken = tokenRow.access_token;
  if (new Date(tokenRow.expires_at) <= new Date()) {
    try {
      const refreshed = await refreshAccessToken(tokenRow.refresh_token);
      accessToken = refreshed.access_token;
      const expiresAt = new Date(Date.now() + refreshed.expires_in * 1000).toISOString();
      await supabase
        .from('gmail_tokens')
        .update({ access_token: accessToken, expires_at: expiresAt, updated_at: new Date().toISOString() })
        .eq('user_id', user.id);
    } catch {
      return NextResponse.json({ error: 'Token refresh failed — please reconnect Gmail.' }, { status: 400 });
    }
  }

  try {
    await sendGmailMessage({
      accessToken,
      from:    tokenRow.email,
      to:      tokenRow.email,
      subject: 'Personal Tracker — Test Notification',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
          <h2 style="color:#6366f1;margin-bottom:8px">Personal Tracker</h2>
          <p style="color:#374151;font-size:15px">
            Your Gmail notifications are working correctly!
          </p>
          <p style="color:#6b7280;font-size:13px;margin-top:16px">
            You'll receive emails like this for budget alerts, upcoming bills, and weekly digests.
          </p>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/>
          <p style="color:#9ca3af;font-size:11px">
            Sent from Personal Tracker ·
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/settings?tab=notifications" style="color:#6366f1">Manage preferences</a>
          </p>
        </div>
      `,
    });

    // Log the test notification in DB
    await supabase.from('notifications').insert({
      user_id:    user.id,
      type:       'insight_ready',
      title:      'Test email sent',
      body:       `A test notification was sent to ${tokenRow.email}.`,
      email_sent: true,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
