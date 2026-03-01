"use client";

import RichTextEditor from "@/components/dashboard/RichTextEditor";
import { Button } from "@/components/ui/Button";
import { hasPermission, UserRole } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { FiCalendar, FiEye, FiLock, FiSave, FiUpload, FiUser } from "react-icons/fi";
import { z } from "zod";

const blogSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title must be less than 100 characters"),
  description: z.string().min(1, "Description is required").max(500, "Description must be less than 500 characters"),
  content: z.string().min(1, "Content is required"),
  author_name: z.string().min(1, "Author name is required").max(50, "Author name must be less than 50 characters"),
  blog_image: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  status: z.enum(["draft", "published"]),
  publish_date: z.string().optional(),
});

type BlogFormData = z.infer<typeof blogSchema>;

// Extend session user type
declare module "next-auth" {
  interface User {
    role?: string;
  }
}

export default function CreateBlogPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const userRole = (session?.user?.role as UserRole) || "user";
  const canCreateBlog = hasPermission(userRole, "createBlog");

  // Redirect if user doesn't have permission
  useEffect(() => {
    if (status === "loading") return;
    if (!canCreateBlog) {
      router.push("/dashboard");
    }
  }, [canCreateBlog, router, status]);

  // Show loading state while checking session
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Show access denied for users without permission
  if (!canCreateBlog) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
          <FiLock className="w-10 h-10 text-red-600" />
        </div>
        <h1 className="text-2xl font-bold text-neutral-900 mb-2">Access Denied</h1>
        <p className="text-neutral-600 mb-6 max-w-md">
          You don't have permission to create blog posts. This feature is only available to authors, admins, and
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

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [content, setContent] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    trigger,
  } = useForm<BlogFormData>({
    resolver: zodResolver(blogSchema),
    defaultValues: {
      title: "",
      description: "",
      content: "",
      author_name: "",
      blog_image: "",
      status: "draft",
      publish_date: new Date().toISOString().split("T")[0],
    },
  });

  const watchedStatus = watch("status");
  const watchedContent = watch("content");

  useEffect(() => {
    setValue("content", content);
  }, [content, setValue]);

  useEffect(() => {
    if (watchedStatus === "published" && !watch("publish_date")) {
      setValue("publish_date", new Date().toISOString().split("T")[0]);
    }
  }, [watchedStatus, setValue, watch]);

  const onSubmit = async (data: BlogFormData, isDraft: boolean = false) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const submitData = {
        ...data,
        status: isDraft ? "draft" : data.status,
        publish_date: data.status === "published" ? data.publish_date || new Date().toISOString() : undefined,
      };

      const response = await fetch("/api/blogs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submitData),
      });

      if (response.ok) {
        const result = await response.json();
        router.push("/dashboard/blogs");
        router.refresh();
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Failed to create blog");
      }
    } catch (error) {
      console.error("Failed to create blog:", error);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
      setIsSavingDraft(false);
    }
  };

  const handleSaveDraft = async () => {
    setIsSavingDraft(true);
    const isValid = await trigger();
    if (isValid) {
      const currentData = watch();
      onSubmit({ ...currentData, status: "draft" }, true);
    } else {
      setIsSavingDraft(false);
    }
  };

  const handlePublish = async () => {
    // Validate content before publishing
    if (!content || content.trim().length < 50) {
      setError("Please add more content before publishing (minimum 50 characters)");
      return;
    }

    const isValid = await trigger();
    if (isValid) {
      const currentData = watch();
      onSubmit({ ...currentData, status: "published" });
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be less than 5MB");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        setValue("blog_image", result.url);
      } else {
        setError("Failed to upload image");
      }
    } catch (error) {
      console.error("Failed to upload image:", error);
      setError("Failed to upload image");
    }
  };

  if (showPreview) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-neutral-900">Preview</h1>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setShowPreview(false)}>
              Back to Edit
            </Button>
            <Button onClick={handlePublish} disabled={isSubmitting}>
              {isSubmitting ? "Publishing..." : "Publish"}
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-neutral-200 p-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-neutral-900 mb-4">{watch("title")}</h1>
            <div className="flex items-center gap-4 text-sm text-neutral-600 mb-6">
              <div className="flex items-center gap-1">
                <FiUser className="w-4 h-4" />
                {watch("author_name")}
              </div>
              <div className="flex items-center gap-1">
                <FiCalendar className="w-4 h-4" />
                {watch("publish_date") || new Date().toLocaleDateString()}
              </div>
            </div>
            {watch("blog_image") && (
              <img
                src={watch("blog_image")}
                alt={watch("title")}
                className="w-full h-64 object-cover rounded-lg mb-6"
              />
            )}
            <div className="prose max-w-none">
              <div dangerouslySetInnerHTML={{ __html: content }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Create New Blog Post</h1>
          <p className="text-neutral-600">Write and publish your blog content</p>
        </div>
        <div className="flex gap-3">
          <Link href="/dashboard/blogs">
            <Button variant="outline">Cancel</Button>
          </Link>
          <Button variant="outline" onClick={handleSaveDraft} disabled={isSavingDraft || isSubmitting}>
            <FiSave className="w-4 h-4 mr-2" />
            {isSavingDraft ? "Saving..." : "Save Draft"}
          </Button>
          <Button
            onClick={() => setShowPreview(true)}
            variant="outline"
            disabled={!content || content.trim().length < 50}
          >
            <FiEye className="w-4 h-4 mr-2" />
            Preview
          </Button>
          <Button onClick={handlePublish} disabled={isSubmitting || !content || content.trim().length < 50}>
            {isSubmitting ? "Publishing..." : "Publish"}
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>}

      {/* Form */}
      <div className="bg-white rounded-lg border border-neutral-200">
        <div className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-neutral-700 mb-2">
              Title *
            </label>
            <input
              {...register("title")}
              type="text"
              id="title"
              placeholder="Enter your blog title"
              className={cn(
                "w-full px-4 py-2 border rounded-lg font-medium transition-all duration-200",
                "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2",
                errors.title
                  ? "border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500"
                  : "border-neutral-300 text-neutral-900 placeholder-neutral-400 focus:border-primary-500"
              )}
            />
            {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-neutral-700 mb-2">
              Description *
            </label>
            <textarea
              {...register("description")}
              id="description"
              rows={3}
              placeholder="Write a brief description of your blog post"
              className={cn(
                "w-full px-4 py-2 border rounded-lg font-medium transition-all duration-200",
                "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2",
                errors.description
                  ? "border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500"
                  : "border-neutral-300 text-neutral-900 placeholder-neutral-400 focus:border-primary-500"
              )}
            />
            {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>}
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">Content *</label>
            <RichTextEditor value={content} onChange={setContent} placeholder="Write your blog content here..." />
            {errors.content && <p className="mt-1 text-sm text-red-600">{errors.content.message}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Author Name */}
            <div>
              <label htmlFor="author_name" className="block text-sm font-medium text-neutral-700 mb-2">
                Author Name *
              </label>
              <div className="relative">
                <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-4 h-4" />
                <input
                  {...register("author_name")}
                  type="text"
                  id="author_name"
                  placeholder="Your name"
                  className={cn(
                    "w-full pl-10 pr-4 py-2 border rounded-lg font-medium transition-all duration-200",
                    "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2",
                    errors.author_name
                      ? "border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500"
                      : "border-neutral-300 text-neutral-900 placeholder-neutral-400 focus:border-primary-500"
                  )}
                />
              </div>
              {errors.author_name && <p className="mt-1 text-sm text-red-600">{errors.author_name.message}</p>}
            </div>

            {/* Blog Image URL */}
            <div>
              <label htmlFor="blog_image" className="block text-sm font-medium text-neutral-700 mb-2">
                Featured Image URL
              </label>
              <div className="flex gap-2">
                <input
                  {...register("blog_image")}
                  type="url"
                  id="blog_image"
                  placeholder="https://example.com/image.jpg"
                  className={cn(
                    "flex-1 px-4 py-2 border rounded-lg font-medium transition-all duration-200",
                    "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2",
                    errors.blog_image
                      ? "border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500"
                      : "border-neutral-300 text-neutral-900 placeholder-neutral-400 focus:border-primary-500"
                  )}
                />
                <label className="px-4 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50 cursor-pointer transition-colors">
                  <FiUpload className="w-4 h-4" />
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
              </div>
              {errors.blog_image && <p className="mt-1 text-sm text-red-600">{errors.blog_image.message}</p>}
            </div>
          </div>

          {/* Status and Publish Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-neutral-700 mb-2">
                Status
              </label>
              <select
                {...register("status")}
                id="status"
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>

            {watchedStatus === "published" && (
              <div>
                <label htmlFor="publish_date" className="block text-sm font-medium text-neutral-700 mb-2">
                  Publish Date
                </label>
                <div className="relative">
                  <FiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-4 h-4" />
                  <input
                    {...register("publish_date")}
                    type="date"
                    id="publish_date"
                    className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
