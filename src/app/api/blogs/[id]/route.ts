import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Blog from "@/models/Blog";
import Like from "@/models/Like";
import { auth } from "@/lib/auth";
import mongoose from "mongoose";

// GET /api/blogs/[id] - Get single blog
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid blog ID" }, { status: 400 });
    }

    await connectDB();

    // Get single blog
    const blog = await Blog.findById(id)
      .populate("authorId", "profile.fullName profile.avatar profile.bio name email")
      .populate("approvedBy", "name profile.fullName")
      .lean();

    if (!blog) {
      return NextResponse.json({ error: "Blog not found" }, { status: 404 });
    }

    return NextResponse.json({ blog });
  } catch (error: any) {
    console.error("Error fetching blog:", error);
    return NextResponse.json(
      { error: "Failed to fetch blog", message: error.message },
      { status: 500 }
    );
  }
}

// PUT /api/blogs/[id] - Update blog (auth required)
export async function PUT(
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

    const body = await request.json();
    const {
      title,
      description,
      content,
      author_name,
      blog_image,
      status,
      publish_date,
    } = body;

    // Update blog
    const updatedBlog = await Blog.findByIdAndUpdate(
      id,
      {
        ...(title && { title }),
        ...(description && { description }),
        ...(content && { content }),
        ...(author_name && { author_name }),
        ...(blog_image && { blog_image }),
        ...(status && { status }),
        ...(publish_date && { publish_date }),
      },
      { new: true, runValidators: true }
    );

    return NextResponse.json({
      message: "Blog updated successfully",
      blog: updatedBlog,
    });
  } catch (error: any) {
    console.error("Error updating blog:", error);
    return NextResponse.json(
      { error: "Failed to update blog", message: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/blogs/[id] - Delete blog (auth required)
export async function DELETE(
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

    // Delete associated likes
    await Like.deleteMany({ blogId: id });

    // Delete blog
    await Blog.findByIdAndDelete(id);

    return NextResponse.json({
      message: "Blog and associated likes deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting blog:", error);
    return NextResponse.json(
      { error: "Failed to delete blog", message: error.message },
      { status: 500 }
    );
  }
}
