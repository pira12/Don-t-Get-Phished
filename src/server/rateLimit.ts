/**
 * Minimal fixed-window rate limiter. In-memory: correct for a single instance,
 * which is the current deployment. For multi-instance (see the Redis roadmap) this
 * same interface moves to a shared store — callers don't change.
 *
 * Keyed by an arbitrary string (typically client IP + route). Fails OPEN on its own
 * errors — a limiter bug must never lock users out of the app.
 */

type Bucket = { count: number; resetAt: number };

const g = globalThis as unknown as { __dgpRate?: Map<string, Bucket> };
const buckets: Map<string, Bucket> = g.__dgpRate ?? (g.__dgpRate = new Map());

export type RateResult = { ok: boolean; remaining: number; retryAfterSec: number };

/** Allow `limit` events per `windowMs` for `key`. */
export function rateLimit(key: string, limit: number, windowMs: number): RateResult {
  try {
    const now = Date.now();
    const b = buckets.get(key);
    if (!b || now >= b.resetAt) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      // Opportunistic sweep so the map can't grow without bound.
      if (buckets.size > 5000) {
        for (const [k, v] of buckets) if (now >= v.resetAt) buckets.delete(k);
      }
      return { ok: true, remaining: limit - 1, retryAfterSec: 0 };
    }
    if (b.count >= limit) {
      return { ok: false, remaining: 0, retryAfterSec: Math.ceil((b.resetAt - now) / 1000) };
    }
    b.count += 1;
    return { ok: true, remaining: limit - b.count, retryAfterSec: 0 };
  } catch {
    return { ok: true, remaining: limit, retryAfterSec: 0 };
  }
}

/** Best-effort client IP from proxy headers (the host sits behind a proxy). */
export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}
