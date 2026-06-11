// Lightweight in-memory sliding-window rate limiter.
// NOTE: state is per-process — on serverless this limits per warm instance, not
// globally. It meaningfully blunts abuse/cost-amplification; for hard global
// guarantees back it with a shared store (Upstash/Redis).
const buckets = new Map<string, number[]>();

export function rateLimit(key: string, limit: number, windowMs: number): { ok: boolean; retryAfterMs: number } {
  const now = Date.now();
  const hits = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);

  if (hits.length >= limit) {
    buckets.set(key, hits);
    const retryAfterMs = windowMs - (now - hits[0]);
    return { ok: false, retryAfterMs };
  }

  hits.push(now);
  buckets.set(key, hits);

  // Opportunistic cleanup so the map doesn't grow unbounded.
  if (buckets.size > 10_000) {
    for (const [k, v] of buckets) {
      if (v.every((t) => now - t >= windowMs)) buckets.delete(k);
    }
  }

  return { ok: true, retryAfterMs: 0 };
}
