import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Blog from "@/models/Blog";
import Comment from "@/models/Comment";
import Like from "@/models/Like";
import BlogView from "@/models/BlogView";
import { auth } from "@/lib/auth";
import { huggingFaceAI } from "@/lib/huggingface";
import { tensorflowAI } from "@/lib/tensorflow";

// GET /api/ai/dashboard - Get AI-powered analytics and insights
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

    const dashboardData: any = {
      aiInsights: {},
      contentAnalytics: {},
      userEngagement: {},
      trendingTopics: [],
      recommendations: [],
    };

    // Content Analytics
    if (userRole === "author" || userRole === "admin" || userRole === "superadmin") {
      const userBlogs = await Blog.find({ createdBy: userId });
      
      if (userBlogs.length > 0) {
        // Analyze content sentiment trends
        const sentimentAnalysis = await analyzeContentSentiment(userBlogs);
        dashboardData.contentAnalytics.sentimentTrends = sentimentAnalysis;

        // Get top performing content
        const topContent = await getTopPerformingContent(userId);
        dashboardData.contentAnalytics.topPerforming = topContent;

        // Content quality scores
        const qualityScores = await getContentQualityScores(userBlogs);
        dashboardData.contentAnalytics.qualityScores = qualityScores;
      }
    }

    // User Engagement Analysis
    const [userComments, userLikes] = await Promise.all([
      Comment.find({ userId, isApproved: true }),
      Like.find({ userId }),
    ]);

    if (userComments.length > 0) {
      const commentAnalysis = await analyzeUserComments(userComments);
      dashboardData.userEngagement.commentAnalysis = commentAnalysis;
    }

    // Platform-wide insights (for admins)
    if (userRole === "admin" || userRole === "superadmin") {
      const platformInsights = await getPlatformInsights();
      dashboardData.platformInsights = platformInsights;
    }

    // AI Recommendations
    const recommendations = await generateAIRecommendations(userId, userRole);
    dashboardData.recommendations = recommendations;

    // Trending Topics
    const trendingTopics = await getTrendingTopics();
    dashboardData.trendingTopics = trendingTopics;

    return NextResponse.json(dashboardData);
  } catch (error: any) {
    console.error("AI dashboard data failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch AI dashboard data", message: error.message },
      { status: 500 }
    );
  }
}

// POST /api/ai/dashboard/analyze - Analyze specific content
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { content, type = "blog" } = body;

    if (!content) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    // Initialize AI models
    await tensorflowAI.initializeModels();

    let analysis: any = {};

    switch (type) {
      case "blog":
        analysis = await analyzeBlogContent(content);
        break;
      case "comment":
        analysis = await tensorflowAI.validateComment(content);
        break;
      case "general":
        analysis = await tensorflowAI.analyzeContent(content);
        break;
      default:
        analysis = await tensorflowAI.analyzeContent(content);
    }

    return NextResponse.json({
      analysis,
      content: content.substring(0, 100) + (content.length > 100 ? "..." : ""),
      type,
    });
  } catch (error: any) {
    console.error("Content analysis failed:", error);
    return NextResponse.json(
      { error: "Failed to analyze content", message: error.message },
      { status: 500 }
    );
  }
}

// Helper Functions
async function analyzeContentSentiment(blogs: any[]): Promise<any> {
  const sentiments = await Promise.all(
    blogs.map(async (blog) => {
      const sentiment = await huggingFaceAI.analyzeSentiment(blog.content);
      return {
        blogId: blog._id,
        title: blog.title,
        sentiment,
        publishDate: blog.publish_date,
      };
    })
  );

  // Group by sentiment
  const sentimentGroups = sentiments.reduce((acc: any, item) => {
    const sentiment = item.sentiment.sentiment;
    if (!acc[sentiment]) acc[sentiment] = [];
    acc[sentiment].push(item);
    return acc;
  }, {});

  return {
    total: sentiments.length,
    distribution: {
      positive: sentimentGroups.positive?.length || 0,
      negative: sentimentGroups.negative?.length || 0,
      neutral: sentimentGroups.neutral?.length || 0,
    },
    trends: sentiments.slice(-10), // Last 10 blogs
  };
}

async function getTopPerformingContent(userId: string): Promise<any[]> {
  const blogs = await Blog.find({ createdBy: userId })
    .populate("authorId", "profile.fullName profile.avatar name")
    .lean();

  // Get view counts for each blog
  const blogIds = blogs.map(blog => blog._id);
  const viewCounts = await BlogView.aggregate([
    { $match: { blogId: { $in: blogIds } } },
    { $group: { _id: "$blogId", count: { $sum: 1 } } },
  ]);

  // Combine blog data with view counts
  const blogsWithViews = blogs.map(blog => {
    const viewData = viewCounts.find(v => v._id.equals(blog._id));
    return {
      ...blog,
      views: viewData?.count || 0,
      engagement: (blog.total_likes || 0) + (blog.total_comments || 0) + (viewData?.count || 0),
    };
  });

  // Sort by engagement
  return blogsWithViews
    .sort((a, b) => b.engagement - a.engagement)
    .slice(0, 5);
}

async function getContentQualityScores(blogs: any[]): Promise<any[]> {
  await tensorflowAI.initializeModels();

  const qualityScores = await Promise.all(
    blogs.map(async (blog) => {
      const qualityScore = await tensorflowAI.getContentQualityScore(blog.content);
      return {
        blogId: blog._id,
        title: blog.title,
        qualityScore,
      };
    })
  );

  return qualityScores.sort((a, b) => b.qualityScore.overallScore - a.qualityScore.overallScore);
}

