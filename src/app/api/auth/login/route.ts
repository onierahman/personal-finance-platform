import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { rejectCsrf } from '@/lib/security/csrf';
import { checkRateLimit, clientIp } from '@/lib/security/rateLimit';

const IP_LIMIT = 20;       // 20 attempts per IP per 10 min
const EMAIL_LIMIT = 5;     // 5 attempts per email per 10 min
const WINDOW_MS = 10 * 60 * 1000;

export async function POST(req: Request) {
  const csrf = rejectCsrf(req);
  if (csrf) return csrf;

  let body: { email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  const email = (body.email || '').trim().toLowerCase();
  const password = body.password || '';
  if (!email || !password) {
    return NextResponse.json({ error: 'Missing credentials' }, { status: 400 });
  }

  const ip = clientIp(req);
  const ipGate = checkRateLimit(`login:ip:${ip}`, IP_LIMIT, WINDOW_MS);
  const emailGate = checkRateLimit(`login:email:${email}`, EMAIL_LIMIT, WINDOW_MS);
  const blocked = !ipGate.ok || !emailGate.ok;

  if (blocked) {
    const retry = Math.max(ipGate.retryAfterSeconds, emailGate.retryAfterSeconds);
    return NextResponse.json(
      { error: 'Too many login attempts. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(retry) } },
    );
  }

  const supabase = (await getSupabaseServerClient()) as unknown as {
    auth: { signInWithPassword: (a: { email: string; password: string }) =>
      Promise<{ error: { message: string } | null }> };
  };

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    // Generic message; don't reveal whether the email exists.
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
  }

  return NextResponse.json({ ok: true });
}
