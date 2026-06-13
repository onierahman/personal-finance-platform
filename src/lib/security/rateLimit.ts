/**
 * Sliding-window in-memory rate limiter. Per-instance state — Vercel may run
 * multiple lambdas in parallel, so the effective ceiling is (limit × instances).
 * Good enough as a first defense against credential stuffing; swap for Upstash
 * if a tighter bound is needed.
 */

type Bucket = { hits: number[]; };
const store = new Map<string, Bucket>();
const SWEEP_EVERY = 5 * 60 * 1000;
let lastSweep = Date.now();

function sweep(now: number, windowMs: number) {
  if (now - lastSweep < SWEEP_EVERY) return;
  for (const [k, b] of store.entries()) {
    b.hits = b.hits.filter(t => now - t < windowMs);
    if (b.hits.length === 0) store.delete(k);
  }
  lastSweep = now;
}

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  sweep(now, windowMs);

  const b = store.get(key) ?? { hits: [] };
  b.hits = b.hits.filter(t => now - t < windowMs);

  if (b.hits.length >= limit) {
    const oldest = b.hits[0];
    return {
      ok: false,
      remaining: 0,
      retryAfterSeconds: Math.ceil((windowMs - (now - oldest)) / 1000),
    };
  }

  b.hits.push(now);
  store.set(key, b);
  return { ok: true, remaining: limit - b.hits.length, retryAfterSeconds: 0 };
}

export function clientIp(req: Request): string {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  return req.headers.get('x-real-ip') || 'unknown';
}
