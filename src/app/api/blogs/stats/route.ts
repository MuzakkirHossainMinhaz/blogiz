import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Blog from "@/models/Blog";
import { denied, requireUser } from "@/lib/authz";
import { serverError } from "@/lib/http";

export async function GET(request: NextRequest) {
  try {
    const actor = await requireUser();
    if (denied(actor)) return actor;

    await connectDB();

    const userId = actor.id;

    const [totalBlogs, publishedBlogs, draftBlogs, totalLikes] = await Promise.all([
      Blog.countDocuments({ authorId: userId }),
      Blog.countDocuments({ authorId: userId, status: "published" }),
      Blog.countDocuments({ authorId: userId, status: "draft" }),
      Blog.aggregate([
        { $match: { authorId: actor.id } },
        { $group: { _id: null, total: { $sum: "$totalLikes" } } },
      ]),
    ]);

    const mostLikedBlogs = await Blog.find({ authorId: userId })
      .sort({ totalLikes: -1 })
      .limit(5)
      .select("title totalLikes publishedAt")
      .lean();

    const recentBlogs = await Blog.find({ authorId: userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("title status publishedAt totalLikes")
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
  } catch (error) {
    return serverError("Error fetching blog stats:", error);
  }
}
