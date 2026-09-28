import { Blog } from "@/types";
import type { ReactionKind } from "@/lib/validation";

export type { ReactionKind };

/**
 * Generic fetch wrapper with error handling
 * Uses relative URLs - works in both client and server components
 */
async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  try {
    const response = await fetch(`/api${endpoint}`, {
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("API Fetch Error:", error);
    throw error;
  }
}

/**
 * Fetch all blogs (published only for public view)
 */
export async function fetchBlogs(revalidate?: number): Promise<Blog[]> {
  const response = await fetchAPI<{ blogs: Blog[] }>("/blogs", {
    next: { revalidate: revalidate || 30 },
  });
  return response.blogs;
}

/**
 * Fetch single blog by ID
 */
export async function fetchBlogById(id: string): Promise<Blog> {
  const response = await fetchAPI<{ blog: Blog }>(`/blogs/${id}`, {
    cache: "no-store",
  });
  return response.blog;
}

/**
 * Create new blog (authenticated)
 */
export async function createBlog(data: Omit<Blog, "_id">): Promise<Blog> {
  const response = await fetchAPI<{ blog: Blog }>("/blogs", {
    method: "POST",
    body: JSON.stringify(data),
    cache: "no-store",
  });
  return response.blog;
}

/**
 * Update blog (authenticated)
 */
export async function updateBlog(id: string, data: Partial<Blog>): Promise<Blog> {
  const response = await fetchAPI<{ blog: Blog }>(`/blogs/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
    cache: "no-store",
  });
  return response.blog;
}

/**
 * Delete blog (authenticated)
 */
export async function deleteBlog(id: string): Promise<void> {
  await fetchAPI<void>(`/blogs/${id}`, {
    method: "DELETE",
    cache: "no-store",
  });
}

export interface ReactionState {
  reaction: ReactionKind | null;
  total_likes: number;
  total_dislikes: number;
}

async function readJson(response: Response): Promise<Record<string, unknown>> {
  const data = await response.json().catch(() => ({}));
  return data && typeof data === "object" ? (data as Record<string, unknown>) : {};
}

/**
 * Save a like or dislike. Sending the current reaction again removes it.
 */
export async function setReaction(blogId: string, reaction: ReactionKind): Promise<ReactionState> {
  const response = await fetch("/api/likes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ blogId, reaction }),
    cache: "no-store",
  });
  const data = await readJson(response);
  if (!response.ok) {
    throw new Error(typeof data.error === "string" ? data.error : "Could not save reaction");
  }
  return {
    reaction: data.reaction === "like" || data.reaction === "dislike" ? data.reaction : null,
    total_likes: typeof data.total_likes === "number" ? data.total_likes : 0,
    total_dislikes: typeof data.total_dislikes === "number" ? data.total_dislikes : 0,
  };
}

/**
 * The signed-in user's reaction on a blog, plus both counts.
 */
export async function getReaction(blogId: string): Promise<ReactionState> {
  const response = await fetch(`/api/likes/check?blogId=${encodeURIComponent(blogId)}`, {
    cache: "no-store",
  });
  const data = await readJson(response);
  if (!response.ok) {
    throw new Error(typeof data.error === "string" ? data.error : "Could not load reaction");
  }
  return {
    reaction: data.reaction === "like" || data.reaction === "dislike" ? data.reaction : null,
    total_likes: typeof data.total_likes === "number" ? data.total_likes : 0,
    total_dislikes: typeof data.total_dislikes === "number" ? data.total_dislikes : 0,
  };
}

/**
 * Get blog statistics (authenticated)
 */
export async function getBlogStats(): Promise<{
  totalBlogs: number;
  publishedBlogs: number;
  draftBlogs: number;
  totalLikes: number;
  recentBlogs: Blog[];
}> {
  return fetchAPI("/blogs/stats", {
    cache: "no-store",
  });
}

/**
 * Upload image file
 */
export async function uploadImage(file: File): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Upload Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}
