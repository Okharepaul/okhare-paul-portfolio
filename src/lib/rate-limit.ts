/**
 * Fixed-window rate limiter held in memory. Good enough for a single
 * contact form; on serverless each instance keeps its own window, so treat it
 * as a speed bump rather than a hard quota.
 */

export interface RateLimiter {
  /** Records a hit and reports whether it is allowed. */
  check(key: string, now?: number): boolean;
}

const MAX_TRACKED_KEYS = 5000;

export function createRateLimiter(limit: number, windowMs: number): RateLimiter {
  const hits = new Map<string, { count: number; resetAt: number }>();

  return {
    check(key: string, now: number = Date.now()): boolean {
      if (hits.size > MAX_TRACKED_KEYS) {
        for (const [storedKey, entry] of hits) {
          if (entry.resetAt <= now) hits.delete(storedKey);
        }
        // Still full of live windows: refuse rather than grow without bound.
        if (hits.size > MAX_TRACKED_KEYS) return false;
      }

      const entry = hits.get(key);
      if (!entry || entry.resetAt <= now) {
        hits.set(key, { count: 1, resetAt: now + windowMs });
        return true;
      }
      if (entry.count >= limit) return false;
      hits.set(key, { ...entry, count: entry.count + 1 });
      return true;
    },
  };
}
