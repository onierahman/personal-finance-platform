// ============================================================
// Server-side Web Push delivery.
// Entirely optional: if VAPID keys are not configured the helpers
// no-op, so the rest of the app (and notifications) keep working.
// Configure later by setting:
//   NEXT_PUBLIC_VAPID_PUBLIC_KEY  (also used client-side)
//   VAPID_PRIVATE_KEY
//   VAPID_SUBJECT                 (e.g. "mailto:you@example.com")
// Generate a key pair with:  npx web-push generate-vapid-keys
// ============================================================

import type { SupabaseClient } from '@supabase/supabase-js';

export function isPushConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY &&
      process.env.VAPID_PRIVATE_KEY,
  );
}

interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}

/**
 * Send a push to every subscription a user has registered. Expired or invalid
 * subscriptions (404/410) are pruned. Safe to call unconditionally — it returns
 * early when push is not configured.
 */
export async function sendPushToUser(
  supabase: SupabaseClient<any>,
  userId: string,
  payload: PushPayload,
): Promise<void> {
  if (!isPushConfigured()) return;

  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('*')
    .eq('user_id', userId);

  if (!subs || subs.length === 0) return;

  // Imported lazily so the dependency never loads on paths that don't push.
  const webpush = (await import('web-push')).default;
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:notifications@financeos.app',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  );

  const body = JSON.stringify(payload);

  await Promise.all(
    subs.map(async (sub: { id: string; endpoint: string; p256dh: string; auth: string }) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          body,
        );
      } catch (err: unknown) {
        const statusCode = (err as { statusCode?: number })?.statusCode;
        if (statusCode === 404 || statusCode === 410) {
          // Subscription is gone — clean it up.
          await supabase.from('push_subscriptions').delete().eq('id', sub.id);
        }
        // Other errors are non-fatal; in-app/email delivery still happened.
      }
    }),
  );
}
