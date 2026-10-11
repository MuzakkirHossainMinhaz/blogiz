"use client";

import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { FieldRequiredMark } from "@/components/ui/FieldRequiredMark";
import { Section } from "@/components/ui/Section";
import { ROUTES } from "@/config/constants";
import { createBlog } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

type FormValues = {
  title: string;
  description: string;
  content: string;
  publishedAt: string;
  authorName: string;
  thumbnail: string;
};

export default function CreateBlogForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>();

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const blogData = {
        ...data,
        totalLikes: 0,
        status: "published" as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await createBlog(blogData);
      router.push(ROUTES.BLOGS);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create blog");
      setIsSubmitting(false);
    }
  };

  return (
    <main className="bg-linear-to-br from-neutral-50 to-primary-50/30 min-h-screen">
      <Section className="py-12 md:py-16">
        <Container size="md">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-8 md:mb-12">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-semibold tracking-tight mb-4">
                Create Your Blog Post
              </h1>
              <p className="text-lg text-neutral-600">Share your thoughts and ideas with the community</p>
            </div>

            <div className="card bg-white shadow-soft-lg">
              <div className="card-body p-6 md:p-8 lg:p-10">
                {error && (
                  <div className="alert alert-error mb-6 bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <fieldset className="fieldset">
                    <label htmlFor="title" className="label text-sm font-semibold text-neutral-700 mb-2">
                      Title <FieldRequiredMark />
                    </label>
                    <input
                      id="title"
                      type="text"
                      {...register("title", {
                        required: "Title is required",
                        minLength: {
                          value: 10,
                          message: "Title must be at least 10 characters",
                        },
                        maxLength: {
                          value: 100,
                          message: "Title must not exceed 100 characters",
                        },
                      })}
                      placeholder="Enter an engaging title for your blog post"
                      className="input w-full bg-neutral-50 border-neutral-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all"
                    />
                    {errors.title && <p className="text-sm text-red-600 mt-1">{errors.title.message}</p>}
                  </fieldset>

                  <fieldset className="fieldset">
                    <label htmlFor="description" className="label text-sm font-semibold text-neutral-700 mb-2">
                      Description <FieldRequiredMark />
                    </label>
                    <textarea
                      id="description"
                      {...register("description", {
                        required: "Description is required",
                        minLength: {
                          value: 50,
                          message: "Description must be at least 50 characters",
                        },
                      })}
                      placeholder="Write a brief description for your blog..."
                      rows={4}
                      className="textarea w-full bg-neutral-50 border-neutral-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all resize-none"
                    />
                    {errors.description && <p className="text-sm text-red-600 mt-1">{errors.description.message}</p>}
                  </fieldset>

                  <fieldset className="fieldset">
                    <label htmlFor="content" className="label text-sm font-semibold text-neutral-700 mb-2">
                      Content <FieldRequiredMark />
                    </label>
                    <textarea
                      id="content"
                      {...register("content", {
                        required: "Content is required",
                        minLength: {
                          value: 100,
                          message: "Content must be at least 100 characters",
                        },
                      })}
                      placeholder="Write your full blog content here..."
                      rows={12}
                      className="textarea w-full bg-neutral-50 border-neutral-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all resize-none"
                    />
                    {errors.content && <p className="text-sm text-red-600 mt-1">{errors.content.message}</p>}
                  </fieldset>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <fieldset className="fieldset">
                      <label htmlFor="publishedAt" className="label text-sm font-semibold text-neutral-700 mb-2">
                        Publish Date <FieldRequiredMark />
                      </label>
                      <input
                        id="publishedAt"
                        type="date"
                        {...register("publishedAt", {
                          required: "Publish date is required",
                        })}
                        className="input w-full bg-neutral-50 border-neutral-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all"
                      />
                      {errors.publishedAt && (
                        <p className="text-sm text-red-600 mt-1">{errors.publishedAt.message}</p>
                      )}
                    </fieldset>

                    <fieldset className="fieldset">
                      <label htmlFor="authorName" className="label text-sm font-semibold text-neutral-700 mb-2">
                        Author Name <FieldRequiredMark />
                      </label>
                      <input
                        id="authorName"
                        type="text"
                        {...register("authorName", {
                          required: "Author name is required",
                          minLength: {
                            value: 2,
                            message: "Author name must be at least 2 characters",
                          },
                        })}
                        placeholder="Your name"
                        className="input w-full bg-neutral-50 border-neutral-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all"
                      />
                      {errors.authorName && <p className="text-sm text-red-600 mt-1">{errors.authorName.message}</p>}
                    </fieldset>
                  </div>

                  <fieldset className="fieldset">
                    <label htmlFor="thumbnail" className="label text-sm font-semibold text-neutral-700 mb-2">
                      Featured Image URL <FieldRequiredMark />
                    </label>
                    <input
                      id="thumbnail"
                      type="url"
                      {...register("thumbnail", {
                        required: "Image URL is required",
                        pattern: {
                          value: /^https?:\/\/.+\.(jpg|jpeg|png|webp|gif)$/i,
                          message: "Please enter a valid image URL",
                        },
                      })}
                      placeholder="https://example.com/image.jpg"
                      className="input w-full bg-neutral-50 border-neutral-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all"
                    />
                    {errors.thumbnail && <p className="text-sm text-red-600 mt-1">{errors.thumbnail.message}</p>}
                    <p className="text-sm text-neutral-500 mt-1">Supported formats: JPG, PNG, WebP, GIF</p>
                  </fieldset>

                  <div className="flex flex-col sm:flex-row gap-4 pt-4">
                    <Button
                      type="submit"
                      variant="primary"
                      size="lg"
                      isLoading={isSubmitting}
                      fullWidth
                      className="order-1 sm:order-2"
                    >
                      {isSubmitting ? "Publishing..." : "Publish Blog Post"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="lg"
                      fullWidth
                      className="order-2 sm:order-1"
                      onClick={() => router.back()}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </Container>
      </Section>
    </main>
  );
}
