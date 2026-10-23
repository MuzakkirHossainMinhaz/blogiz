import { getRedis, RedisUnavailable } from "@/lib/redis";

const KEY_PREFIX = "blogiz:cache:";

export type RedisCacheStore = {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlSeconds: number): Promise<void>;
  setNx(key: string, value: string, ttlSeconds: number): Promise<boolean>;
  del(...keys: string[]): Promise<void>;
  /** Delete keys that start with prefix (best-effort SCAN). */
  delByPrefix(prefix: string): Promise<void>;
};

let injected: RedisCacheStore | undefined;

/** Test-only. Production always uses Redis via getRedis(). */
export function setRedisCacheStore(store: RedisCacheStore | undefined) {
  injected = store;
}

export function defaultCacheTtlSeconds(): number {
  const raw = process.env.REDIS_CACHE_TTL_SECONDS?.trim();
  if (!raw) return 45;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 1) return 45;
  return Math.min(Math.trunc(n), 600);
}

export function cacheKey(...parts: Array<string | number>): string {
  return `${KEY_PREFIX}${parts.map(String).join(":")}`;
}

async function withStore<T>(fn: (store: RedisCacheStore) => Promise<T>, fallback: T): Promise<T> {
  try {
    if (injected) return await fn(injected);
    const redis = await getRedis();
    const store: RedisCacheStore = {
      async get(key) {
        return redis.get(key);
      },
      async set(key, value, ttlSeconds) {
        await redis.set(key, value, "EX", ttlSeconds);
      },
      async setNx(key, value, ttlSeconds) {
        const result = await redis.set(key, value, "EX", ttlSeconds, "NX");
        return result === "OK";
      },
      async del(...keys) {
        if (keys.length === 0) return;
        await redis.del(...keys);
      },
      async delByPrefix(prefix) {
        let cursor = "0";
        do {
          const [next, keys] = await redis.scan(cursor, "MATCH", `${prefix}*`, "COUNT", 100);
          cursor = next;
          if (keys.length > 0) await redis.del(...keys);
        } while (cursor !== "0");
      },
    };
    return await fn(store);
  } catch (error) {
    if (error instanceof RedisUnavailable) return fallback;
    return fallback;
  }
}

/** Fail-open JSON get. Returns null on miss or Redis error. */
export async function cacheGetJson<T>(key: string): Promise<T | null> {
  return withStore(async (store) => {
    const raw = await store.get(key);
    if (raw == null) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }, null);
}

/** Fail-open JSON set. No-ops on Redis error. */
export async function cacheSetJson(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  const ttl = Math.max(1, Math.trunc(ttlSeconds));
  await withStore(async (store) => {
    await store.set(key, JSON.stringify(value), ttl);
  }, undefined);
}

/** Fail-open delete. No-ops on Redis error. */
export async function cacheDel(...keys: string[]): Promise<void> {
  const unique = [...new Set(keys.filter(Boolean))];
  if (unique.length === 0) return;
  await withStore(async (store) => {
    await store.del(...unique);
  }, undefined);
}

/**
 * Fail-open prefix delete via SCAN + DEL.
 * `prefix` may be a full key prefix (e.g. `blogiz:cache:blogs:list:`).
 */
export async function cacheDelPattern(prefix: string): Promise<void> {
  if (!prefix) return;
  await withStore(async (store) => {
    await store.delByPrefix(prefix);
  }, undefined);
}

/**
 * Fail-open SET NX EX. Returns true if the key was set (first writer),
 * false if the key already existed or Redis is unavailable (caller should fall back).
 */
export async function cacheSetNx(key: string, ttlSeconds: number, value = "1"): Promise<boolean | null> {
  const ttl = Math.max(1, Math.trunc(ttlSeconds));
  return withStore(async (store) => store.setNx(key, value, ttl), null);
}
