import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import type { Notification, GmailConnection } from './types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const supabase = () => getSupabaseBrowserClient() as any;

// ── Notifications ────────────────────────────────────────────

export async function fetchNotifications(limit = 30): Promise<Notification[]> {
  const { data, error } = await supabase()
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) return [];

  return (data ?? []).map(mapRow);
}

export async function markNotificationRead(id: string): Promise<void> {
  await supabase()
    .from('notifications')
    .update({ is_read: true })
    .eq('id', id);
}

export async function markAllNotificationsRead(): Promise<void> {
  const { data: { user } } = await supabase().auth.getUser();
  if (!user) return;

  await supabase()
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', user.id)
    .eq('is_read', false);
}

export async function clearAllNotifications(): Promise<void> {
  const { data: { user } } = await supabase().auth.getUser();
  if (!user) return;

  await supabase()
    .from('notifications')
    .delete()
    .eq('user_id', user.id);
}

// ── Gmail connection status ──────────────────────────────────

export async function fetchGmailConnection(): Promise<GmailConnection> {
  const res = await fetch('/api/auth/gmail/status');
  if (!res.ok) return { connected: false, email: null };
  return res.json();
}

export async function disconnectGmail(): Promise<void> {
  await fetch('/api/auth/gmail/disconnect', { method: 'DELETE' });
}

export async function sendTestEmail(): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch('/api/notifications/send-test', { method: 'POST' });
  const body = await res.json();
  return { ok: res.ok, error: body.error };
}

// ── Map DB row to domain type ────────────────────────────────

function mapRow(row: Record<string, unknown>): Notification {
  return {
    id:         row.id as string,
    userId:     row.user_id as string,
    type:       row.type as Notification['type'],
    title:      row.title as string,
    body:       row.body as string,
    data:       row.data as Record<string, unknown> | null,
    isRead:     row.is_read as boolean,
    emailSent:  row.email_sent as boolean,
    createdAt:  row.created_at as string,
  };
}
