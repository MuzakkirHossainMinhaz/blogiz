import { cacheDel, cacheDelPattern, cacheKey } from "@/lib/redis-cache";

/** Public blog list pages. */
export const BLOGS_LIST_PREFIX = cacheKey("blogs", "list") + ":";

/** Public comments for a blog (visible-only pages). */
export function commentsCachePrefix(blogId: string): string {
  return cacheKey("comments", blogId) + ":";
}

export function blogDetailCacheKey(blogId: string): string {
  return cacheKey("blog", blogId);
}

export function authorProfileCachePrefix(authorId: string): string {
  return cacheKey("author", authorId) + ":";
}

export function authorStatsCacheKey(userId: string): string {
  return cacheKey("stats", userId);
}

export function authorAnalyticsCacheKey(userId: string): string {
  return cacheKey("analytics", userId);
}

export function sessionUserCacheKey(userId: string): string {
  return cacheKey("user", userId, "sess");
}

export function blogsListCacheKey(page: number, limit: number): string {
  return cacheKey("blogs", "list", `p${page}`, `l${limit}`);
}

export function authorProfileCacheKey(authorId: string, page: number, limit: number): string {
  return cacheKey("author", authorId, `p${page}`, `l${limit}`);
}

export function commentsCacheKey(blogId: string, page: number, limit: number): string {
  return cacheKey("comments", blogId, `p${page}`, `l${limit}`);
}

/** After publish / edit / unpublish / delete of a blog. */
export async function invalidateBlogCaches(options: {
  blogId?: string;
  authorId?: string;
}): Promise<void> {
  const tasks: Promise<void>[] = [cacheDelPattern(BLOGS_LIST_PREFIX)];
  if (options.blogId) {
    tasks.push(cacheDel(blogDetailCacheKey(options.blogId)));
    tasks.push(cacheDelPattern(commentsCachePrefix(options.blogId)));
  }
  if (options.authorId) {
    tasks.push(cacheDelPattern(authorProfileCachePrefix(options.authorId)));
    tasks.push(cacheDel(authorStatsCacheKey(options.authorId), authorAnalyticsCacheKey(options.authorId)));
  }
  await Promise.all(tasks);
}

/** After public profile fields change. */
export async function invalidateAuthorProfileCaches(authorId: string): Promise<void> {
  if (!authorId) return;
  await cacheDelPattern(authorProfileCachePrefix(authorId));
}

/** After comment create / hide / unhide / delete / edit. */
export async function invalidateCommentCaches(blogId: string, authorId?: string): Promise<void> {
  if (!blogId) return;
  const tasks: Promise<void>[] = [cacheDelPattern(commentsCachePrefix(blogId))];
  if (authorId) {
    tasks.push(cacheDel(authorStatsCacheKey(authorId), authorAnalyticsCacheKey(authorId)));
  }
  await Promise.all(tasks);
}

/** Must run on every sessionVersion bump (password/role/suspend/verify/etc.). */
export async function invalidateSessionUserCache(userId: string): Promise<void> {
  if (!userId) return;
  await cacheDel(sessionUserCacheKey(userId));
}
