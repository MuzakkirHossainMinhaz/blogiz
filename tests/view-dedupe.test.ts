import { afterEach, describe, expect, it } from "vitest";
import { cacheSetNx, setRedisCacheStore, type RedisCacheStore } from "@/lib/redis-cache";

function memoryStore(): RedisCacheStore {
  const data = new Map<string, string>();
  return {
    async get(key) {
      return data.get(key) ?? null;
    },
    async set(key, value) {
      data.set(key, value);
    },
    async setNx(key, value) {
      if (data.has(key)) return false;
      data.set(key, value);
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
});

describe("view dedupe SET NX", () => {
  it("treats the first NX as a new view and later NX as already counted", async () => {
    setRedisCacheStore(memoryStore());
    const key = "blogiz:viewdedupe:507f1f77bcf86cd799439011:user-a";

    const first = await cacheSetNx(key, 3600);
    const second = await cacheSetNx(key, 3600);

    expect(first).toBe(true);
    expect(second).toBe(false);
  });

  it("returns null when Redis is unavailable so callers keep Mongo dedupe", async () => {
    const previous = process.env.REDIS_URL;
    delete process.env.REDIS_URL;
    try {
      expect(await cacheSetNx("blogiz:viewdedupe:b:s", 3600)).toBeNull();
    } finally {
      if (previous === undefined) delete process.env.REDIS_URL;
      else process.env.REDIS_URL = previous;
    }
  });
});
