export interface BlogAuthorRef {
  _id: string;
  name?: string;
  profile?: {
    fullName?: string;
    avatar?: string;
    bio?: string;
  };
}

export interface Blog {
  _id: string;
  title: string;
  description: string;
  content: string;
  publishedAt?: string | null;
  authorName: string;
  authorId?: string | BlogAuthorRef;
  thumbnail?: string;
  thumbnailPublicId?: string;
  thumbnailSource?: "upload" | "ai" | "none";
  totalLikes: number;
  totalDislikes?: number;
  totalComments?: number;
  totalViews?: number;
  tags?: string[];
  readingTime?: number;
  status: "draft" | "published";
  createdAt: string;
  updatedAt: string;
}

export interface BlogFormData {
  title: string;
  description: string;
  content: string;
  publishedAt?: string | null;
  authorName: string;
  thumbnail?: string;
  status: "draft" | "published";
}
