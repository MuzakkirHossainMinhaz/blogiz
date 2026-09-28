import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Blog from "@/models/Blog";
import Comment from "@/models/Comment";
import Like from "@/models/Like";
import BlogView from "@/models/BlogView";
import { denied } from "@/lib/authz";
import { requireAiUser } from "@/lib/ai-guard";
import { jsonError, serverError } from "@/lib/http";
import { publicPostFilter } from "@/lib/public-posts";

export async function GET() {
  try {
    const actor = await requireAiUser();
    if (denied(actor)) return actor;

    await connectDB();

    const [comments, likes, blogs, views] = await Promise.all([
      Comment.countDocuments({ userId: actor.id, isApproved: true }),
      Like.countDocuments({ userId: actor.id }),
      Blog.countDocuments({ createdBy: actor.id }),
      BlogView.countDocuments({ userId: actor.id }),
    ]);

    const trending = await Blog.find(
      publicPostFilter({ createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } })
    )
      .select("tags")
      .limit(50)
      .lean();

    const tagFrequency = trending.flatMap((blog) => blog.tags || []).reduce<Record<string, number>>((acc, tag) => {
      acc[tag] = (acc[tag] || 0) + 1;
      return acc;
    }, {});

    return NextResponse.json({
      contentAnalytics: { blogs, comments, likes, views },
      trendingTopics: Object.entries(tagFrequency)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([tag, count]) => ({ tag, count })),
      recommendations: [],
    });
  } catch (error) {
    return serverError("AI dashboard data failed:", error);
  }
}

export async function POST(request: NextRequest) {
  const actor = await requireAiUser();
  if (denied(actor)) return actor;
  void request;
  return jsonError("Content analysis provider is not configured", 503);
}
