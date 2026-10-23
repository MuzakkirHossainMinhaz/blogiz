import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { authorStatsCacheKey } from "@/lib/cache-invalidation";
import { connectDB } from "@/lib/mongodb";
import Blog from "@/models/Blog";
import { denied, requireUser } from "@/lib/authz";
import { serverError } from "@/lib/http";
import { cacheGetJson, cacheSetJson } from "@/lib/redis-cache";

const STATS_TTL_SECONDS = 90;

type StatsPayload = {
  stats: {
    totalBlogs: number;
    publishedBlogs: number;
    draftBlogs: number;
    totalLikes: number;
  };
  mostLikedBlogs: unknown[];
  recentBlogs: unknown[];
};

export async function GET(_request: NextRequest) {
  try {
    const actor = await requireUser();
    if (denied(actor)) return actor;

    const userId = actor.id;
    const key = authorStatsCacheKey(userId);
    const cached = await cacheGetJson<StatsPayload>(key);
    if (cached) return NextResponse.json(cached);

    await connectDB();

    // Aggregations skip Mongoose casting; authorId is ObjectId on Blog.
    const authorObjectId = new mongoose.Types.ObjectId(userId);

    const [totalBlogs, publishedBlogs, draftBlogs, totalLikes] = await Promise.all([
      Blog.countDocuments({ authorId: userId }),
      Blog.countDocuments({ authorId: userId, status: "published" }),
      Blog.countDocuments({ authorId: userId, status: "draft" }),
      Blog.aggregate([
        { $match: { authorId: authorObjectId } },
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

    const payload: StatsPayload = {
      stats: {
        totalBlogs,
        publishedBlogs,
        draftBlogs,
        totalLikes: totalLikes[0]?.total || 0,
      },
      mostLikedBlogs,
      recentBlogs,
    };

    await cacheSetJson(key, payload, STATS_TTL_SECONDS);
    return NextResponse.json(payload);
  } catch (error) {
    return serverError("Error fetching blog stats:", error);
  }
}
