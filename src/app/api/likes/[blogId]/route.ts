import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Like from "@/models/Like";
import mongoose from "mongoose";

// GET /api/likes/[blogId] - Get all likes for a blog
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ blogId: string }> }
) {
  try {
    const { blogId } = await params;

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(blogId)) {
      return NextResponse.json({ error: "Invalid blog ID" }, { status: 400 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const skip = (page - 1) * limit;

    // Get likes with pagination
    const likes = await Like.find({ blogId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select("-ipAddress") // Don't expose full IP addresses
      .lean();

    // Get total count
    const total = await Like.countDocuments({ blogId });

    // Anonymize IP addresses (show only first 2 octets)
    const anonymizedLikes = likes.map((like) => ({
      ...like,
      ipAddress: "xxx.xxx.xxx.xxx", // Fully anonymized for privacy
      createdAt: like.createdAt,
    }));

    return NextResponse.json({
      likes: anonymizedLikes,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("Error fetching likes:", error);
    return NextResponse.json(
      { error: "Failed to fetch likes", message: error.message },
      { status: 500 }
    );
  }
}
