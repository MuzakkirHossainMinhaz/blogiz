import { BlogDetailClient } from "@/components/blog/BlogDetailClient";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { getBlogById } from "@/lib/db";
import { buildPageMetadata } from "@/lib/seo";
import { isCloudinaryDeliveryUrl } from "@/lib/urls";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

interface BlogDetailPageProps {
  params: Promise<{
    blogId: string;
  }>;
}

export async function generateMetadata({ params }: BlogDetailPageProps): Promise<Metadata> {
  const { blogId } = await params;
  const blog = await getBlogById(blogId);
  if (!blog) {
    return buildPageMetadata({
      title: "Post not found",
      description: "This Blogiz post could not be found.",
      path: `/blogs/${blogId}`,
      noIndex: true,
    });
  }

  const image = blog.blog_image && isCloudinaryDeliveryUrl(blog.blog_image) ? blog.blog_image : undefined;
  return buildPageMetadata({
    title: blog.title,
    description: blog.description || `A story by ${blog.author_name} on Blogiz.`,
    path: `/blogs/${blogId}`,
    image,
    type: "article",
  });
}

export default async function BlogDetailPage({ params }: BlogDetailPageProps) {
  const { blogId } = await params;
  const blog = await getBlogById(blogId);

  if (!blog) {
    notFound();
  }

  return (
    <main className="bg-paper">
      <Section className="py-8 md:py-12">
        <Container size="md">
          <BlogDetailClient blog={blog} />
        </Container>
      </Section>
    </main>
  );
}
