import { getRedis, RedisUnavailable } from "@/lib/redis";
import type { ReactionKind } from "@/lib/validation";

export type ReactionCacheState = {
  reaction: ReactionKind | null;
  totalLikes: number;
  totalDislikes: number;
};

const COUNTS_KEY = (blogId: string) => `blogiz:reaction:counts:${blogId}`;
const USER_KEY = (blogId: string, userId: string) => `blogiz:reaction:user:${blogId}:${userId}`;
const TTL_SECONDS = 60 * 60 * 24 * 7;

function parseReaction(value: string | null): ReactionKind | null | undefined {
  if (value === null) return undefined;
  if (value === "" || value === "none") return null;
  if (value === "like" || value === "dislike") return value;
  return undefined;
}

/** Best-effort read. Returns null on miss or when Redis is down. */
export async function getCachedReaction(
  blogId: string,
  userId: string
): Promise<ReactionCacheState | null> {
  try {
    const redis = await getRedis();
    const [counts, userValue] = await Promise.all([
      redis.hgetall(COUNTS_KEY(blogId)),
      redis.get(USER_KEY(blogId, userId)),
    ]);

    if (!counts || counts.likes === undefined || counts.dislikes === undefined) {
      return null;
    }
    const reaction = parseReaction(userValue);
    if (reaction === undefined) return null;

    const totalLikes = Number(counts.likes);
    const totalDislikes = Number(counts.dislikes);
    if (!Number.isFinite(totalLikes) || !Number.isFinite(totalDislikes)) return null;

    return {
      reaction,
      totalLikes: Math.max(0, Math.trunc(totalLikes)),
      totalDislikes: Math.max(0, Math.trunc(totalDislikes)),
    };
  } catch (error) {
    if (error instanceof RedisUnavailable) return null;
    return null;
  }
}

/** Best-effort write after Mongo persists the source of truth. */
export async function setCachedReaction(
  blogId: string,
  userId: string,
  state: ReactionCacheState
): Promise<void> {
  try {
    const redis = await getRedis();
    const pipeline = redis.pipeline();
    pipeline.hset(COUNTS_KEY(blogId), {
      likes: String(Math.max(0, state.totalLikes)),
      dislikes: String(Math.max(0, state.totalDislikes)),
    });
    pipeline.expire(COUNTS_KEY(blogId), TTL_SECONDS);
    pipeline.set(USER_KEY(blogId, userId), state.reaction ?? "none", "EX", TTL_SECONDS);
    await pipeline.exec();
  } catch {
    // Cache is optional — Mongo remains authoritative.
  }
}
