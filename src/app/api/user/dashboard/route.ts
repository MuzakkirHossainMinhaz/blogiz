import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Blog from "@/models/Blog";
import Comment from "@/models/Comment";
import Reaction from "@/models/Reaction";
import BlogView from "@/models/BlogView";
import { denied, requireUser } from "@/lib/authz";
import { serverError } from "@/lib/http";

export async function GET(request: NextRequest) {
  try {
    const actor = await requireUser();
    if (denied(actor)) return actor;

    await connectDB();

    const userId = actor.id;
    const userRole = actor.role;
    const objectId = new mongoose.Types.ObjectId(userId);

    const user = await User.findById(userId).select("-password");
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const dashboardData: Record<string, unknown> = {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profile: user.profile,
        commentSuspended: user.commentSuspended,
        createdAt: user.createdAt,
      },
      stats: {} as Record<string, unknown>,
      activity: {} as Record<string, unknown>,
      recentActivity: [],
    };

    const stats = dashboardData.stats as Record<string, unknown>;
    const activity = dashboardData.activity as Record<string, unknown>;

    const [totalComments, totalReactions] = await Promise.all([
      Comment.countDocuments({ userId, isVisible: true }),
      Reaction.countDocuments({ userId }),
    ]);

    stats.comments = totalComments;
    stats.likes = totalReactions;

    if (userRole === "reader") {
      const viewedBlogs = await BlogView.distinct("blogId", { userId });
      const readBlogs = await Blog.find({
        _id: { $in: viewedBlogs },
        status: "published",
      })
        .select("title authorName thumbnail publishedAt readingTime totalLikes totalComments")
        .populate("authorId", "profile.fullName profile.avatar name")
        .sort({ publishedAt: -1 })
        .limit(10);

      activity.readBlogs = readBlogs;
      stats.readBlogsCount = viewedBlogs.length;

      const recentComments = await Comment.find({ userId, isVisible: true })
        .populate("blogId", "title authorName")
        .sort({ createdAt: -1 })
        .limit(5);

      activity.recentComments = recentComments;

      const likedBlogIds = await Reaction.distinct("blogId", { userId, type: "like" });
      const likedBlogs = await Blog.find({
        _id: { $in: likedBlogIds },
        status: "published",
      })
        .select("title authorName thumbnail publishedAt readingTime totalLikes totalComments")
        .sort({ publishedAt: -1 })
        .limit(10);

      activity.likedBlogs = likedBlogs;
      stats.likedBlogsCount = likedBlogIds.length;
    } else if (userRole === "author" || userRole === "admin") {
      const [totalBlogs, publishedBlogs, draftBlogs] = await Promise.all([
        Blog.countDocuments({ authorId: userId }),
        Blog.countDocuments({ authorId: userId, status: "published" }),
        Blog.countDocuments({ authorId: userId, status: "draft" }),
      ]);

      stats.blogs = {
        total: totalBlogs,
        published: publishedBlogs,
        draft: draftBlogs,
      };

      const blogIds = await Blog.distinct("_id", { authorId: userId });
      const totalViews = await BlogView.countDocuments({
        blogId: { $in: blogIds },
      });

      stats.totalViews = totalViews;

      const recentBlogs = await Blog.find({ authorId: userId })
        .select("title status publishedAt totalLikes totalComments readingTime")
        .sort({ createdAt: -1 })
        .limit(5);

      activity.recentBlogs = recentBlogs;

      const topBlogs = await Blog.aggregate([
        { $match: { authorId: objectId, status: "published" } },
        {
          $lookup: {
            from: "blogviews",
            localField: "_id",
            foreignField: "blogId",
            as: "views",
          },
        },
        {
          $addFields: {
            viewCount: { $size: "$views" },
          },
        },
        { $sort: { viewCount: -1, totalLikes: -1 } },
        { $limit: 5 },
        {
          $project: {
            title: 1,
            publishedAt: 1,
            totalLikes: 1,
            totalComments: 1,
            viewCount: 1,
            readingTime: 1,
          },
        },
      ]);

      activity.topBlogs = topBlogs;

      const recentBlogComments = await Comment.find({
        blogId: { $in: blogIds },
        isVisible: true,
      })
        .populate("userId", "profile.fullName profile.avatar name")
        .populate("blogId", "title")
        .sort({ createdAt: -1 })
        .limit(5);

      activity.recentBlogComments = recentBlogComments;

      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const recentViews = await BlogView.aggregate([
        {
          $match: {
            blogId: { $in: blogIds },
            viewedAt: { $gte: thirtyDaysAgo },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$viewedAt" },
            },
            views: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      dashboardData.analytics = {
        dailyViews: recentViews,
        totalViewsLast30Days: recentViews.reduce((sum: number, day: { views: number }) => sum + day.views, 0),
      };
    }

    const timeline: Array<{
      type: string;
      action: string;
      target: string;
      content?: string;
      createdAt: Date;
    }> = [];

    const recentComments = await Comment.find({ userId, isVisible: true })
      .select("content createdAt blogId")
      .populate("blogId", "title")
      .sort({ createdAt: -1 })
      .limit(3);

    recentComments.forEach((comment) => {
      const blog = comment.blogId as unknown as { title?: string } | null;
      timeline.push({
        type: "comment",
        action: "commented on",
        target: blog?.title || "a blog",
        content: comment.content.substring(0, 100) + (comment.content.length > 100 ? "..." : ""),
        createdAt: comment.createdAt,
      });
    });

    const recentReactions = await Reaction.find({ userId })
      .populate("blogId", "title")
      .sort({ createdAt: -1 })
      .limit(3);

    recentReactions.forEach((reaction) => {
      const blog = reaction.blogId as unknown as { title?: string } | null;
      timeline.push({
        type: "like",
        action: reaction.type === "like" ? "liked" : "disliked",
        target: blog?.title || "a blog",
        createdAt: reaction.createdAt,
      });
    });

    timeline.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    dashboardData.recentActivity = timeline.slice(0, 5);

    return NextResponse.json(dashboardData);
  } catch (error) {
    return serverError("Error fetching dashboard data:", error);
  }
}
