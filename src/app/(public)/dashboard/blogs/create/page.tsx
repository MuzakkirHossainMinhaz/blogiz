"use client";

import RichTextEditor from "@/components/dashboard/RichTextEditor";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { controlClassName, fieldErrorClassName, fieldLabelClassName } from "@/lib/field-styles";
import { hasPermission, UserRole } from "@/lib/permissions";
import { renderMarkdown } from "@/lib/sanitize";
import { isCloudinaryDeliveryUrl } from "@/lib/urls";
import { BLOG_CONTENT_MAX } from "@/lib/validation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { FiCalendar, FiEye, FiLock, FiSave, FiUpload, FiUser } from "react-icons/fi";
import { z } from "zod";

const blogSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title must be less than 100 characters"),
  description: z.string().min(1, "Description is required").max(500, "Description must be less than 500 characters"),
  content: z.string().min(1, "Content is required").max(BLOG_CONTENT_MAX, "Content is too long"),
  author_name: z.string().min(1, "Author name is required").max(50, "Author name must be less than 50 characters"),
  blog_image: z
    .string()
    .refine((value) => value === "" || isCloudinaryDeliveryUrl(value), "Upload an image")
    .optional()
    .or(z.literal("")),
  status: z.enum(["draft", "published"]),
  publish_date: z.string().optional(),
});

type BlogFormData = z.infer<typeof blogSchema>;

export default function CreateBlogPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const userRole = (session?.user?.role as UserRole) || "user";
  const canCreateBlog = hasPermission(userRole, "createBlog");

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
    getValues,
    control,
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

  const watchedStatus = useWatch({ control, name: "status" });
  const watchedTitle = useWatch({ control, name: "title" });
  const watchedAuthorName = useWatch({ control, name: "author_name" });
  const watchedPublishDate = useWatch({ control, name: "publish_date" });
  const watchedBlogImage = useWatch({ control, name: "blog_image" });

  useEffect(() => {
    setValue("content", content);
  }, [content, setValue]);

  useEffect(() => {
    if (watchedStatus === "published" && !watchedPublishDate) {
      setValue("publish_date", new Date().toISOString().split("T")[0]);
    }
  }, [watchedStatus, watchedPublishDate, setValue]);

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
        await response.json();
        router.push("/dashboard/blogs");
        router.refresh();
      } else {
        const errorData = await response.json();
        setError(errorData.error || errorData.message || "Failed to create blog");
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
      const currentData = getValues();
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
      const currentData = getValues();
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
      <div className="space-y-6 ">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-xl sm:text-2xl font-bold text-neutral-900">Preview</h1>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
            <Button variant="outline" onClick={() => setShowPreview(false)} className="w-full sm:w-auto">
              Back to Edit
            </Button>
            <Button onClick={handlePublish} disabled={isSubmitting} className="w-full sm:w-auto">
              {isSubmitting ? "Publishing..." : "Publish"}
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-neutral-200 p-4 sm:p-6 md:p-8 overflow-hidden">
          <div className="max-w-4xl mx-auto min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 mb-4 break-words">{watchedTitle}</h1>
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-sm text-neutral-600 mb-6">
              <div className="flex items-center gap-1">
                <FiUser className="w-4 h-4" />
                {watchedAuthorName}
              </div>
              <div className="flex items-center gap-1">
                <FiCalendar className="w-4 h-4" />
                {watchedPublishDate || new Date().toLocaleDateString()}
              </div>
            </div>
            {watchedBlogImage && (
              <div className="relative w-full h-48 sm:h-64 mb-6 overflow-hidden rounded-lg">
                <Image
                  src={watchedBlogImage}
                  alt={watchedTitle || "Blog preview"}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 896px"
                />
              </div>
            )}
            <div className="prose max-w-none break-words">
              <div dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 ">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-neutral-900">Create New Blog Post</h1>
          <p className="text-neutral-600">Write and publish your blog content</p>
        </div>
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-3 w-full lg:w-auto">
          <Link href="/dashboard/blogs" className="col-span-1">
            <Button variant="outline" className="w-full">Cancel</Button>
          </Link>
          <Button variant="outline" onClick={handleSaveDraft} disabled={isSavingDraft || isSubmitting} className="w-full sm:w-auto">
            <FiSave className="w-4 h-4 mr-2" />
            {isSavingDraft ? "Saving..." : "Save Draft"}
          </Button>
          <Button
            onClick={() => setShowPreview(true)}
            variant="outline"
            disabled={!content || content.trim().length < 50}
            className="w-full sm:w-auto"
          >
            <FiEye className="w-4 h-4 mr-2" />
            Preview
          </Button>
          <Button onClick={handlePublish} disabled={isSubmitting || !content || content.trim().length < 50} className="w-full sm:w-auto">
            {isSubmitting ? "Publishing..." : "Publish"}
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>}

      {/* Form */}
      <div className="bg-white rounded-lg border border-neutral-200">
        <div className="p-4 sm:p-6 space-y-6">
          <Input
            {...register("title")}
            id="title"
            label="Title"
            placeholder="Enter your blog title"
            error={errors.title?.message}
            required
          />

          <Textarea
            {...register("description")}
            id="description"
            label="Description"
            rows={3}
            placeholder="Write a brief description of your blog post"
            error={errors.description?.message}
            required
          />

          <div>
            <label className={fieldLabelClassName}>
              Content <span className="text-red-500">*</span>
            </label>
            <RichTextEditor value={content} onChange={setContent} placeholder="Write your blog content here..." />
            {errors.content && <p className={fieldErrorClassName}>{errors.content.message}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              {...register("author_name")}
              id="author_name"
              label="Author Name"
              placeholder="Your name"
              icon={<FiUser className="w-4 h-4" />}
              error={errors.author_name?.message}
              required
            />

            <div>
              <label htmlFor="blog_image" className={fieldLabelClassName}>
                Featured Image URL
              </label>
              <div className="flex gap-2">
                <input
                  {...register("blog_image")}
                  type="url"
                  id="blog_image"
                  placeholder="https://example.com/image.jpg"
                  className={controlClassName({
                    error: Boolean(errors.blog_image),
                    className: "flex-1",
                  })}
                />
                <label className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-neutral-300 bg-white text-neutral-600 hover:bg-primary-50 hover:border-primary-300 hover:text-primary-700 cursor-pointer transition-colors touch-manipulation">
                  <FiUpload className="w-4 h-4" />
                  <span className="sr-only">Upload image</span>
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
              </div>
              {errors.blog_image && <p className={fieldErrorClassName}>{errors.blog_image.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Select
              {...register("status")}
              id="status"
              label="Status"
              options={[
                { value: "draft", label: "Draft" },
                { value: "published", label: "Published" },
              ]}
            />

            {watchedStatus === "published" && (
              <Input
                {...register("publish_date")}
                id="publish_date"
                type="date"
                label="Publish Date"
                icon={<FiCalendar className="w-4 h-4" />}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
