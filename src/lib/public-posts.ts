import { hasPermission, type UserRole } from "@/lib/permissions";

export const PUBLIC_POST_FILTER = { status: "published" as const };

export const PUBLIC_AUTHOR_FIELDS = "name profile.fullName profile.avatar profile.bio";

export const PUBLIC_CARD_FIELDS =
  "title description authorName authorId thumbnail publishedAt tags readingTime totalLikes totalDislikes totalComments totalViews createdAt status";

export const PUBLIC_PROFILE_FIELDS = "name role profile createdAt";

export const PUBLIC_PROFILE_BLOG_FIELDS =
  "title description authorName thumbnail publishedAt tags readingTime totalLikes totalDislikes";

const STATUSES = ["draft", "published"] as const;
export type BlogStatus = (typeof STATUSES)[number];

export function isBlogStatus(value: unknown): value is BlogStatus {
  return typeof value === "string" && (STATUSES as readonly string[]).includes(value);
}

export interface PostViewer {
  id: string;
  role: UserRole;
}

/** The only filter used for anonymous and public reads. */
export function publicPostFilter(extra: Record<string, unknown> = {}) {
  return { ...PUBLIC_POST_FILTER, ...extra };
}

export function canViewPost(
  blog: { status: string; createdBy: { toString(): string }; authorId?: { toString(): string } },
  viewer?: PostViewer | null
): boolean {
  if (blog.status === "published") return true;
  if (!viewer) return false;
  const ownerId = (blog.authorId ?? blog.createdBy).toString();
  if (ownerId === viewer.id) return true;
  return hasPermission(viewer.role, "editAnyBlog");
}

/**
 * List filter. Non-public statuses are limited to the owner, or to a caller who can edit any blog.
 */
export function buildBlogListFilter(
  viewer: PostViewer | null,
  scope: string | null,
  requestedStatus: string | null
): Record<string, unknown> {
  const status = isBlogStatus(requestedStatus) ? requestedStatus : null;

  if (viewer && scope === "mine") {
    const filter: Record<string, unknown> = { authorId: viewer.id };
    if (status) filter.status = status;
    return filter;
  }

  if (viewer && status && status !== "published") {
    if (hasPermission(viewer.role, "editAnyBlog")) {
      return { status };
    }
    return { authorId: viewer.id, status };
  }

  return publicPostFilter();
}

export function resolveCreateStatus(requested?: string): BlogStatus {
  if (requested === "published") return "published";
  return "draft";
}

export function resolvePublishStatus(): {
  status: "published";
  message: string;
} {
  return {
    status: "published",
    message: "Blog published successfully",
  };
}
