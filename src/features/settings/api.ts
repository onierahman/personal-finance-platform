import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import type { ApiResponse, User } from '@/types';

export interface ProfileUpdateValues {
  name: string;
  currency: string;
  timezone: string;
}

export interface PasswordChangeValues {
  newPassword: string;
}

export interface NotificationPreferences {
  billDue: boolean;
  budgetExceeded: boolean;
  goalAchieved: boolean;
  lowBalance: boolean;
  recurringGenerated: boolean;
  insightReady: boolean;
}

export const DEFAULT_NOTIFICATION_PREFS: NotificationPreferences = {
  billDue: true,
  budgetExceeded: true,
  goalAchieved: true,
  lowBalance: true,
  recurringGenerated: false,
  insightReady: true,
};

const NOTIF_PREFS_KEY = 'pfm_notification_prefs';

export async function updateUserProfile(
  values: ProfileUpdateValues,
): Promise<ApiResponse<User>> {
   
  const supabase = getSupabaseBrowserClient() as any;

  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) return { data: null, error: 'Not authenticated' };

  const { data, error } = await supabase
    .from('users')
    .update({
      name:       values.name.trim(),
      currency:   values.currency,
      timezone:   values.timezone,
      updated_at: new Date().toISOString(),
    })
    .eq('id', authUser.id)
    .select()
    .single();

  if (error) return { data: null, error: error.message };

  // Sync name to auth metadata
  await supabase.auth.updateUser({ data: { name: values.name.trim() } });

  return {
    data: {
      id:        data.id,
      email:     data.email,
      name:      data.name,
      avatarUrl: data.avatar_url,
      currency:  data.currency,
      timezone:  data.timezone,
    },
    error: null,
  };
}

export async function changePassword(
  values: PasswordChangeValues,
): Promise<ApiResponse<null>> {
   
  const supabase = getSupabaseBrowserClient() as any;

  const { error } = await supabase.auth.updateUser({
    password: values.newPassword,
  });

  if (error) return { data: null, error: error.message };
  return { data: null, error: null };
}

export function getNotificationPreferences(): NotificationPreferences {
  if (typeof window === 'undefined') return DEFAULT_NOTIFICATION_PREFS;
  try {
    const raw = localStorage.getItem(NOTIF_PREFS_KEY);
    if (!raw) return DEFAULT_NOTIFICATION_PREFS;
    return { ...DEFAULT_NOTIFICATION_PREFS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_NOTIFICATION_PREFS;
  }
}

export function saveNotificationPreferences(
  prefs: NotificationPreferences,
): void {
  localStorage.setItem(NOTIF_PREFS_KEY, JSON.stringify(prefs));
}

export async function deleteAccount(password: string): Promise<ApiResponse<null>> {
   
  const supabase = getSupabaseBrowserClient() as any;

  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) return { data: null, error: 'Not authenticated' };

  // Re-authenticate with the provided password before allowing deletion
  const { error: authError } = await supabase.auth.signInWithPassword({
    email:    authUser.email,
    password,
  });
  if (authError) return { data: null, error: 'Incorrect password. Please try again.' };

  // Soft-delete the profile row
  const { error } = await supabase
    .from('users')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', authUser.id);

  if (error) return { data: null, error: error.message };

  await supabase.auth.signOut();
  return { data: null, error: null };
}
