import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { Database } from '@/types/database';

// Pages where unauthenticated access is allowed
const PUBLIC_PAGE_ROUTES = ['/login', '/register', '/forgot-password', '/reset-password', '/unsubscribe'];

// API routes that must bypass auth checks entirely (no session required)
const PUBLIC_API_ROUTES = ['/api/cron/', '/api/auth/gmail/callback', '/api/auth/gmail/unsubscribe'];

// Authenticated app pages that require a session. Anything outside this set
// (and the public routes) is an unknown path and should 404 normally rather
// than bounce through /login.
const PROTECTED_PAGE_PREFIXES = [
  '/dashboard', '/transactions', '/accounts', '/budgets', '/goals',
  '/investments', '/net-worth', '/recurring', '/analytics', '/settings',
];

function isProtectedPage(pathname: string): boolean {
  if (pathname === '/') return true; // root resolves to the dashboard
  return PROTECTED_PAGE_PREFIXES.some(p => pathname === p || pathname.startsWith(`${p}/`));
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

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
          supabaseResponse = NextResponse.next({ request });
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

  // Redirect authenticated users away from login/register pages. /reset-password
  // is excluded: completing a recovery creates a session, and the user must stay
  // on the page long enough to set their new password.
  if (user && isPublicPage && pathname !== '/reset-password') {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}