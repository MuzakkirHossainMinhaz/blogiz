import { EditorialPageHero } from "@/components/shared/EditorialPageHero";
import BlogCard from "@/components/ui/BlogCard";
import { Pagination } from "@/components/ui/Pagination";
import { APP_CONFIG, ROUTES } from "@/config/constants";
import { getBlogsPage } from "@/lib/db";
import { parsePageLimit } from "@/lib/pagination";
import { buildPageMetadata, DEFAULT_DESCRIPTION } from "@/lib/seo";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildPageMetadata({
  title: "Blogs",
  description: `Browse published articles on ${APP_CONFIG.SITE_NAME}. ${DEFAULT_DESCRIPTION}`,
  path: "/blogs",
});

interface BlogsPageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function BlogsPage({ searchParams }: BlogsPageProps) {
  const { page } = await searchParams;
  const paging = parsePageLimit(page ?? null, String(APP_CONFIG.ITEMS_PER_PAGE), APP_CONFIG.ITEMS_PER_PAGE);
  if ("error" in paging) notFound();

  const { blogs, pagination } = await getBlogsPage(paging);

  // Empty page beyond the last page → 404-ish empty rather than blank confusion
  if (pagination.total > 0 && paging.page > pagination.pages) {
    notFound();
  }

  return (
    <main className="bg-paper">
      <EditorialPageHero
        eyebrow="Library"
        title="All articles"
        description={APP_CONFIG.SITE_DESCRIPTION}
      />

      <section className="container-custom py-12 sm:py-16 md:py-20">
        {blogs.length === 0 ? (
          <div className="py-14 text-center border-y border-neutral-200">
            <h3 className="font-display text-xl font-semibold text-ink mb-2">No blogs yet</h3>
            <p className="text-accent-500">Be the first to publish a story on Blogiz.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {blogs.map((blog) => (
                <BlogCard key={blog._id} blog={blog} />
              ))}
            </div>
            <Pagination
              className="mt-10 md:mt-12"
              page={pagination.page}
              pages={pagination.pages}
              total={pagination.total}
              prevHref={
                pagination.page > 1
                  ? pagination.page === 2
                    ? ROUTES.BLOGS
                    : `${ROUTES.BLOGS}?page=${pagination.page - 1}`
                  : undefined
              }
              nextHref={
                pagination.page < pagination.pages
                  ? `${ROUTES.BLOGS}?page=${pagination.page + 1}`
                  : undefined
              }
            />
          </>
        )}
      </section>
    </main>
  );
}
