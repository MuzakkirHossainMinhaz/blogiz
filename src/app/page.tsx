import Banner from "@/components/shared/Banner";
import BlogCard from "@/components/ui/BlogCard";
import { Container } from "@/components/ui/Container";
import LatestBlogCard from "@/components/ui/LatestBlogCard";
import { Section } from "@/components/ui/Section";
import { APP_CONFIG } from "@/config/constants";
import { fetchBlogs } from "@/lib/api";

export default async function HomePage() {
  const blogs = await fetchBlogs(APP_CONFIG.REVALIDATE_TIME);

  const latestBlogs = blogs.slice(0, 2);
  const recentBlogs = blogs.slice(2, APP_CONFIG.LATEST_BLOGS_COUNT);

  return (
    <main>
      {/* Hero/Banner Section */}
      <Banner />

      {/* Latest Blogs Section */}
      <Section
        title={
          <>
            Latest from <span className="gradient-text">Blogiz</span>
          </>
        }
        subtitle={APP_CONFIG.SITE_DESCRIPTION}
        className="bg-white px-4"
      >
        <Container>
          {/* Featured Posts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-12">
            {latestBlogs.map((blog) => (
              <LatestBlogCard key={blog._id} blog={blog} />
            ))}
          </div>

          {/* Recent Posts */}
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
