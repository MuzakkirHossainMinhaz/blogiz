import Redis from "ioredis";
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
let client: Redis | undefined;
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
  if (client) {
    const current = client;
    client = undefined;
    current.disconnect();
  }
}

function redisClient(): Redis {
  const url = process.env.REDIS_URL?.trim();
  if (!url) {
    throw new RateLimitUnavailable("REDIS_URL is required");
  }
  if (!client) {
    client = new Redis(url, {
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      connectTimeout: 2_000,
      lazyConnect: true,
    });
    client.on("error", () => {
      // Callers fail closed when a command rejects. Do not buffer or fall back.
    });
  }
  return client;
}

async function readyClient(): Promise<Redis> {
  const redis = redisClient();
  if (redis.status === "wait") {
    await redis.connect();
  }
  if (redis.status === "ready") return redis;
  await new Promise<void>((resolve, reject) => {
    const onReady = () => {
      redis.off("error", onError);
      resolve();
    };
    const onError = (error: Error) => {
      redis.off("ready", onReady);
      reject(error);
    };
    redis.once("ready", onReady);
    redis.once("error", onError);
  });
  return redis;
}

function windowLimiter(windowMs: number, redis: Redis) {
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
    const redis = await readyClient();
    const result = await windowLimiter(windowMs, redis).reserve(`blogiz:${key}`, limit);
    if (result.token) return { ok: true };
    const retryAfter = result.reset ? Math.max(1, Math.ceil(result.reset / 1000)) : 1;
    return { ok: false, retryAfter };
  } catch (error) {
    if (error instanceof RateLimitUnavailable) throw error;
    throw new RateLimitUnavailable("Rate limiting is unavailable");
  }
}
