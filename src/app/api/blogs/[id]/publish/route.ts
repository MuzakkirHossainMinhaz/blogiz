import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Blog from "@/models/Blog";
import { auth } from "@/lib/auth";
import mongoose from "mongoose";

// POST /api/blogs/[id]/publish - Publish a draft blog
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized - Please login" },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid blog ID" }, { status: 400 });
    }

    await connectDB();

    // Check if blog exists and user owns it
    const existingBlog = await Blog.findById(id);

    if (!existingBlog) {
      return NextResponse.json({ error: "Blog not found" }, { status: 404 });
    }

    if (existingBlog.createdBy.toString() !== (session.user as any).id) {
      return NextResponse.json(
        { error: "Forbidden - You don't own this blog" },
        { status: 403 }
      );
    }

    // Update status to published and set publish date
    const updatedBlog = await Blog.findByIdAndUpdate(
      id,
      {
        status: "published",
        publish_date: new Date(),
      },
      { new: true }
    );

    return NextResponse.json({
      message: "Blog published successfully",
      blog: updatedBlog,
    });
  } catch (error: any) {
    console.error("Error publishing blog:", error);
    return NextResponse.json(
      { error: "Failed to publish blog", message: error.message },
      { status: 500 }
    );
  }
}
