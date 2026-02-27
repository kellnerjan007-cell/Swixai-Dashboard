/**
 * Simple in-memory rate limiter.
 *
 * Works per-serverless-instance (best-effort). For strict production-grade
 * rate limiting across all instances, replace with Upstash Redis:
 * https://upstash.com/docs/redis/sdks/ratelimit-ts/overview
 */

interface Entry {
  count: number;
  resetAt: number;
}

const store = new Map<string, Entry>();

export function rateLimit(
  identifier: string,
  limit: number,
  windowMs: number
): { success: boolean } {
  const now = Date.now();
  const existing = store.get(identifier);

  if (!existing || now > existing.resetAt) {
    store.set(identifier, { count: 1, resetAt: now + windowMs });
    return { success: true };
  }

  if (existing.count >= limit) {
    return { success: false };
  }

  existing.count++;
  return { success: true };
}

/** Extract the real client IP from Next.js request headers */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return "unknown";
}
