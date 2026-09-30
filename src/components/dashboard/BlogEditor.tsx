"use client";

import { FeaturedCoverField } from "@/components/dashboard/FeaturedCoverField";
import RichTextEditor from "@/components/dashboard/RichTextEditor";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { FieldRequiredMark } from "@/components/ui/FieldRequiredMark";
import { fieldErrorClassName, fieldLabelClassName } from "@/lib/field-styles";
import { renderMarkdown } from "@/lib/sanitize";
import { isCloudinaryDeliveryUrl } from "@/lib/urls";
import { BLOG_CONTENT_MAX } from "@/lib/validation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { FiCalendar, FiEye, FiSave } from "react-icons/fi";
import { z } from "zod";

const blogSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title must be less than 100 characters"),
  description: z.string().min(1, "Description is required").max(500, "Description must be less than 500 characters"),
  content: z.string().min(1, "Content is required").max(BLOG_CONTENT_MAX, "Content is too long"),
  author_name: z.string().min(1, "Set your name in Settings").max(50),
  blog_image: z
    .string()
    .refine((value) => value === "" || isCloudinaryDeliveryUrl(value), "Upload or generate a cover")
    .optional()
    .or(z.literal("")),
  status: z.enum(["draft", "published"]),
  publish_date: z.string().optional(),
});

export type BlogEditorValues = z.infer<typeof blogSchema>;

export type BlogEditorProps = {
  mode: "create" | "edit";
  initialValues?: Partial<BlogEditorValues>;
  cancelHref?: string;
  onSubmit: (data: BlogEditorValues) => Promise<void>;
};

