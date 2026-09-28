/**
 * Server-only database access functions.
 * Public reads go through the shared published + approved filter.
 */

import BlogModel from "@/models/Blog";
import { Blog } from "@/types";
import { connectDB } from "./mongodb";
import { PUBLIC_CARD_FIELDS, canViewPost, publicPostFilter, type PostViewer } from "./public-posts";
import mongoose from "mongoose";

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
