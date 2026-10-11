"use client";

import { BlogEditor, type BlogEditorValues } from "@/components/dashboard/BlogEditor";
import { Button } from "@/components/ui/Button";
import { useSessionStatus } from "@/hooks/useSessionStatus";
import { hasPermission, UserRole } from "@/lib/permissions";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { FiLock } from "react-icons/fi";

export default function CreateBlogPage() {
  const router = useRouter();
  const { session, isInitialLoading } = useSessionStatus();
  const userRole = (session?.user?.role as UserRole) || "reader";
  const canCreateBlog = hasPermission(userRole, "createBlog");

  useEffect(() => {
    if (isInitialLoading) return;
    if (!canCreateBlog) router.push("/dashboard");
  }, [canCreateBlog, isInitialLoading, router]);

  if (isInitialLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!canCreateBlog) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
          <FiLock className="w-10 h-10 text-red-600" />
        </div>
        <h1 className="text-2xl font-bold text-neutral-900 mb-2">Access Denied</h1>
        <p className="text-neutral-600 mb-6 max-w-md">
          You don&apos;t have permission to create blog posts. This feature is only available to authors and admins.
        </p>
        <div className="space-y-3">
          <Link href="/dashboard">
            <Button variant="primary">Go to Dashboard</Button>
          </Link>
          <div className="text-sm text-neutral-500 mt-4">
            Want to become an author?{" "}
            <Link href="/dashboard/settings" className="text-primary-600 hover:underline">
              Request author role
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (data: BlogEditorValues) => {
    const response = await fetch("/api/blogs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: data.title,
        description: data.description,
        content: data.content,
        authorName: data.authorName,
        thumbnail: data.thumbnail || undefined,
        status: data.status,
        publishedAt: data.status === "published" ? data.publishedAt || new Date().toISOString() : undefined,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.message || "Failed to create blog");
    }

    router.push("/dashboard/blogs");
    router.refresh();
  };

  return <BlogEditor mode="create" onSubmit={handleSubmit} />;
}