async function analyzeUserComments(comments: any[]): Promise<any> {
  await tensorflowAI.initializeModels();

  const commentAnalyses = await Promise.all(
    comments.map(async (comment) => {
      const sentiment = await tensorflowAI.analyzeSentiment(comment.content);
      const quality = await tensorflowAI.getContentQualityScore(comment.content);
      
      return {
        commentId: comment._id,
        sentiment,
        quality,
        createdAt: comment.createdAt,
      };
    })
  );

  // Calculate averages
  const avgSentiment = commentAnalyses.reduce((sum, item) => sum + item.sentiment.score, 0) / commentAnalyses.length;
  const avgQuality = commentAnalyses.reduce((sum, item) => sum + item.quality.overallScore, 0) / commentAnalyses.length;

  return {
    total: comments.length,
    averageSentiment: avgSentiment,
    averageQuality: avgQuality,
    recent: commentAnalyses.slice(-5),
  };
}

async function getPlatformInsights(): Promise<any> {
  const [
    totalBlogs,
    totalComments,
    totalLikes,
    totalViews,
    recentBlogs,
  ] = await Promise.all([
    Blog.countDocuments({ status: "published", isApproved: true }),
    Comment.countDocuments({ isApproved: true }),
    Like.countDocuments(),
    BlogView.countDocuments(),
    Blog.find({ status: "published", isApproved: true })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean(),
  ]);

  // Analyze recent content trends
  const recentTags = recentBlogs.flatMap(blog => blog.tags || []);
  const tagFrequency = recentTags.reduce((acc: any, tag: string) => {
    acc[tag] = (acc[tag] || 0) + 1;
    return acc;
  }, {});

  return {
    content: {
      totalBlogs,
      totalComments,
      totalLikes,
      totalViews,
    },
    trends: {
      topTags: Object.entries(tagFrequency)
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .slice(0, 10)
        .map(([tag, count]) => ({ tag, count })),
    },
  };
}

async function generateAIRecommendations(userId: string, userRole: string): Promise<any[]> {
  const recommendations: any[] = [];

  // Content recommendations based on user's activity
  if (userRole === "author" || userRole === "admin" || userRole === "superadmin") {
    const userBlogs = await Blog.find({ createdBy: userId });
    
    if (userBlogs.length > 0) {
      // Analyze user's writing patterns
      const avgLength = userBlogs.reduce((sum, blog) => sum + blog.content.length, 0) / userBlogs.length;
      
      if (avgLength < 500) {
        recommendations.push({
          type: "content",
          title: "Write Longer Content",
          description: "Your blogs are shorter than average. Consider adding more detail to increase engagement.",
          priority: "medium",
        });
      }

      // Check posting frequency
      const sortedBlogs = userBlogs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      if (sortedBlogs.length > 1) {
        const daysSinceLastPost = (Date.now() - new Date(sortedBlogs[0].createdAt).getTime()) / (1000 * 60 * 60 * 24);
        
        if (daysSinceLastPost > 30) {
          recommendations.push({
            type: "consistency",
            title: "Post More Regularly",
            description: "It's been over 30 days since your last post. Regular posting helps maintain reader engagement.",
            priority: "high",
          });
        }
      }
    }
  }

  // General recommendations
  recommendations.push({
    type: "engagement",
    title: "Engage with Your Audience",
    description: "Respond to comments on your blogs to build a loyal readership.",
    priority: "low",
  });

  return recommendations;
}

async function getTrendingTopics(): Promise<any[]> {
  const recentBlogs = await Blog.find({
    status: "published",
    isApproved: true,
    createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
  }).lean();

  const allTags = recentBlogs.flatMap(blog => blog.tags || []);
  const tagFrequency = allTags.reduce((acc: any, tag: string) => {
    acc[tag] = (acc[tag] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(tagFrequency)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 10)
    .map(([tag, count]) => ({
      tag,
      count,
      trend: "up", // Could be calculated based on historical data
    }));
}

async function analyzeBlogContent(content: string): Promise<any> {
  await tensorflowAI.initializeModels();

  const [
    sentiment,
    quality,
    readability,
  ] = await Promise.all([
    huggingFaceAI.analyzeSentiment(content),
    tensorflowAI.getContentQualityScore(content),
    tensorflowAI.calculateReadabilityScore(content),
  ]);

  const wordCount = content.split(/\s+/).length;
  const readingTime = Math.ceil(wordCount / 200);

  return {
    sentiment,
    quality,
    readability,
    wordCount,
    readingTime,
    suggestions: await generateContentSuggestions(content, sentiment, quality),
  };
}

async function generateContentSuggestions(content: string, sentiment: any, quality: any): Promise<string[]> {
  const suggestions: string[] = [];

  if (sentiment.sentiment === "negative" && sentiment.magnitude > 0.5) {
    suggestions.push("Consider adding a more balanced perspective to your content.");
  }

  if (quality.overallScore < 60) {
    suggestions.push("Your content quality could be improved. Consider adding more structure and detail.");
  }

  if (content.length < 300) {
    suggestions.push("Your content is quite short. Consider adding more examples and explanations.");
  }

  if (content.length > 2000) {
    suggestions.push("Your content is quite long. Consider breaking it into sections or multiple posts.");
  }

  return suggestions;
}
