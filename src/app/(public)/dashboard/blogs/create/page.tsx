"use client";

import { BlogEditor, type BlogEditorValues } from "@/components/dashboard/BlogEditor";
import { Button } from "@/components/ui/Button";
import { hasPermission, UserRole } from "@/lib/permissions";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { FiLock } from "react-icons/fi";

export default function CreateBlogPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const userRole = (session?.user?.role as UserRole) || "user";
  const canCreateBlog = hasPermission(userRole, "createBlog");

  useEffect(() => {
    if (status === "loading") return;
    if (!canCreateBlog) router.push("/dashboard");
  }, [canCreateBlog, router, status]);

  if (status === "loading") {
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
          You don&apos;t have permission to create blog posts. This feature is only available to authors, admins, and
          superadmins.
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
        ...data,
        blog_image: data.blog_image || undefined,
        publish_date: data.status === "published" ? data.publish_date || new Date().toISOString() : undefined,
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
