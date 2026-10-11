import Redis from "ioredis";

let client: Redis | undefined;

export class RedisUnavailable extends Error {
  constructor(message = "Redis is unavailable") {
    super(message);
    this.name = "RedisUnavailable";
  }
}

function redisClient(): Redis {
  const url = process.env.REDIS_URL?.trim();
  if (!url) {
    throw new RedisUnavailable("REDIS_URL is required");
  }
  if (!client) {
    client = new Redis(url, {
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      connectTimeout: 2_000,
      lazyConnect: true,
    });
    client.on("error", () => {
      // Callers fail closed when a command rejects.
    });
  }
  return client;
}

/** Shared Redis connection for rate limits, reaction cache, etc. */
export async function getRedis(): Promise<Redis> {
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

export async function stopRedis() {
  if (!client) return;
  const current = client;
  client = undefined;
  current.disconnect();
}
