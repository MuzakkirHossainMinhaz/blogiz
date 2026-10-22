import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import Blog from "@/models/Blog";
import BlogView from "@/models/BlogView";
import Comment from "@/models/Comment";
import Reaction from "@/models/Reaction";
import { denied, requirePermission } from "@/lib/authz";
import { serverError } from "@/lib/http";

const WEEK_COUNT = 12;

function startOfUtcWeek(date: Date): Date {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay(); // 0 = Sunday
  const diff = day === 0 ? -6 : 1 - day; // Monday-start week
  d.setUTCDate(d.getUTCDate() + diff);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function weekKey(date: Date): string {
  return startOfUtcWeek(date).toISOString().slice(0, 10);
}

function buildWeekBuckets(now = new Date()): Array<{ week: string; label: string }> {
  const current = startOfUtcWeek(now);
  const buckets: Array<{ week: string; label: string }> = [];
  for (let i = WEEK_COUNT - 1; i >= 0; i -= 1) {
    const start = new Date(current);
    start.setUTCDate(start.getUTCDate() - i * 7);
    const label = start.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    });
    buckets.push({ week: start.toISOString().slice(0, 10), label });
  }
  return buckets;
}

function toCountMap(rows: Array<{ _id: string; count: number }>): Map<string, number> {
  const map = new Map<string, number>();
  for (const row of rows) {
    const key = weekKey(new Date(row._id));
    map.set(key, (map.get(key) ?? 0) + row.count);
  }
  return map;
}

export async function GET(_request: NextRequest) {
  try {
    const actor = await requirePermission("createBlog");
    if (denied(actor)) return actor;

    await connectDB();

    const userId = actor.id;
    // Aggregations skip Mongoose casting; authorId is ObjectId on Blog.
    const authorObjectId = new mongoose.Types.ObjectId(userId);

    const [totalBlogs, publishedBlogs, draftBlogs, totalsAgg, topPosts, blogIdDocs] = await Promise.all([
      Blog.countDocuments({ authorId: userId }),
      Blog.countDocuments({ authorId: userId, status: "published" }),
      Blog.countDocuments({ authorId: userId, status: "draft" }),
      Blog.aggregate([
        { $match: { authorId: authorObjectId } },
        {
          $group: {
            _id: null,
            totalLikes: { $sum: "$totalLikes" },
            totalViews: { $sum: "$totalViews" },
            totalComments: { $sum: "$totalComments" },
            totalDislikes: { $sum: "$totalDislikes" },
          },
        },
      ]),
      Blog.find({ authorId: userId, status: "published" })
        .sort({ totalLikes: -1, totalViews: -1, totalComments: -1 })
        .limit(5)
        .select("title totalLikes totalViews totalComments publishedAt")
        .lean(),
      Blog.find({ authorId: userId }).select("_id").lean(),
    ]);

    const blogIds = blogIdDocs.map((doc) => doc._id as mongoose.Types.ObjectId);
    const weekBuckets = buildWeekBuckets();
    const rangeStart = new Date(weekBuckets[0].week);

    let viewsByWeek = new Map<string, number>();
    let likesByWeek = new Map<string, number>();
    let commentsByWeek = new Map<string, number>();

    if (blogIds.length > 0) {
      const [viewRows, likeRows, commentRows] = await Promise.all([
        BlogView.aggregate([
          { $match: { blogId: { $in: blogIds }, viewedAt: { $gte: rangeStart } } },
          {
            $group: {
              _id: {
                $dateToString: { format: "%Y-%m-%d", date: "$viewedAt" },
              },
              count: { $sum: 1 },
            },
          },
        ]),
        Reaction.aggregate([
          {
            $match: {
              blogId: { $in: blogIds },
              type: "like",
              createdAt: { $gte: rangeStart },
            },
          },
          {
            $group: {
              _id: {
                $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
              },
              count: { $sum: 1 },
            },
          },
        ]),
        Comment.aggregate([
          {
            $match: {
              blogId: { $in: blogIds },
              isVisible: true,
              createdAt: { $gte: rangeStart },
            },
          },
          {
            $group: {
              _id: {
                $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
              },
              count: { $sum: 1 },
            },
          },
        ]),
      ]);

      viewsByWeek = toCountMap(viewRows);
      likesByWeek = toCountMap(likeRows);
      commentsByWeek = toCountMap(commentRows);
    }

    const engagementOverTime = weekBuckets.map(({ week, label }) => ({
      week,
      label,
      views: viewsByWeek.get(week) ?? 0,
      likes: likesByWeek.get(week) ?? 0,
      comments: commentsByWeek.get(week) ?? 0,
    }));

    const totals = totalsAgg[0] || {
      totalLikes: 0,
      totalViews: 0,
      totalComments: 0,
      totalDislikes: 0,
    };

    return NextResponse.json({
      stats: {
        totalBlogs,
        publishedBlogs,
        draftBlogs,
        totalLikes: totals.totalLikes || 0,
        totalViews: totals.totalViews || 0,
        totalComments: totals.totalComments || 0,
        totalDislikes: totals.totalDislikes || 0,
      },
      statusMix: [
        { status: "Published", count: publishedBlogs },
        { status: "Draft", count: draftBlogs },
      ],
      engagementOverTime,
      topPosts: topPosts.map((post) => ({
        id: String(post._id),
        title: post.title,
        totalLikes: post.totalLikes ?? 0,
        totalViews: post.totalViews ?? 0,
        totalComments: post.totalComments ?? 0,
        publishedAt: post.publishedAt ?? null,
      })),
    });
  } catch (error) {
    return serverError("Error fetching blog analytics:", error);
  }
}
