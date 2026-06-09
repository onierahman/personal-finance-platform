import { getSupabaseServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    // Fetch the detailed public profile record matching your database layout
    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single();

    // Safely structure the full object structure using your application's type formatting
    return NextResponse.json({
      user: {
        id:         authUser.id,
        email:      authUser.email,
        name:       profile?.name || authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
        avatarUrl:  profile?.avatar_url || authUser.user_metadata?.avatar_url || null,
        currency:   profile?.currency || 'USD',
        timezone:   profile?.timezone || 'UTC',
      },
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    }, { status: 200 });

  } catch (e) {
    return NextResponse.json({ user: null }, { status: 200 });
  }
}