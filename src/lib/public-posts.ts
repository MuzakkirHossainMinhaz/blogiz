import { hasPermission, type UserRole } from "@/lib/permissions";

export const PUBLIC_POST_FILTER = { status: "published" as const, isApproved: true };

export const PUBLIC_AUTHOR_FIELDS = "name profile.fullName profile.avatar profile.bio";

export const PUBLIC_CARD_FIELDS =
  "title description author_name authorId blog_image publish_date tags readingTime total_likes total_comments total_views createdAt status isApproved";

const STATUSES = ["draft", "pending", "published", "rejected"] as const;
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
  blog: { status: string; isApproved: boolean; createdBy: { toString(): string } },
  viewer?: PostViewer | null
): boolean {
  if (blog.status === "published" && blog.isApproved) return true;
  if (!viewer) return false;
  if (blog.createdBy.toString() === viewer.id) return true;
  return hasPermission(viewer.role, "approveBlog");
}

/**
 * List filter. Non-public statuses are limited to the owner, or to a caller who can approve posts.
 */
export function buildBlogListFilter(
  viewer: PostViewer | null,
  scope: string | null,
  requestedStatus: string | null
): Record<string, unknown> {
  const status = isBlogStatus(requestedStatus) ? requestedStatus : null;

  if (viewer && scope === "mine") {
    const filter: Record<string, unknown> = { createdBy: viewer.id };
    if (status) filter.status = status;
    return filter;
  }

  if (viewer && status && status !== "published") {
    if (hasPermission(viewer.role, "approveBlog")) {
      return { status };
    }
    return { createdBy: viewer.id, status };
  }

  return publicPostFilter();
}

export function resolveCreateStatus(role: UserRole, requested?: string): { status: BlogStatus; isApproved: boolean } {
  const asked = isBlogStatus(requested) ? requested : "draft";

  if (asked === "published") {
    if (hasPermission(role, "approveBlog")) {
      return { status: "published", isApproved: true };
    }
    return { status: "pending", isApproved: false };
  }

  if (asked === "rejected" || asked === "pending") {
    if (!hasPermission(role, "approveBlog") && asked === "rejected") {
      return { status: "draft", isApproved: false };
    }
    return { status: asked === "pending" ? "pending" : "rejected", isApproved: false };
  }

  return { status: "draft", isApproved: false };
}

/** Client status is applied only when the caller can approve posts. */
export function resolveUpdateStatus(
  role: UserRole,
  requested: unknown
): { status: BlogStatus; isApproved: boolean } | null {
  if (!hasPermission(role, "approveBlog") || !isBlogStatus(requested)) {
    return null;
  }
  if (requested === "published") return { status: "published", isApproved: true };
  return { status: requested, isApproved: false };
}

export function resolvePublishStatus(role: UserRole): {
  status: "published" | "pending";
  isApproved: boolean;
  message: string;
} {
  if (hasPermission(role, "approveBlog")) {
    return {
      status: "published",
      isApproved: true,
      message: "Blog published successfully",
    };
  }
  return {
    status: "pending",
    isApproved: false,
    message: "Blog submitted for approval",
  };
}
