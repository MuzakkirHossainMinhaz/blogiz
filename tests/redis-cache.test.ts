import { afterEach, describe, expect, it } from "vitest";
import {
  cacheDel,
  cacheDelPattern,
  cacheGetJson,
  cacheKey,
  cacheSetJson,
  cacheSetNx,
  defaultCacheTtlSeconds,
  setRedisCacheStore,
  type RedisCacheStore,
} from "@/lib/redis-cache";

function memoryStore(): RedisCacheStore & { data: Map<string, { value: string; expiresAt?: number }> } {
  const data = new Map<string, { value: string; expiresAt?: number }>();

  function alive(key: string): string | null {
    const entry = data.get(key);
    if (!entry) return null;
    if (entry.expiresAt !== undefined && entry.expiresAt <= Date.now()) {
      data.delete(key);
      return null;
    }
    return entry.value;
  }

  return {
    data,
    async get(key) {
      return alive(key);
    },
    async set(key, value, ttlSeconds) {
      data.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
    },
    async setNx(key, value, ttlSeconds) {
      if (alive(key) !== null) return false;
      data.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
      return true;
    },
    async del(...keys) {
      for (const key of keys) data.delete(key);
    },
    async delByPrefix(prefix) {
      for (const key of [...data.keys()]) {
        if (key.startsWith(prefix)) data.delete(key);
      }
    },
  };
}

afterEach(() => {
  setRedisCacheStore(undefined);
  delete process.env.REDIS_CACHE_TTL_SECONDS;
});

describe("redis-cache helper", () => {
  it("round-trips JSON through an injected store", async () => {
    const store = memoryStore();
    setRedisCacheStore(store);

    const key = cacheKey("blogs", "list", "p1", "l12");
    expect(await cacheGetJson(key)).toBeNull();

    await cacheSetJson(key, { blogs: [{ id: "1" }], total: 1 }, 45);
    expect(await cacheGetJson<{ blogs: Array<{ id: string }>; total: number }>(key)).toEqual({
      blogs: [{ id: "1" }],
      total: 1,
    });
  });

  it("deletes keys and patterns", async () => {
    const store = memoryStore();
    setRedisCacheStore(store);

    await cacheSetJson(cacheKey("blogs", "list", "p1", "l12"), { a: 1 }, 45);
    await cacheSetJson(cacheKey("blogs", "list", "p2", "l12"), { a: 2 }, 45);
    await cacheSetJson(cacheKey("blog", "abc"), { id: "abc" }, 45);

    await cacheDel(cacheKey("blog", "abc"));
    expect(await cacheGetJson(cacheKey("blog", "abc"))).toBeNull();

    await cacheDelPattern(cacheKey("blogs", "list") + ":");
    expect(await cacheGetJson(cacheKey("blogs", "list", "p1", "l12"))).toBeNull();
    expect(await cacheGetJson(cacheKey("blogs", "list", "p2", "l12"))).toBeNull();
  });

  it("SET NX returns true once then false", async () => {
    const store = memoryStore();
    setRedisCacheStore(store);

    const key = "blogiz:viewdedupe:blog1:user1";
    expect(await cacheSetNx(key, 3600)).toBe(true);
    expect(await cacheSetNx(key, 3600)).toBe(false);
  });

  it("fails open when REDIS_URL is missing (no injected store)", async () => {
    const previous = process.env.REDIS_URL;
    delete process.env.REDIS_URL;
    try {
      expect(await cacheGetJson("blogiz:cache:anything")).toBeNull();
      await cacheSetJson("blogiz:cache:anything", { ok: true }, 45);
      await cacheDel("blogiz:cache:anything");
      await cacheDelPattern("blogiz:cache:");
      expect(await cacheSetNx("blogiz:viewdedupe:x:y", 60)).toBeNull();
    } finally {
      if (previous === undefined) delete process.env.REDIS_URL;
      else process.env.REDIS_URL = previous;
    }
  });

  it("defaultCacheTtlSeconds reads env with safe fallback", () => {
    expect(defaultCacheTtlSeconds()).toBe(45);
    process.env.REDIS_CACHE_TTL_SECONDS = "60";
    expect(defaultCacheTtlSeconds()).toBe(60);
    process.env.REDIS_CACHE_TTL_SECONDS = "0";
    expect(defaultCacheTtlSeconds()).toBe(45);
    process.env.REDIS_CACHE_TTL_SECONDS = "nope";
    expect(defaultCacheTtlSeconds()).toBe(45);
  });
});
