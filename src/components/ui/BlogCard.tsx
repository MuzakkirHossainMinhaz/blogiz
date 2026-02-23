import { Blog } from "@/types";
import { BlogCardBase } from "@/components/blog/BlogCardBase";

interface BlogCardProps {
  blog: Blog;
}

export default function BlogCard({ blog }: BlogCardProps) {
  return <BlogCardBase blog={blog} variant="default" />;
}
