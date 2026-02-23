export interface Blog {
  _id: string;
  title: string;
  description: string;
  content: string;
  publish_date?: string;
  author_name: string;
  blog_image?: string;
  total_likes: number;
  status: "draft" | "published";
  createdAt: string;
  updatedAt: string;
}

export interface BlogFormData {
  title: string;
  description: string;
  content: string;
  publish_date?: string;
  author_name: string;
  blog_image?: string;
  status: "draft" | "published";
}
