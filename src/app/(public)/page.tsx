import Banner from "@/components/shared/Banner";
import { HomeHero } from "@/components/shared/HomeHero";
import BlogCard from "@/components/ui/BlogCard";
import { Container } from "@/components/ui/Container";
import LatestBlogCard from "@/components/ui/LatestBlogCard";
import { Section } from "@/components/ui/Section";
import { APP_CONFIG } from "@/config/constants";
import { getBlogs } from "@/lib/db";

export default async function HomePage() {
  const blogs = await getBlogs(APP_CONFIG.LATEST_BLOGS_COUNT);

  const latestBlogs = blogs.slice(0, 2);
  const recentBlogs = blogs.slice(2, APP_CONFIG.LATEST_BLOGS_COUNT);

  return (
    <main>
      <HomeHero />

      <div className="border-b border-neutral-200/80 bg-surface">
        <Banner />
      </div>

      <Section
        title={
          <>
            Latest from <span className="text-primary-600">Blogiz</span>
          </>
        }
        subtitle={APP_CONFIG.SITE_DESCRIPTION}
        className="bg-surface px-4"
      >
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-12">
            {latestBlogs.map((blog) => (
              <LatestBlogCard key={blog._id} blog={blog} />
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {recentBlogs.map((blog) => (
              <BlogCard key={blog._id} blog={blog} />
            ))}
          </div>
        </Container>
      </Section>
    </main>
  );
}
