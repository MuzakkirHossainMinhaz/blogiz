import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Blog from "@/models/Blog";
import { auth } from "@/lib/auth";

// GET /api/blogs/drafts - Get user's draft blogs (auth required)
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized - Please login" },
        { status: 401 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    const skip = (page - 1) * limit;

    // Get user's draft blogs
    const blogs = await Blog.find({
      status: "draft",
      createdBy: (session.user as any).id,
    })
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count
    const total = await Blog.countDocuments({
      status: "draft",
      createdBy: (session.user as any).id,
    });

    return NextResponse.json({
      blogs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("Error fetching draft blogs:", error);
    return NextResponse.json(
      { error: "Failed to fetch draft blogs", message: error.message },
      { status: 500 }
    );
  }
}
