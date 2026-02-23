import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Blog from "@/models/Blog";
import Like from "@/models/Like";
import { getClientIP, getUserAgent } from "@/lib/request-utils";
import mongoose from "mongoose";

// POST /api/likes - Toggle like on a blog (IP-based)
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { blogId } = body;

    if (!blogId) {
      return NextResponse.json(
        { error: "Blog ID is required" },
        { status: 400 }
      );
    }

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(blogId)) {
      return NextResponse.json({ error: "Invalid blog ID" }, { status: 400 });
    }

    // Check if blog exists
    const blog = await Blog.findById(blogId);
    if (!blog) {
      return NextResponse.json({ error: "Blog not found" }, { status: 404 });
    }

    // Get user's IP address and user agent
    const ipAddress = await getClientIP();
    const userAgent = await getUserAgent();

    // Check if user already liked this blog
    const existingLike = await Like.findOne({ blogId, ipAddress });

    if (existingLike) {
      // Unlike: Remove like and decrement count
      await Like.deleteOne({ _id: existingLike._id });
      await Blog.findByIdAndUpdate(blogId, {
        $inc: { total_likes: -1 },
      });

      const updatedBlog = await Blog.findById(blogId);

      return NextResponse.json({
        message: "Blog unliked successfully",
        liked: false,
        total_likes: updatedBlog?.total_likes || 0,
      });
    } else {
      // Like: Add like and increment count
      await Like.create({
        blogId,
        ipAddress,
        userAgent,
      });

      await Blog.findByIdAndUpdate(blogId, {
        $inc: { total_likes: 1 },
      });

      const updatedBlog = await Blog.findById(blogId);

      return NextResponse.json({
        message: "Blog liked successfully",
        liked: true,
        total_likes: updatedBlog?.total_likes || 0,
      });
    }
  } catch (error: any) {
    console.error("Error toggling like:", error);
    return NextResponse.json(
      { error: "Failed to toggle like", message: error.message },
      { status: 500 }
    );
  }
}
