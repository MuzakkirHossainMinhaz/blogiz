import Banner from "@/components/shared/Banner";
import BlogCard from "@/components/ui/BlogCard";
import LatestBlogCard from "@/components/ui/LatestBlogCard";
import { APP_CONFIG, ROUTES } from "@/config/constants";
import { getBlogs } from "@/lib/db";
import { buildPageMetadata, DEFAULT_DESCRIPTION } from "@/lib/seo";
import type { Metadata } from "next";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildPageMetadata({
  title: APP_CONFIG.SITE_NAME,
  description: DEFAULT_DESCRIPTION,
  path: "/",
});

export default async function HomePage() {
  const blogs = await getBlogs(APP_CONFIG.LATEST_BLOGS_COUNT);

  const latestBlogs = blogs.slice(0, 2);
  const recentBlogs = blogs.slice(2, APP_CONFIG.LATEST_BLOGS_COUNT);

  return (
    <main className="bg-paper">
      <Banner />

      <section className="container-custom py-14 sm:py-16 md:py-20">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-10 md:mb-12">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-600 mb-3">Latest</p>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-ink">
              From the shelf
            </h2>
            <p className="mt-3 text-base sm:text-lg text-accent-500 leading-relaxed">
              {APP_CONFIG.SITE_DESCRIPTION}
            </p>
          </div>
          <Link
            href={ROUTES.BLOGS}
            className="inline-flex items-center justify-center min-h-11 px-5 rounded-xl text-sm font-semibold text-ink bg-surface border border-primary-200 hover:border-primary-300 transition-colors shrink-0"
          >
            View all blogs
          </Link>
        </div>

        {blogs.length === 0 ? (
          <div className="py-14 text-center border-y border-neutral-200">
            <h3 className="font-display text-xl font-semibold text-ink mb-2">No stories yet</h3>
            <p className="text-accent-500 max-w-md mx-auto">
              Published posts will appear here. Authors can draft from the dashboard once they are approved.
            </p>
          </div>
        ) : (
          <>
            {latestBlogs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-10 md:mb-12">
                {latestBlogs.map((blog) => (
                  <LatestBlogCard key={blog._id} blog={blog} />
                ))}
              </div>
            ) : null}

            {recentBlogs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {recentBlogs.map((blog) => (
                  <BlogCard key={blog._id} blog={blog} />
                ))}
              </div>
            ) : null}
          </>
        )}
      </section>
    </main>
  );
}
