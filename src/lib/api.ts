import { Blog } from "@/types";

/**
 * Generic fetch wrapper with error handling
 */
async function fetchAPI<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  try {
    // Determine the base URL based on environment
    let baseUrl = '';
    
    if (typeof window === 'undefined') {
      // Server-side: use environment variables or fallback to localhost
      baseUrl = process.env.BASE_URL || 
                 process.env.NEXTAUTH_URL || 
                 (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '') ||
                 `http://localhost:${process.env.PORT || 3000}`;
    }
    // Client-side: use relative URL (empty string)
    
    const response = await fetch(`${baseUrl}/api${endpoint}`, {
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

/**
 * Toggle like on a blog
 */
export async function toggleLike(blogId: string): Promise<{ liked: boolean; count: number }> {
  return fetchAPI<{ liked: boolean; count: number }>("/likes", {
    method: "POST",
    body: JSON.stringify({ blogId }),
    cache: "no-store",
  });
}

/**
 * Check if user has liked a blog
 */
export async function checkLikeStatus(blogId: string): Promise<{ liked: boolean }> {
  return fetchAPI<{ liked: boolean }>(`/likes/check?blogId=${blogId}`, {
    cache: "no-store",
  });
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
