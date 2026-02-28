import { BlogCardBase } from "@/components/blog/BlogCardBase";
import { Blog } from "@/types";

interface LatestBlogCardProps {
  blog: Blog;
}

export default function LatestBlogCard({ blog }: LatestBlogCardProps) {
  return <BlogCardBase blog={blog} variant="featured" />;
}
