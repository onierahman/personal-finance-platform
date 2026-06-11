// Server-side notification utility
// Creates a notification row + optionally sends a Gmail email
import type { SupabaseClient } from '@supabase/supabase-js';
import { sendGmailMessage, refreshAccessToken } from './gmail';
import { signPayload, verifyPayload, encryptSecret, decryptSecret, escapeHtml } from './crypto';
import type { NotificationType } from '@/types/database';

// Max emails per user per hour — safety cap to prevent notification storms
const EMAIL_RATE_LIMIT_PER_HOUR = 10;

interface NotifyOptions {
   
  supabase: SupabaseClient<any>;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  html?: string;
  subject?: string;
}

export async function notify(opts: NotifyOptions): Promise<void> {
  const { supabase, userId, type, title, body, data, html, subject } = opts;

  // 1. Insert in-app notification and get back the id
  const { data: inserted } = await supabase
    .from('notifications')
    .insert({
      user_id:    userId,
      type,
      title,
      body,
      data:       data ?? null,
      is_read:    false,
      email_sent: false,
    })
    .select('id')
    .single();

  const notificationId: string | undefined = inserted?.id;

  // 2. Try email delivery if Gmail is connected
  try {
    const { data: tokenRow } = await supabase
      .from('gmail_tokens')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!tokenRow) return;

    // ── Rate limit check ──────────────────────────────────────
    const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('email_sent', true)
      .gte('created_at', since);

    if ((count ?? 0) >= EMAIL_RATE_LIMIT_PER_HOUR) return; // drop email, keep in-app

    // ── Refresh token if needed ───────────────────────────────
    let accessToken: string = decryptSecret(tokenRow.access_token);
    if (new Date(tokenRow.expires_at) <= new Date()) {
      const refreshed = await refreshAccessToken(decryptSecret(tokenRow.refresh_token));
      accessToken = refreshed.access_token;
      const expiresAt = new Date(Date.now() + refreshed.expires_in * 1000).toISOString();
      await supabase
        .from('gmail_tokens')
        .update({ access_token: encryptSecret(accessToken), expires_at: expiresAt, updated_at: new Date().toISOString() })
        .eq('user_id', userId);
    }

    const appUrl         = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
    const unsubToken     = makeUnsubscribeToken(userId);
    const unsubUrl       = `${appUrl}/unsubscribe?token=${unsubToken}`;
    const emailHtml      = html ?? defaultEmailHtml({ title, body });
    const footer         = `
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/>
      <p style="color:#9ca3af;font-size:11px">
        Personal Tracker notification ·
        <a href="${appUrl}/settings?tab=notifications" style="color:#6366f1">Manage preferences</a> ·
        <a href="${unsubUrl}" style="color:#9ca3af">Unsubscribe</a>
      </p>`;

    await sendGmailMessage({
      accessToken,
      from:    tokenRow.email,
      to:      tokenRow.email,
      subject: subject ?? title,
      html:    `${emailHtml}${footer}`,
    });

    // Mark email_sent on the specific row
    if (notificationId) {
      await supabase
        .from('notifications')
        .update({ email_sent: true })
        .eq('id', notificationId);
    }
  } catch {
    // Email failure is non-fatal
  }
}

// ── Unsubscribe token (HMAC-signed userId + 30-day expiry) ────
// Signed so the userId/exp cannot be forged by an attacker.
export function makeUnsubscribeToken(userId: string): string {
  return signPayload({ uid: userId, exp: Date.now() + 30 * 24 * 60 * 60 * 1000 }, 'unsubscribe');
}

export function verifyUnsubscribeToken(token: string): string | null {
  const payload = verifyPayload<{ uid?: string; exp?: number }>(token, 'unsubscribe');
  if (!payload?.uid || typeof payload.exp !== 'number' || Date.now() > payload.exp) return null;
  return payload.uid;
}

function defaultEmailHtml({ title, body }: { title: string; body: string }): string {
  return `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
      <h2 style="color:#6366f1;margin-bottom:8px;font-size:18px">Personal Tracker</h2>
      <h3 style="color:#374151;font-size:15px;margin:0 0 8px">${escapeHtml(title)}</h3>
      <p style="color:#6b7280;font-size:14px;margin:0">${escapeHtml(body)}</p>
    </div>
  `;
}
