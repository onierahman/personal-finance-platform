import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';

export async function GET() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await getSupabaseServerClient() as any;
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ connected: false, email: null }, { status: 401 });
  }

  const { data } = await supabase
    .from('gmail_tokens')
    .select('email')
    .eq('user_id', user.id)
    .single();

  if (!data) {
    return NextResponse.json({ connected: false, email: null });
  }

  return NextResponse.json({ connected: true, email: data.email });
}
