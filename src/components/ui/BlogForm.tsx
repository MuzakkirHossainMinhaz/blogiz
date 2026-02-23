"use client";

import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";
import { createBlog } from "@/lib/api";
import { ROUTES } from "@/config/constants";
import { generateId } from "@/lib/utils";

type FormValues = {
  title: string;
  description: string;
  publish_date: string;
  author_name: string;
  blog_image: string;
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
        id: generateId(),
        total_likes: "0",
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
            {/* Header */}
            <div className="text-center mb-8 md:mb-12">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
                Create Your <span className="gradient-text">Blog Post</span>
              </h1>
              <p className="text-lg text-neutral-600">
                Share your thoughts and ideas with the community
              </p>
            </div>

            {/* Form Card */}
            <div className="card bg-white shadow-soft-lg">
              <div className="card-body p-6 md:p-8 lg:p-10">
                {error && (
                  <div className="alert alert-error mb-6 bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
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
                  {/* Title */}
                  <fieldset className="fieldset">
                    <label
                      htmlFor="title"
                      className="label text-sm font-semibold text-neutral-700 mb-2"
                    >
                      Title <span className="text-red-500">*</span>
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
                    {errors.title && (
                      <p className="text-sm text-red-600 mt-1">
                        {errors.title.message}
                      </p>
                    )}
                  </fieldset>

                  {/* Description */}
                  <fieldset className="fieldset">
                    <label
                      htmlFor="description"
                      className="label text-sm font-semibold text-neutral-700 mb-2"
                    >
                      Content <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="description"
                      {...register("description", {
                        required: "Content is required",
                        minLength: {
                          value: 50,
                          message: "Content must be at least 50 characters",
                        },
                      })}
                      placeholder="Write your blog content here..."
                      rows={8}
                      className="textarea w-full bg-neutral-50 border-neutral-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all resize-none"
                    />
                    {errors.description && (
                      <p className="text-sm text-red-600 mt-1">
                        {errors.description.message}
                      </p>
                    )}
                  </fieldset>

                  {/* Two Column Layout */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Publish Date */}
                    <fieldset className="fieldset">
                      <label
                        htmlFor="publish_date"
                        className="label text-sm font-semibold text-neutral-700 mb-2"
                      >
                        Publish Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="publish_date"
                        type="date"
                        {...register("publish_date", {
                          required: "Publish date is required",
                        })}
                        className="input w-full bg-neutral-50 border-neutral-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all"
                      />
                      {errors.publish_date && (
                        <p className="text-sm text-red-600 mt-1">
                          {errors.publish_date.message}
                        </p>
                      )}
                    </fieldset>

                    {/* Author Name */}
                    <fieldset className="fieldset">
                      <label
                        htmlFor="author_name"
                        className="label text-sm font-semibold text-neutral-700 mb-2"
                      >
                        Author Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="author_name"
                        type="text"
                        {...register("author_name", {
                          required: "Author name is required",
                          minLength: {
                            value: 2,
                            message: "Author name must be at least 2 characters",
                          },
                        })}
                        placeholder="Your name"
                        className="input w-full bg-neutral-50 border-neutral-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all"
                      />
                      {errors.author_name && (
                        <p className="text-sm text-red-600 mt-1">
                          {errors.author_name.message}
                        </p>
                      )}
                    </fieldset>
                  </div>

                  {/* Blog Image URL */}
                  <fieldset className="fieldset">
                    <label
                      htmlFor="blog_image"
                      className="label text-sm font-semibold text-neutral-700 mb-2"
                    >
                      Featured Image URL <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="blog_image"
                      type="url"
                      {...register("blog_image", {
                        required: "Image URL is required",
                        pattern: {
                          value: /^https?:\/\/.+\.(jpg|jpeg|png|webp|gif)$/i,
                          message: "Please enter a valid image URL",
                        },
                      })}
                      placeholder="https://example.com/image.jpg"
                      className="input w-full bg-neutral-50 border-neutral-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all"
                    />
                    {errors.blog_image && (
                      <p className="text-sm text-red-600 mt-1">
                        {errors.blog_image.message}
                      </p>
                    )}
                    <p className="text-sm text-neutral-500 mt-1">
                      Supported formats: JPG, PNG, WebP, GIF
                    </p>
                  </fieldset>

                  {/* Submit Buttons */}
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
