import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import type { ApiResponse, User } from '@/types';
import type { LoginFormValues, RegisterFormValues } from './schema';

export async function loginWithEmail(
  values: LoginFormValues,
): Promise<ApiResponse<User>> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseBrowserClient() as any;

  const { data, error } = await supabase.auth.signInWithPassword({
    email:    values.email,
    password: values.password,
  });

  if (error) return { data: null, error: error.message };

  const { data: profileRaw } = await (supabase as any)
    .from('users')
    .select('*')
    .eq('id', data.user.id)
    .single();
  const profile = profileRaw as import('@/types/database').DbUser | null;

  if (!profile) return { data: null, error: 'Profile not found' };

  return {
    data: {
      id:        profile.id,
      email:     profile.email,
      name:      profile.name,
      avatarUrl: profile.avatar_url,
      currency:  profile.currency,
      timezone:  profile.timezone,
    },
    error: null,
  };
}

export async function registerWithEmail(
  values: RegisterFormValues,
): Promise<ApiResponse<null>> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseBrowserClient() as any;

  const { error } = await supabase.auth.signUp({
    email:    values.email,
    password: values.password,
    options:  { data: { name: values.name } },
  });

  if (error) return { data: null, error: error.message };
  return { data: null, error: null };
}

export async function logout(): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseBrowserClient() as any;
  await supabase.auth.signOut();
}

export async function getCurrentUser(): Promise<ApiResponse<User>> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseBrowserClient() as any;

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { data: null, error: 'Not authenticated' };

  const { data: profileRaw2, error: profileError } = await (supabase as any)
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();
  const profile = profileRaw2 as import('@/types/database').DbUser | null;

  if (profileError || !profile) return { data: null, error: 'Profile not found' };

  return {
    data: {
      id:        profile.id,
      email:     profile.email,
      name:      profile.name,
      avatarUrl: profile.avatar_url,
      currency:  profile.currency,
      timezone:  profile.timezone,
    },
    error: null,
  };
}
