import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Blog from "@/models/Blog";
import Comment from "@/models/Comment";
import Like from "@/models/Like";
import BlogView from "@/models/BlogView";
import Banner from "@/models/Banner";
import { auth } from "@/lib/auth";

// GET /api/user/dashboard - Get comprehensive user dashboard data
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    const userId = (session.user as any).id;
    const userRole = (session.user as any).role;

    // Get user info
    const user = await User.findById(userId).select("-password");
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Initialize dashboard data
    const dashboardData: any = {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profile: user.profile,
        isApproved: user.isApproved,
        createdAt: user.createdAt,
      },
      stats: {},
      activity: {},
      recentActivity: [],
    };

    // Common stats for all users
    const [totalComments, totalLikes] = await Promise.all([
      Comment.countDocuments({ userId, isApproved: true }),
      Like.countDocuments({ userId }),
    ]);

    dashboardData.stats.comments = totalComments;
    dashboardData.stats.likes = totalLikes;

    // User-specific data
    if (userRole === "user") {
      // Get user's reading activity
      const viewedBlogs = await BlogView.distinct("blogId", { userId });
      const readBlogs = await Blog.find({
        _id: { $in: viewedBlogs },
        status: "published",
        isApproved: true,
      })
        .select("title author_name publish_date total_likes total_comments")
        .populate("authorId", "profile.fullName profile.avatar name")
        .sort({ publish_date: -1 })
        .limit(10);

      dashboardData.activity.readBlogs = readBlogs;
      dashboardData.stats.readBlogsCount = viewedBlogs.length;

      // Get recent comments
      const recentComments = await Comment.find({ userId, isApproved: true })
        .populate("blogId", "title author_name")
        .sort({ createdAt: -1 })
        .limit(5);

      dashboardData.activity.recentComments = recentComments;

      // Get liked blogs
      const likedBlogIds = await Like.distinct("blogId", { userId });
      const likedBlogs = await Blog.find({
        _id: { $in: likedBlogIds },
        status: "published",
        isApproved: true,
      })
        .select("title author_name publish_date total_likes total_comments")
        .sort({ publish_date: -1 })
        .limit(10);

      dashboardData.activity.likedBlogs = likedBlogs;
      dashboardData.stats.likedBlogsCount = likedBlogIds.length;

    } else if (userRole === "author" || userRole === "admin" || userRole === "superadmin") {
      // Author/Admin specific data
      
      // Blog statistics
      const [
        totalBlogs,
        publishedBlogs,
        draftBlogs,
        pendingBlogs,
        rejectedBlogs,
      ] = await Promise.all([
        Blog.countDocuments({ createdBy: userId }),
        Blog.countDocuments({ createdBy: userId, status: "published", isApproved: true }),
        Blog.countDocuments({ createdBy: userId, status: "draft" }),
        Blog.countDocuments({ createdBy: userId, status: "pending" }),
        Blog.countDocuments({ createdBy: userId, status: "rejected" }),
      ]);

      dashboardData.stats.blogs = {
        total: totalBlogs,
        published: publishedBlogs,
        draft: draftBlogs,
        pending: pendingBlogs,
        rejected: rejectedBlogs,
      };

      // Get blog views
      const blogIds = await Blog.distinct("_id", { createdBy: userId });
      const totalViews = await BlogView.countDocuments({
        blogId: { $in: blogIds },
      });

      dashboardData.stats.totalViews = totalViews;

      // Get recent blogs
      const recentBlogs = await Blog.find({ createdBy: userId })
        .select("title status publish_date total_likes total_comments readingTime isApproved")
        .sort({ createdAt: -1 })
        .limit(5);

      dashboardData.activity.recentBlogs = recentBlogs;

      // Get top performing blogs
      const topBlogs = await Blog.aggregate([
        { $match: { createdBy: userId, status: "published", isApproved: true } },
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
        { $sort: { viewCount: -1, total_likes: -1 } },
        { $limit: 5 },
        {
          $project: {
            title: 1,
            publish_date: 1,
            total_likes: 1,
            total_comments: 1,
            viewCount: 1,
            readingTime: 1,
          },
        },
      ]);

      dashboardData.activity.topBlogs = topBlogs;

      // Get recent comments on user's blogs
      const userBlogIds = await Blog.distinct("_id", { createdBy: userId });
      const recentBlogComments = await Comment.find({
        blogId: { $in: userBlogIds },
        isApproved: true,
      })
        .populate("userId", "profile.fullName profile.avatar name")
        .populate("blogId", "title")
        .sort({ createdAt: -1 })
        .limit(5);

      dashboardData.activity.recentBlogComments = recentBlogComments;

      // Reading analytics (last 30 days)
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
        totalViewsLast30Days: recentViews.reduce((sum: number, day: any) => sum + day.views, 0),
      };
    }

    // Get recent activity timeline
    const timeline: Array<{
      type: string;
      action: string;
      target: string;
      content?: string;
      createdAt: Date;
    }> = [];
    
    // Recent comments
    const recentComments = await Comment.find({ userId, isApproved: true })
      .select("content createdAt blogId")
      .populate("blogId", "title")
      .sort({ createdAt: -1 })
      .limit(3);

    recentComments.forEach((comment: any) => {
      timeline.push({
        type: "comment",
        action: "commented on",
        target: comment.blogId?.title || "a blog",
        content: comment.content.substring(0, 100) + (comment.content.length > 100 ? "..." : ""),
        createdAt: comment.createdAt,
      });
    });

    // Recent likes
    const recentLikes = await Like.find({ userId })
      .populate("blogId", "title")
      .sort({ createdAt: -1 })
      .limit(3);

    recentLikes.forEach((like: any) => {
      timeline.push({
        type: "like",
        action: "liked",
        target: like.blogId?.title || "a blog",
        createdAt: like.createdAt,
      });
    });

    // Add banner statistics for admins
    if (userRole === "admin" || userRole === "superadmin") {
      const [totalBanners, activeBanners] = await Promise.all([
        Banner.countDocuments(),
        Banner.countDocuments({ isActive: true }),
      ]);
      
      dashboardData.stats.banners = {
        total: totalBanners,
        active: activeBanners,
        inactive: totalBanners - activeBanners,
      };
    }

    // Sort timeline by date
    timeline.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    dashboardData.recentActivity = timeline.slice(0, 5);

    return NextResponse.json(dashboardData);
  } catch (error: any) {
    console.error("Error fetching dashboard data:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data", message: error.message },
      { status: 500 }
    );
  }
}
