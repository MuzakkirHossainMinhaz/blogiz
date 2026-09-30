"use client";

import { BlogEditor, type BlogEditorValues } from "@/components/dashboard/BlogEditor";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type LoadedBlog = {
  title: string;
  description: string;
  content: string;
  author_name: string;
  blog_image?: string;
  status?: string;
  publish_date?: string;
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
          author_name: data.blog.author_name || "",
          blog_image: data.blog.blog_image || "",
          status: data.blog.status || "draft",
          publish_date: data.blog.publish_date
            ? String(data.blog.publish_date).slice(0, 10)
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
        author_name: data.author_name,
        blog_image: data.blog_image ?? "",
        status: data.status,
        publish_date: data.status === "published" ? data.publish_date || new Date().toISOString() : undefined,
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
      initialValues={{
        title: blog.title,
        description: blog.description,
        content: blog.content,
        author_name: blog.author_name,
        blog_image: blog.blog_image || "",
        status: blog.status === "published" ? "published" : "draft",
        publish_date: blog.publish_date,
      }}
      onSubmit={handleSubmit}
    />
  );
}
