import { getRedis, RedisUnavailable, stopRedis } from "@/lib/redis";
import { RedisSlidingWindowRateLimiter, SlidingWindowRateLimiter } from "sliding-window-rate-limiter";

export class RateLimitUnavailable extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RateLimitUnavailable";
  }
}

export type RateLimitResult = { ok: true } | { ok: false; retryAfter: number };

export interface RateLimitStore {
  hit(key: string, limit: number, windowMs: number): Promise<RateLimitResult>;
}

let injected: RateLimitStore | undefined;
const windows = new Map<number, RedisSlidingWindowRateLimiter>();

/** Test-only. Production requests always use Redis. */
export function setRateLimitStore(store: RateLimitStore | undefined) {
  injected = store;
}

export async function stopRateLimiter() {
  for (const limiter of windows.values()) {
    limiter.destroy();
  }
  windows.clear();
  await stopRedis();
}

function windowLimiter(windowMs: number, redis: Awaited<ReturnType<typeof getRedis>>) {
  const existing = windows.get(windowMs);
  if (existing) return existing;
  const limiter = SlidingWindowRateLimiter.createLimiter({
    interval: windowMs,
    redis: redis as never,
  }) as RedisSlidingWindowRateLimiter;
  windows.set(windowMs, limiter);
  return limiter;
}

/**
 * Shared Redis sliding window. There is no in-memory fallback.
 * A missing REDIS_URL throws RateLimitUnavailable.
 */
export async function rateLimit(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
  if (!Number.isInteger(limit) || limit < 1) {
    throw new RateLimitUnavailable("Rate limit is invalid");
  }
  if (!Number.isInteger(windowMs) || windowMs < 1) {
    throw new RateLimitUnavailable("Rate limit is invalid");
  }

  if (injected) {
    return injected.hit(key, limit, windowMs);
  }

  try {
    const redis = await getRedis();
    const result = await windowLimiter(windowMs, redis).reserve(`blogiz:${key}`, limit);
    if (result.token) return { ok: true };
    const retryAfter = result.reset ? Math.max(1, Math.ceil(result.reset / 1000)) : 1;
    return { ok: false, retryAfter };
  } catch (error) {
    if (error instanceof RateLimitUnavailable) throw error;
    if (error instanceof RedisUnavailable) {
      throw new RateLimitUnavailable(error.message);
    }
    throw new RateLimitUnavailable("Rate limiting is unavailable");
  }
}