export function BlogEditor({
  mode,
  initialValues,
  cancelHref = "/dashboard/blogs",
  onSubmit,
}: BlogEditorProps) {
  const { data: session } = useSession();
  const profileName = (session?.user?.name || "").trim().slice(0, 50);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [content, setContent] = useState(initialValues?.content ?? "");

  const {
    register,
    formState: { errors },
    setValue,
    getValues,
    control,
    trigger,
  } = useForm<BlogEditorValues>({
    resolver: zodResolver(blogSchema),
    defaultValues: {
      title: initialValues?.title ?? "",
      description: initialValues?.description ?? "",
      content: initialValues?.content ?? "",
      author_name: profileName || initialValues?.author_name || "",
      blog_image: initialValues?.blog_image ?? "",
      status: initialValues?.status === "published" ? "published" : "draft",
      publish_date:
        initialValues?.publish_date?.slice(0, 10) ?? new Date().toISOString().split("T")[0],
    },
  });

  const watchedTitle = useWatch({ control, name: "title" });
  const watchedAuthorName = useWatch({ control, name: "author_name" });
  const watchedPublishDate = useWatch({ control, name: "publish_date" });
  const watchedBlogImage = useWatch({ control, name: "blog_image" });

  useEffect(() => {
    if (profileName) {
      setValue("author_name", profileName, { shouldValidate: true });
    }
  }, [profileName, setValue]);

  useEffect(() => {
    setValue("content", content, { shouldValidate: false });
  }, [content, setValue]);

  const ensureAuthorName = () => {
    if (profileName) {
      setValue("author_name", profileName, { shouldValidate: true });
      return true;
    }
    setError("Set your name in Settings before saving a post.");
    return false;
  };

  const submit = async (data: BlogEditorValues) => {
    if (!ensureAuthorName()) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit({ ...data, author_name: profileName || data.author_name });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
      setIsSavingDraft(false);
    }
  };

  const handleSaveDraft = async () => {
    setIsSavingDraft(true);
    if (!ensureAuthorName()) {
      setIsSavingDraft(false);
      return;
    }
    const isValid = await trigger();
    if (!isValid) {
      setIsSavingDraft(false);
      return;
    }
    const current = getValues();
    await submit({ ...current, status: "draft", author_name: profileName });
  };

  const handlePublish = async () => {
    if (!content || content.trim().length < 50) {
      setError("Please add more content before publishing (minimum 50 characters)");
      return;
    }
    if (!ensureAuthorName()) return;
    const isValid = await trigger();
    if (!isValid) return;
    const current = getValues();
    const publishDate = current.publish_date || new Date().toISOString().split("T")[0];
    await submit({
      ...current,
      status: "published",
      publish_date: publishDate,
      author_name: profileName,
    });
  };

  const actionsBusy = isSubmitting || isSavingDraft;
  const canPreview = Boolean(content && content.trim().length >= 50);

  if (showPreview) {
    return (
      <div className="space-y-6">
        <div className="sticky top-14 sm:top-16 z-20 -mx-3 sm:-mx-6 lg:-mx-8 px-3 sm:px-6 lg:px-8 py-3 bg-paper/95 backdrop-blur-md">
          <DashboardPageHeader
            title="Preview"
            actions={
              <>
                <Button variant="outline" onClick={() => setShowPreview(false)} className="w-full sm:w-auto">
                  Back To Edit
                </Button>
                <Button onClick={() => void handlePublish()} disabled={actionsBusy} className="w-full sm:w-auto">
                  {isSubmitting ? "Publishing…" : "Publish"}
                </Button>
              </>
            }
          />
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-4 sm:p-6 md:p-8 overflow-hidden">
          <div className="max-w-3xl mx-auto min-w-0">
            <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-ink mb-4 break-words">
              {watchedTitle || "Untitled"}
            </h1>
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-sm text-accent-500 mb-6">
              <div className="flex items-center gap-1.5">
                <UserAvatar src={session?.user?.avatar} name={watchedAuthorName} size="sm" />
                {watchedAuthorName || "Author"}
              </div>
              <div className="flex items-center gap-1.5">
                <FiCalendar className="w-4 h-4" />
                {watchedPublishDate || new Date().toLocaleDateString()}
              </div>
            </div>
            {watchedBlogImage ? (
              <div className="relative w-full aspect-[16/9] mb-6 overflow-hidden rounded-xl">
                <Image
                  src={watchedBlogImage}
                  alt={watchedTitle || "Blog preview"}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 768px"
                />
              </div>
            ) : null}
            <div className="prose max-w-none break-words">
              <div dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="sticky top-14 sm:top-16 z-20 -mx-3 sm:-mx-6 lg:-mx-8 px-3 sm:px-6 lg:px-8 py-3 bg-paper/95 backdrop-blur-md">
        <DashboardPageHeader
          title={mode === "create" ? "Write A New Post" : "Edit Post"}
          description={
            mode === "create"
              ? "Draft your story, add a cover, then publish when ready."
              : "Update content, cover, and publishing details."
          }
          actions={
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-3 w-full lg:w-auto">
              <Link href={cancelHref} className="col-span-1">
                <Button variant="outline" className="w-full">
                  Cancel
                </Button>
              </Link>
              <Button
                variant="outline"
                onClick={() => void handleSaveDraft()}
                disabled={actionsBusy}
                className="w-full sm:w-auto"
              >
                <FiSave className="w-4 h-4" />
                {isSavingDraft ? "Saving…" : "Save Draft"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowPreview(true)}
                disabled={!canPreview}
                className="w-full sm:w-auto"
              >
                <FiEye className="w-4 h-4" />
                Preview
              </Button>
              <Button
                onClick={() => void handlePublish()}
                disabled={actionsBusy || !canPreview}
                className="w-full sm:w-auto col-span-2 sm:col-span-1"
              >
                {isSubmitting ? "Publishing…" : "Publish"}
              </Button>
            </div>
          }
        />
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : null}

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_20rem] gap-6 items-stretch">
        <div className="space-y-6 rounded-xl border border-neutral-200 bg-white p-4 sm:p-6 h-full">
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
              Content
              <FieldRequiredMark />
            </label>
            <RichTextEditor value={content} onChange={setContent} placeholder="Write your blog content here…" />
            {errors.content ? <p className={fieldErrorClassName}>{errors.content.message}</p> : null}
          </div>
        </div>

        <aside className="flex flex-col gap-6 h-full min-h-0">
          <div className="flex-1 min-h-0 flex flex-col rounded-xl border border-neutral-200 bg-white p-4 sm:p-5">
            <FeaturedCoverField
              value={watchedBlogImage || ""}
              title={watchedTitle || ""}
              onChange={(url) => setValue("blog_image", url, { shouldValidate: true, shouldDirty: true })}
              error={errors.blog_image?.message}
              disabled={actionsBusy}
              className="flex-1"
            />
          </div>

          <div className="shrink-0 rounded-xl border border-neutral-200 bg-white p-4 sm:p-5">
            <div>
              <p className={fieldLabelClassName}>Author</p>
              <p className="flex items-center gap-2 text-sm text-ink">
                <UserAvatar src={session?.user?.avatar} name={profileName} size="sm" />
                <span className="min-w-0 truncate">{profileName || "No name set"}</span>
              </p>
              <p className="mt-1.5 text-xs text-accent-400">
                From your{" "}
                <Link href="/dashboard/settings" className="text-primary-600 hover:underline">
                  profile settings
                </Link>
                .
              </p>
              {errors.author_name ? <p className={fieldErrorClassName}>{errors.author_name.message}</p> : null}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
