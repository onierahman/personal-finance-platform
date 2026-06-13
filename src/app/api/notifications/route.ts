import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { rejectCsrf, rejectCsrfNoBody } from '@/lib/security/csrf';

export async function GET() {

  const supabase = await getSupabaseServerClient() as any;
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(30);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function PATCH(req: Request) {
  const csrf = rejectCsrf(req);
  if (csrf) return csrf;

  const supabase = await getSupabaseServerClient() as any;
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { id, markAll } = body as { id?: string; markAll?: boolean };

  if (markAll) {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);
    return NextResponse.json({ ok: true });
  }

  if (id) {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
      .eq('user_id', user.id);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
}

export async function DELETE(req: Request) {
  const csrf = rejectCsrfNoBody(req);
  if (csrf) return csrf;

  const supabase = await getSupabaseServerClient() as any;
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Destructive bulk operation requires an explicit ?id=… (single delete) or
  // ?all=true confirmation. A bare DELETE used to clear every notification —
  // too easy to trigger by accident or via a stale link.
  const url = new URL(req.url);
  const id = url.searchParams.get('id');
  const all = url.searchParams.get('all') === 'true';

  if (id) {
    await supabase
      .from('notifications')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);
    return NextResponse.json({ ok: true });
  }

  if (all) {
    await supabase
      .from('notifications')
      .delete()
      .eq('user_id', user.id);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json(
    { error: 'Specify ?id=<uuid> or ?all=true' },
    { status: 400 },
  );
}
