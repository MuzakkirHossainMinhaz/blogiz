import { Blog } from "@/types";
import { BlogCardBase } from "@/components/blog/BlogCardBase";

interface LatestBlogCardProps {
  blog: Blog;
}

export default function LatestBlogCard({ blog }: LatestBlogCardProps) {
  return <BlogCardBase blog={blog} variant="featured" />;
}
