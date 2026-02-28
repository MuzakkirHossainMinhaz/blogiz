/**
 * Server-only database access functions
 * These directly query MongoDB and should only be used in Server Components
 */

import BlogModel from "@/models/Blog";
import { Blog } from "@/types";
import { connectDB } from "./mongodb";

/**
 * Fetch all published blogs (server-only)
 */
export async function getBlogs(): Promise<Blog[]> {
  await connectDB();
  const blogs = await BlogModel.find({ status: "published" }).sort({ publish_date: -1 }).lean();
  return JSON.parse(JSON.stringify(blogs));
}

/**
 * Fetch single blog by ID (server-only)
 */
export async function getBlogById(id: string): Promise<Blog | null> {
  await connectDB();
  const blog = await BlogModel.findById(id).lean();
  if (!blog) return null;
  return JSON.parse(JSON.stringify(blog));
}
