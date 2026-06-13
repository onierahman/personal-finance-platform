import { NextResponse } from 'next/server';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL?.trim() || '';

function allowedOrigins(): string[] {
  const list: string[] = [];
  if (APP_URL) list.push(APP_URL.replace(/\/$/, ''));
  if (process.env.NODE_ENV !== 'production') {
    list.push('http://localhost:3000', 'http://127.0.0.1:3000');
  }
  return list;
}

/**
 * Reject the request if it looks cross-origin or isn't a JSON request.
 * Sec-Fetch-Site is the primary signal (set by all modern browsers).
 * Origin is the fallback; same-origin requests have a matching Origin.
 * Content-Type must be application/json — this also blocks CORS-simple
 * form posts that bypass the preflight.
 */
export function rejectCsrf(req: Request): NextResponse | null {
  const ct = (req.headers.get('content-type') || '').toLowerCase();
  if (!ct.startsWith('application/json')) {
    return NextResponse.json({ error: 'Unsupported Media Type' }, { status: 415 });
  }

  const site = req.headers.get('sec-fetch-site');
  if (site && site !== 'same-origin' && site !== 'same-site' && site !== 'none') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const origin = req.headers.get('origin');
  if (origin) {
    const ok = allowedOrigins();
    if (ok.length > 0 && !ok.includes(origin)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  return null;
}

/** For endpoints that take no body (DELETE), skip the Content-Type check. */
export function rejectCsrfNoBody(req: Request): NextResponse | null {
  const site = req.headers.get('sec-fetch-site');
  if (site && site !== 'same-origin' && site !== 'same-site' && site !== 'none') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const origin = req.headers.get('origin');
  if (origin) {
    const ok = allowedOrigins();
    if (ok.length > 0 && !ok.includes(origin)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }
  return null;
}
