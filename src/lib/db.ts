/**
 * Server-only database access functions.
 * Public reads go through the shared published + approved filter.
 */

import BlogModel from "@/models/Blog";
import User from "@/models/User";
import { Blog } from "@/types";
import { connectDB } from "./mongodb";
import {
  PUBLIC_CARD_FIELDS,
  PUBLIC_PROFILE_BLOG_FIELDS,
  PUBLIC_PROFILE_FIELDS,
  canViewPost,
  publicPostFilter,
  type PostViewer,
} from "./public-posts";
import mongoose from "mongoose";

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
}

export async function getBlogs(limit = 12): Promise<Blog[]> {
  await connectDB();
  const safeLimit = Math.min(Math.max(Math.trunc(limit) || 1, 1), 50);
  const blogs = await BlogModel.find(publicPostFilter())
    .select(PUBLIC_CARD_FIELDS)
    .sort({ publish_date: -1 })
    .limit(safeLimit)
    .lean();
  return JSON.parse(JSON.stringify(blogs));
}

export async function getBlogById(id: string, viewer?: PostViewer | null): Promise<Blog | null> {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  await connectDB();
  const blog = await BlogModel.findById(id).lean();
  if (!blog || !canViewPost(blog, viewer)) return null;
  return JSON.parse(JSON.stringify(blog));
}

export async function getPublicAuthorProfile(userId: string): Promise<PublicAuthorProfile | null> {
  if (!mongoose.Types.ObjectId.isValid(userId)) return null;
  await connectDB();

  const user = await User.findById(userId).select(PUBLIC_PROFILE_FIELDS).lean();
  if (!user) return null;

  const blogs = await BlogModel.find(publicPostFilter({ authorId: userId }))
    .select(PUBLIC_PROFILE_BLOG_FIELDS)
    .sort({ publish_date: -1 })
    .lean();

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
  };
}
