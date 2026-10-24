"use client";

import { BlogEditor, type BlogEditorValues } from "@/components/dashboard/BlogEditor";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type LoadedBlog = {
  title: string;
  description: string;
  content: string;
  authorName: string;
  thumbnail?: string;
  status?: string;
  publishedAt?: string;
};

export default function EditBlogPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [blog, setBlog] = useState<LoadedBlog | null>(null);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    if (!params.id) return;
    let cancelled = false;
    fetch(`/api/blogs/${params.id}`)
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Could not load post");
        if (cancelled) return;
        setBlog({
          title: data.blog.title || "",
          description: data.blog.description || "",
          content: data.blog.content || "",
          authorName: data.blog.authorName || "",
          thumbnail: data.blog.thumbnail || "",
          status: data.blog.status || "draft",
          publishedAt: data.blog.publishedAt
            ? String(data.blog.publishedAt).slice(0, 10)
            : undefined,
        });
      })
      .catch(() => {
        if (!cancelled) setLoadError("Could not load post");
      });
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  if (loadError) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-red-700">{loadError}</p>
        <Link href="/dashboard/blogs" className="text-sm font-medium text-primary-600">
          Back to posts
        </Link>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  const handleSubmit = async (data: BlogEditorValues) => {
    const response = await fetch(`/api/blogs/${params.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: data.title,
        description: data.description,
        content: data.content,
        authorName: data.authorName,
        thumbnail: data.thumbnail ?? "",
        status: data.status,
        publishedAt: data.status === "published" ? data.publishedAt || new Date().toISOString() : undefined,
      }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(result.error || "Could not save post");
    }
    router.push("/dashboard/blogs");
    router.refresh();
  };

  return (
    <BlogEditor
      key={params.id}
      mode="edit"
      blogId={params.id}
      initialValues={{
        title: blog.title,
        description: blog.description,
        content: blog.content,
        authorName: blog.authorName,
        thumbnail: blog.thumbnail || "",
        status: blog.status === "published" ? "published" : "draft",
        publishedAt: blog.publishedAt,
      }}
      onSubmit={handleSubmit}
    />
  );
}
