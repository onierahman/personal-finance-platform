import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { Database } from '@/types/database';

// Pages where unauthenticated access is allowed
const PUBLIC_PAGE_ROUTES = ['/login', '/register', '/forgot-password', '/unsubscribe'];

// API routes that must bypass auth checks entirely (no session required)
const PUBLIC_API_ROUTES = ['/api/cron/', '/api/auth/gmail/callback', '/api/auth/gmail/unsubscribe'];

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

  // API routes that don't need session checks — always let them through
  if (PUBLIC_API_ROUTES.some(r => pathname.startsWith(r))) {
    return supabaseResponse;
  }

  const { data: { user } } = await supabase.auth.getUser();

  const isPublicPage = PUBLIC_PAGE_ROUTES.some(r => pathname.startsWith(r));

  // Redirect unauthenticated users to login (pages only)
  if (!user && !isPublicPage && pathname !== '/') {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users away from login/register pages
  if (user && isPublicPage) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}