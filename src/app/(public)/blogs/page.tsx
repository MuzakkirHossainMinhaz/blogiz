"use client";

import BlogCard from "@/components/ui/BlogCard";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { APP_CONFIG } from "@/config/constants";
import { fetchBlogs } from "@/lib/api";
import { Blog } from "@/types";
import { useEffect, useState } from "react";

export default function BlogsPage() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadBlogs = async () => {
      try {
        const fetchedBlogs = await fetchBlogs(APP_CONFIG.REVALIDATE_TIME);
        setBlogs(fetchedBlogs);
      } catch (err) {
        console.error("Failed to fetch blogs:", err);
        setError("Failed to load blogs");
      } finally {
        setIsLoading(false);
      }
    };

    loadBlogs();
  }, []);

  if (isLoading) {
    return (
      <Section className="bg-white">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="card bg-white shadow-soft animate-pulse-slow">
                <div className="h-64 bg-neutral-200 rounded-t-xl" />
                <div className="card-body p-6 space-y-4">
                  <div className="h-4 bg-neutral-200 rounded w-24" />
                  <div className="h-6 bg-neutral-200 rounded w-3/4" />
                  <div className="space-y-2">
                    <div className="h-4 bg-neutral-200 rounded" />
                    <div className="h-4 bg-neutral-200 rounded w-5/6" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </Section>
    );
  }

  if (error) {
    return (
      <Section className="bg-white">
        <Container>
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-neutral-900 mb-2">Failed to load blogs</h3>
            <p className="text-neutral-600">{error || "Something went wrong. Please try again later."}</p>
          </div>
        </Container>
      </Section>
    );
  }

  return (
    <main>
      <Section
        title={
          <>
            All Articles from <span className="gradient-text">Blogiz</span>
          </>
        }
        subtitle={APP_CONFIG.SITE_DESCRIPTION}
        className="bg-white px-4"
      >
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {blogs?.map((blog: Blog) => (
              <BlogCard key={blog._id} blog={blog} />
            ))}
          </div>

          {blogs && blogs.length === 0 && (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-neutral-100 mb-4">
                <svg className="w-8 h-8 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-2">No blogs yet</h3>
              <p className="text-neutral-600">Be the first to create a blog post!</p>
            </div>
          )}
        </Container>
      </Section>
    </main>
  );
}
