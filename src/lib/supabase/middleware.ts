import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { Database } from '@/types/database';

// Pages where unauthenticated access is allowed
const PUBLIC_PAGE_ROUTES = ['/login', '/register', '/forgot-password', '/reset-password', '/unsubscribe'];

// API routes that must bypass auth checks entirely (no session required)
const PUBLIC_API_ROUTES = ['/api/cron/', '/api/auth/gmail/callback', '/api/auth/gmail/unsubscribe', '/api/auth/login'];

// Authenticated app pages that require a session. Anything outside this set
// (and the public routes) is an unknown path and should 404 normally rather
// than bounce through /login.
const PROTECTED_PAGE_PREFIXES = [
  '/dashboard', '/transactions', '/accounts', '/budgets', '/goals',
  '/investments', '/net-worth', '/recurring', '/analytics', '/settings',
];

function isProtectedPage(pathname: string): boolean {
  // '/' is the public marketing page — signed-in users are redirected to the
  // dashboard below, everyone else sees the landing page.
  return PROTECTED_PAGE_PREFIXES.some(p => pathname === p || pathname.startsWith(`${p}/`));
}

const isDev = process.env.NODE_ENV !== 'production';

function generateNonce(): string {
  // 16 random bytes, base64-encoded
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let s = '';
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s);
}

function buildCsp(nonce: string): string {
  // React dev mode needs eval(); strict CSP only in production.
  const scriptSrc = isDev
    ? `'self' 'nonce-${nonce}' 'strict-dynamic' 'unsafe-eval'`
    : `'self' 'nonce-${nonce}' 'strict-dynamic'`;

  return [
    "default-src 'self'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "form-action 'self'",
    `script-src ${scriptSrc}`,
    // Inline styles are pervasive in React (framer-motion, Tailwind JIT).
    // Keeping 'unsafe-inline' on styles is the accepted trade-off; the
    // script-src nonce is what actually contains XSS.
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://*.supabase.co",
    "font-src 'self' data:",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://oauth2.googleapis.com https://www.googleapis.com https://api.anthropic.com",
  ].join('; ');
}

export async function updateSession(request: NextRequest) {
  const nonce = generateNonce();
  const csp = buildCsp(nonce);

  // Forward the nonce on the request so Next.js can inject it into the
  // <script> tags it streams. This is the documented pattern for nonce CSPs.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', csp);

  let supabaseResponse = NextResponse.next({ request: { headers: requestHeaders } });
  supabaseResponse.headers.set('Content-Security-Policy', csp);

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request: { headers: requestHeaders } });
          supabaseResponse.headers.set('Content-Security-Policy', csp);
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const pathname = request.nextUrl.pathname;

  // /signup is a common guess — send it to the real registration route.
  if (pathname === '/signup') {
    const url = request.nextUrl.clone();
    url.pathname = '/register';
    url.search = '';
    return NextResponse.redirect(url);
  }

  // API routes that don't need session checks — always let them through
  if (PUBLIC_API_ROUTES.some(r => pathname.startsWith(r))) {
    return supabaseResponse;
  }

  const { data: { user } } = await supabase.auth.getUser();

  const isPublicPage = PUBLIC_PAGE_ROUTES.some(r => pathname.startsWith(r));
  const isApiRoute   = pathname.startsWith('/api/');

  // Redirect unauthenticated users to login — but only for routes that actually
  // require auth. Unknown paths fall through to a normal 404 instead of being
  // bounced to login (which would dump the user on a 404 after signing in).
  if (!user && !isPublicPage && (isProtectedPage(pathname) || isApiRoute)) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users away from login/register pages and the
  // marketing landing page. /reset-password is excluded: completing a recovery
  // creates a session, and the user must stay on the page long enough to set
  // their new password.
  if (user && (pathname === '/' || (isPublicPage && pathname !== '/reset-password'))) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
