import { BlogDetailClient } from "@/components/blog/BlogDetailClient";
import { getBlogById } from "@/lib/db";
import { absoluteUrl, buildPageMetadata } from "@/lib/seo";
import { isStoredImageUrl } from "@/lib/urls";
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

  const image = blog.thumbnail && isStoredImageUrl(blog.thumbnail) ? blog.thumbnail : undefined;
  return buildPageMetadata({
    title: blog.title,
    description: blog.description || `A story by ${blog.authorName} on Blogiz.`,
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
      <section className="container-custom py-8 sm:py-12 md:py-16 lg:py-20">
        <BlogDetailClient blog={blog} shareUrl={absoluteUrl(`/blogs/${blogId}`)} />
      </section>
    </main>
  );
}
