import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import type { ApiResponse, User } from '@/types';
import type { LoginFormValues, RegisterFormValues } from './schema';

export async function loginWithEmail(
  values: LoginFormValues,
): Promise<ApiResponse<User>> {

  // Route through the server proxy so IP+email rate limits are enforced
  // before the credentials reach Supabase. The proxy sets the session cookies
  // on success; the browser client then reads the live session.
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: values.email, password: values.password }),
  });
  if (!res.ok) {
    const { error } = await res.json().catch(() => ({ error: 'Login failed' }));
    return { data: null, error: error || 'Login failed' };
  }

  const supabase = getSupabaseBrowserClient() as any;
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) return { data: null, error: 'Login failed' };

  const { data: profileRaw } = await (supabase as any)
    .from('users')
    .select('*')
    .eq('id', authUser.id)
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
   
  const supabase = getSupabaseBrowserClient() as any;

  const { error } = await supabase.auth.signUp({
    email:    values.email,
    password: values.password,
    options:  { data: { name: values.name } },
  });

  if (error) return { data: null, error: error.message };
  return { data: null, error: null };
}

export async function requestPasswordReset(
  email: string,
): Promise<ApiResponse<null>> {

  const supabase = getSupabaseBrowserClient() as any;

  const redirectTo = `${window.location.origin}/reset-password`;
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });

  if (error) return { data: null, error: error.message };
  return { data: null, error: null };
}

export async function updatePassword(
  password: string,
): Promise<ApiResponse<null>> {

  const supabase = getSupabaseBrowserClient() as any;

  const { error } = await supabase.auth.updateUser({ password });

  if (error) return { data: null, error: error.message };
  return { data: null, error: null };
}

export async function logout(): Promise<void> {

  const supabase = getSupabaseBrowserClient() as any;
  await supabase.auth.signOut();
}

export async function getCurrentUser(): Promise<ApiResponse<User>> {
   
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
