import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import type { ApiResponse, User } from '@/types';
import type { LoginFormValues, RegisterFormValues } from './schema';

export async function loginWithEmail(
  values: LoginFormValues,
): Promise<ApiResponse<User>> {
  const supabase = getSupabaseBrowserClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email:    values.email,
    password: values.password,
  });

  if (error) return { data: null, error: error.message };

  return upsertAndReturnProfile(supabase, data.user);
}

export async function registerWithEmail(
  values: RegisterFormValues,
): Promise<ApiResponse<null>> {
  const supabase = getSupabaseBrowserClient();

  const { error } = await supabase.auth.signUp({
    email:    values.email,
    password: values.password,
    options:  { data: { name: values.name } },
  });

  if (error) return { data: null, error: error.message };
  return { data: null, error: null };
}

export async function logout(): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  await supabase.auth.signOut();
}

export async function getCurrentUser(): Promise<ApiResponse<User>> {
  const supabase = getSupabaseBrowserClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { data: null, error: 'Not authenticated' };

  return upsertAndReturnProfile(supabase, user);
}

/** Safe fetch with auto-profile insert if missing */
async function upsertAndReturnProfile(
  supabase: ReturnType<typeof getSupabaseBrowserClient>,
  authUser: any,
): Promise<ApiResponse<User>> {
  
  // 1. Try an explicit select read first
  const { data: profile, error: selectError } = await supabase
    .from('users')
    .select('*')
    .eq('id', authUser.id)
    .maybeSingle(); // Prevents throwing hard 406/PGRST116 errors if missing

  // 2. If it exists, return it immediately
  if (profile && !selectError) {
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

  // 3. Fallback: If it truly is missing, perform a dedicated baseline creation insert
  const fallbackName = authUser.user_metadata?.name
    ?? authUser.raw_user_meta_data?.name
    ?? authUser.email?.split('@')[0]
    ?? 'User';

  const { data: newProfile, error: insertError } = await supabase
    .from('users')
    .insert({
      id:       authUser.id,
      email:    authUser.email ?? '',
      name:     fallbackName,
      currency: 'USD',
      timezone: 'UTC'
    })
    .select()
    .single();

  if (insertError || !newProfile) {
    // Console log this temporarily so you can see the EXACT database error in your browser console
    console.error("Database Insert Rejection Reason:", insertError);
    return { data: null, error: insertError?.message ?? 'Profile could not be generated' };
  }

  return {
    data: {
      id:        newProfile.id,
      email:     newProfile.email,
      name:      newProfile.name,
      avatarUrl: newProfile.avatar_url,
      currency:  newProfile.currency,
      timezone:  newProfile.timezone,
    },
    error: null,
  };
}