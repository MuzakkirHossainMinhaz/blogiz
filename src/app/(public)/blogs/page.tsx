import BlogCard from "@/components/ui/BlogCard";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { APP_CONFIG } from "@/config/constants";
import { getBlogs } from "@/lib/db";
import { buildPageMetadata, DEFAULT_DESCRIPTION } from "@/lib/seo";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildPageMetadata({
  title: "Blogs",
  description: `Browse published articles on ${APP_CONFIG.SITE_NAME}. ${DEFAULT_DESCRIPTION}`,
  path: "/blogs",
});

export default async function BlogsPage() {
  const blogs = await getBlogs(APP_CONFIG.ITEMS_PER_PAGE * 3);

  return (
    <main>
      <Section
        title={<>All articles from Blogiz</>}
        subtitle={APP_CONFIG.SITE_DESCRIPTION}
        className="bg-surface px-4"
      >
        <Container>
          {blogs.length === 0 ? (
            <div className="text-center py-14">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-50 border border-primary-100 mb-4">
                <svg className="w-8 h-8 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h3 className="font-display text-xl font-semibold text-ink mb-2">No blogs yet</h3>
              <p className="text-accent-500">Be the first to publish a story on Blogiz.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {blogs.map((blog) => (
                <BlogCard key={blog._id} blog={blog} />
              ))}
            </div>
          )}
        </Container>
      </Section>
    </main>
  );
}
