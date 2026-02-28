import { BlogCardBase } from "@/components/blog/BlogCardBase";
import { Blog } from "@/types";

interface BlogCardProps {
  blog: Blog;
}

export default function BlogCard({ blog }: BlogCardProps) {
  return <BlogCardBase blog={blog} variant="default" />;
}
