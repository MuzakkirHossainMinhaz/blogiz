import { BlogDetailClient } from "@/components/blog/BlogDetailClient";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { getBlogById } from "@/lib/db";
import { notFound } from "next/navigation";

interface BlogDetailPageProps {
  params: Promise<{
    blogId: string;
  }>;
}

export default async function BlogDetailPage({ params }: BlogDetailPageProps) {
  const { blogId } = await params;
  const blog = await getBlogById(blogId);

  if (!blog) {
    notFound();
  }

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
