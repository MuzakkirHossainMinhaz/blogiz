import { afterEach, describe, expect, it } from "vitest";
import { rateLimit, RateLimitUnavailable, setRateLimitStore, stopRateLimiter, type RateLimitStore } from "@/lib/rate-limit";

afterEach(async () => {
  setRateLimitStore(undefined);
  await stopRateLimiter();
});

describe("rate limit store", () => {
  it("rejects the hit that exceeds the injected limit", async () => {
    const counts = new Map<string, number>();
    const store: RateLimitStore = {
      async hit(key, limit) {
        const next = (counts.get(key) ?? 0) + 1;
        counts.set(key, next);
        if (next > limit) return { ok: false, retryAfter: 30 };
        return { ok: true };
      },
    };
    setRateLimitStore(store);

    expect((await rateLimit("login:a@example.com", 2, 60_000)).ok).toBe(true);
    expect((await rateLimit("login:a@example.com", 2, 60_000)).ok).toBe(true);
    const blocked = await rateLimit("login:a@example.com", 2, 60_000);
    expect(blocked).toEqual({ ok: false, retryAfter: 30 });
  });

  it("fails closed when REDIS_URL is missing and does not count in memory", async () => {
    const previous = process.env.REDIS_URL;
    delete process.env.REDIS_URL;
    try {
      await expect(rateLimit("missing-redis", 1, 60_000)).rejects.toBeInstanceOf(RateLimitUnavailable);
      await expect(rateLimit("missing-redis", 1, 60_000)).rejects.toThrow("REDIS_URL is required");
    } finally {
      if (previous === undefined) delete process.env.REDIS_URL;
      else process.env.REDIS_URL = previous;
    }
  });
});

describe("redis sliding window", () => {
  it("enforces the limit in Redis", async () => {
    const url = process.env.REDIS_URL?.trim();
    if (!url) {
      throw new Error("REDIS_URL is required for the Redis limiter test");
    }

    const key = `ci:${Date.now()}:${Math.random().toString(16).slice(2)}`;
    expect((await rateLimit(key, 2, 60_000)).ok).toBe(true);
    expect((await rateLimit(key, 2, 60_000)).ok).toBe(true);
    const blocked = await rateLimit(key, 2, 60_000);
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) {
      expect(blocked.retryAfter).toBeGreaterThan(0);
    }
  });
});
