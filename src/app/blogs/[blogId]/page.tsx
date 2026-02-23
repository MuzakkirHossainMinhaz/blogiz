import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { BlogDetailClient } from "@/components/blog/BlogDetailClient";
import { fetchBlogById, fetchBlogs } from "@/lib/api";
import { Blog } from "@/types";

interface BlogDetailPageProps {
  params: Promise<{
    blogId: string;
  }>;
}

export async function generateStaticParams() {
  const blogs = await fetchBlogs();
  return blogs.slice(0, 3).map((blog: Blog) => ({
    blogId: blog._id,
  }));
}

export default async function BlogDetailPage({ params }: BlogDetailPageProps) {
  const { blogId } = await params;
  const blog = await fetchBlogById(blogId);

  return (
    <main className="bg-white">
      <Section className="py-8 md:py-12">
        <Container size="md">
          <BlogDetailClient blog={blog} />
        </Container>
      </Section>
    </main>
  );
}
