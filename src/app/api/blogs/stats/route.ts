import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Blog from "@/models/Blog";
import Like from "@/models/Like";
import { auth } from "@/lib/auth";

// GET /api/blogs/stats - Get blog statistics (auth required)
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

    const userId = (session.user as any).id;

    // Get counts
    const [totalBlogs, publishedBlogs, draftBlogs, totalLikes] =
      await Promise.all([
        Blog.countDocuments({ createdBy: userId }),
        Blog.countDocuments({ createdBy: userId, status: "published" }),
        Blog.countDocuments({ createdBy: userId, status: "draft" }),
        Blog.aggregate([
          { $match: { createdBy: userId } },
          { $group: { _id: null, total: { $sum: "$total_likes" } } },
        ]),
      ]);

    // Get most liked blogs
    const mostLikedBlogs = await Blog.find({ createdBy: userId })
      .sort({ total_likes: -1 })
      .limit(5)
      .select("title total_likes publish_date")
      .lean();

    // Get recent blogs
    const recentBlogs = await Blog.find({ createdBy: userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("title status publish_date total_likes")
      .lean();

    return NextResponse.json({
      stats: {
        totalBlogs,
        publishedBlogs,
        draftBlogs,
        totalLikes: totalLikes[0]?.total || 0,
      },
      mostLikedBlogs,
      recentBlogs,
    });
  } catch (error: any) {
    console.error("Error fetching blog stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch blog stats", message: error.message },
      { status: 500 }
    );
  }
}
