/**
 * Server-only database access functions.
 * Public reads go through the shared published + approved filter.
 */

import BlogModel from "@/models/Blog";
import User from "@/models/User";
import { Blog } from "@/types";
import { connectDB } from "./mongodb";
import { type PageQuery } from "./pagination";
import {
  PUBLIC_AUTHOR_FIELDS,
  PUBLIC_CARD_FIELDS,
  PUBLIC_PROFILE_BLOG_FIELDS,
  PUBLIC_PROFILE_FIELDS,
  canViewPost,
  publicPostFilter,
  type PostViewer,
} from "./public-posts";
import mongoose from "mongoose";

export const PUBLIC_PROFILE_PAGE_LIMIT = 10;
export const RECENT_AUTHOR_BLOGS = 5;

export interface PublicAuthorBlog {
  _id: string;
  title: string;
  description: string;
  author_name: string;
  blog_image?: string;
  publish_date?: string;
  tags?: string[];
  readingTime?: number;
  total_likes: number;
  total_dislikes: number;
}

export interface PublicAuthorProfile {
  id: string;
  name: string;
  role: string;
  createdAt?: string;
  profile: {
    fullName: string;
    bio: string;
    avatar: string;
    website: string;
    location: string;
    expertise: string[];
    socialLinks: {
      twitter: string;
      linkedin: string;
      github: string;
    };
  };
  blogs: PublicAuthorBlog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export async function getBlogs(limit = 12): Promise<Blog[]> {
  const { blogs } = await getBlogsPage({ page: 1, limit, skip: 0 });
  return blogs;
}

export async function getBlogsPage(paging: PageQuery): Promise<{
  blogs: Blog[];
  pagination: { page: number; limit: number; total: number; pages: number };
}> {
  await connectDB();
  const safeLimit = Math.min(Math.max(Math.trunc(paging.limit) || 1, 1), 50);
  const safePage = Math.max(Math.trunc(paging.page) || 1, 1);
  const skip = Math.max(Math.trunc(paging.skip) || (safePage - 1) * safeLimit, 0);
  const filter = publicPostFilter();

  const [blogs, total] = await Promise.all([
    BlogModel.find(filter)
      .select(PUBLIC_CARD_FIELDS)
      .populate("authorId", PUBLIC_AUTHOR_FIELDS)
      .sort({ publish_date: -1 })
      .skip(skip)
      .limit(safeLimit)
      .lean(),
    BlogModel.countDocuments(filter),
  ]);

  return {
    blogs: JSON.parse(JSON.stringify(blogs)),
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      pages: Math.max(1, Math.ceil(total / safeLimit)),
    },
  };
}

export async function getBlogById(id: string, viewer?: PostViewer | null): Promise<Blog | null> {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  await connectDB();
  const blog = await BlogModel.findById(id).populate("authorId", PUBLIC_AUTHOR_FIELDS).lean();
  if (!blog || !canViewPost(blog, viewer)) return null;
  return JSON.parse(JSON.stringify(blog));
}

export async function getPublicAuthorProfile(
  userId: string,
  paging: PageQuery = { page: 1, limit: PUBLIC_PROFILE_PAGE_LIMIT, skip: 0 }
): Promise<PublicAuthorProfile | null> {
  if (!mongoose.Types.ObjectId.isValid(userId)) return null;
  await connectDB();

  const user = await User.findById(userId).select(PUBLIC_PROFILE_FIELDS).lean();
  if (!user) return null;

  const filter = publicPostFilter({ authorId: userId });
  const [blogs, total] = await Promise.all([
    BlogModel.find(filter)
      .select(PUBLIC_PROFILE_BLOG_FIELDS)
      .sort({ publish_date: -1 })
      .skip(paging.skip)
      .limit(paging.limit)
      .lean(),
    BlogModel.countDocuments(filter),
  ]);

  const published = JSON.parse(JSON.stringify(blogs)) as PublicAuthorBlog[];
  const profile = user.profile;

  return {
    id: user._id.toString(),
    name: user.name,
    role: user.role,
    createdAt: user.createdAt ? new Date(user.createdAt).toISOString() : undefined,
    profile: {
      fullName: profile?.fullName || "",
      bio: profile?.bio || "",
      avatar: profile?.avatar || "",
      website: profile?.website || "",
      location: profile?.location || "",
      expertise: profile?.expertise || [],
      socialLinks: {
        twitter: profile?.socialLinks?.twitter || "",
        linkedin: profile?.socialLinks?.linkedin || "",
        github: profile?.socialLinks?.github || "",
      },
    },
    blogs: published.map((blog) => ({
      _id: blog._id,
      title: blog.title,
      description: blog.description,
      author_name: blog.author_name,
      blog_image: blog.blog_image,
      publish_date: blog.publish_date,
      tags: blog.tags,
      readingTime: blog.readingTime,
      total_likes: blog.total_likes ?? 0,
      total_dislikes: blog.total_dislikes ?? 0,
    })),
    pagination: {
      page: paging.page,
      limit: paging.limit,
      total,
      pages: Math.ceil(total / paging.limit),
    },
  };
}
