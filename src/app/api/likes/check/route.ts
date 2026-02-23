import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Like from "@/models/Like";
import { getClientIP } from "@/lib/request-utils";
import mongoose from "mongoose";

// GET /api/likes/check?blogId=xxx - Check if user liked a blog
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const blogId = searchParams.get("blogId");

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

    // Get user's IP address
    const ipAddress = await getClientIP();

    // Check if like exists
    const like = await Like.findOne({ blogId, ipAddress });

    return NextResponse.json({
      liked: !!like,
      likeId: like?._id || null,
    });
  } catch (error: any) {
    console.error("Error checking like status:", error);
    return NextResponse.json(
      { error: "Failed to check like status", message: error.message },
      { status: 500 }
    );
  }
}
