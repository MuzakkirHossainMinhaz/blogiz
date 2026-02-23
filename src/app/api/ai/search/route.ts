import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Blog from "@/models/Blog";
import { huggingFaceAI } from "@/lib/huggingface";
import { tensorflowAI } from "@/lib/tensorflow";
import { auth } from "@/lib/auth";

// POST /api/ai/search - AI-powered semantic search
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { query, limit = 10, category, author } = body;

    if (!query) {
      return NextResponse.json(
        { error: "Search query is required" },
        { status: 400 }
      );
    }

    // Build base search query
    const searchQuery: any = {
      status: "published",
      isApproved: true,
    };

    if (category) {
      searchQuery.tags = { $in: [category.toLowerCase()] };
    }

    if (author) {
      searchQuery.authorId = author;
    }

    // Get all published blogs (for semantic search)
    const blogs = await Blog.find(searchQuery)
      .populate("authorId", "profile.fullName profile.avatar name")
      .lean();

    // Initialize TensorFlow.js for similarity calculation
    await tensorflowAI.initializeModels();

    // Calculate similarity scores
    const blogsWithScores = await Promise.all(
      blogs.map(async (blog: any) => {
        const searchText = `${blog.title} ${blog.description} ${blog.content.substring(0, 500)}`;
        const similarity = await tensorflowAI.calculateSimilarity(query, searchText);
        
        return {
          ...blog,
          similarityScore: similarity,
        };
      })
    );

    // Sort by similarity score and limit results
    const sortedBlogs = blogsWithScores
      .sort((a, b) => b.similarityScore - a.similarityScore)
      .slice(0, limit)
      .map(({ similarityScore, ...blog }) => blog);

    return NextResponse.json({
      blogs: sortedBlogs,
      query,
      totalFound: blogs.length,
      semantic: true,
    });
  } catch (error: any) {
    console.error("AI search failed:", error);
    return NextResponse.json(
      { error: "Search failed", message: error.message },
      { status: 500 }
    );
  }
}

// GET /api/ai/search/recommendations - Get personalized recommendations
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

    const { searchParams } = new URL(request.url);
    const userId = (session.user as any).id;
    const limit = parseInt(searchParams.get("limit") || "5");
    const type = searchParams.get("type") || "similar"; // similar, trending, personalized

    let recommendations: any[] = [];

    switch (type) {
      case "similar":
        recommendations = await getSimilarContentRecommendations(userId, limit);
        break;
      case "trending":
        recommendations = await getTrendingRecommendations(limit);
        break;
      case "personalized":
        recommendations = await getPersonalizedRecommendations(userId, limit);
        break;
      default:
        recommendations = await getSimilarContentRecommendations(userId, limit);
    }

    return NextResponse.json({
      recommendations,
      type,
      count: recommendations.length,
    });
  } catch (error: any) {
    console.error("Recommendations failed:", error);
    return NextResponse.json(
      { error: "Failed to get recommendations", message: error.message },
      { status: 500 }
    );
  }
}

async function getSimilarContentRecommendations(userId: string, limit: number): Promise<any[]> {
  // Get user's recently read blogs (from views)
  const BlogView = (await import("@/models/BlogView")).default;
  const recentViews = await BlogView.find({ userId })
    .sort({ viewedAt: -1 })
    .limit(5)
    .distinct("blogId");

  if (recentViews.length === 0) {
    // If no history, return trending content
    return await getTrendingRecommendations(limit);
  }

  // Get content of recently read blogs
  const recentBlogs = await Blog.find({
    _id: { $in: recentViews },
    status: "published",
    isApproved: true,
  }).lean();

  // Find similar blogs
  const allBlogs = await Blog.find({
    _id: { $nin: recentViews },
    status: "published",
    isApproved: true,
  })
    .populate("authorId", "profile.fullName profile.avatar name")
    .lean();

  await tensorflowAI.initializeModels();

  // Calculate similarity based on content
  const blogsWithScores = await Promise.all(
    allBlogs.map(async (blog: any) => {
      let maxSimilarity = 0;
      
      for (const recentBlog of recentBlogs) {
        const recentText = `${recentBlog.title} ${recentBlog.description}`;
        const blogText = `${blog.title} ${blog.description}`;
        const similarity = await tensorflowAI.calculateSimilarity(recentText, blogText);
        maxSimilarity = Math.max(maxSimilarity, similarity);
      }
      
      return {
        ...blog,
        similarityScore: maxSimilarity,
      };
    })
  );

  return blogsWithScores
    .sort((a, b) => b.similarityScore - a.similarityScore)
    .slice(0, limit)
    .map(({ similarityScore, ...blog }) => blog);
}

async function getTrendingRecommendations(limit: number): Promise<any[]> {
  // Get blogs with most views and likes in the last 7 days
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  
  const trendingBlogs = await Blog.find({
    status: "published",
    isApproved: true,
    publish_date: { $gte: sevenDaysAgo },
  })
    .populate("authorId", "profile.fullName profile.avatar name")
    .sort({ total_likes: -1, total_comments: -1 })
    .limit(limit)
    .lean();

  return trendingBlogs;
}

async function getPersonalizedRecommendations(userId: string, limit: number): Promise<any[]> {
  // Get user's interaction history
  const Comment = (await import("@/models/Comment")).default;
  const Like = (await import("@/models/Like")).default;
  
  const [userComments, userLikes] = await Promise.all([
    Comment.find({ userId, isApproved: true }).distinct("blogId"),
    Like.find({ userId }).distinct("blogId"),
  ]);

  const interactedBlogs = [...new Set([...userComments, ...userLikes])];

  if (interactedBlogs.length === 0) {
    return await getTrendingRecommendations(limit);
  }

  // Get interacted blogs to understand user preferences
  const interactedContent = await Blog.find({
    _id: { $in: interactedBlogs },
    status: "published",
    isApproved: true,
  }).lean();

  // Extract common themes and tags
  const allTags = interactedContent.flatMap((blog: any) => blog.tags || []);
  const tagFrequency = allTags.reduce((acc: any, tag: string) => {
    acc[tag] = (acc[tag] || 0) + 1;
    return acc;
  }, {});

  const preferredTags = Object.entries(tagFrequency)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 5)
    .map(([tag]) => tag);

  // Get blogs with preferred tags that user hasn't interacted with
  const recommendations = await Blog.find({
    _id: { $nin: interactedBlogs },
    status: "published",
    isApproved: true,
    tags: { $in: preferredTags },
  })
    .populate("authorId", "profile.fullName profile.avatar name")
    .sort({ total_likes: -1 })
    .limit(limit)
    .lean();

  return recommendations;
}

// PUT /api/ai/search/similar - Find similar content
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { blogId, limit = 5 } = body;

    if (!blogId) {
      return NextResponse.json(
        { error: "Blog ID is required" },
        { status: 400 }
      );
    }

    await connectDB();

    // Get the source blog
    const sourceBlog = await Blog.findById(blogId);
    if (!sourceBlog) {
      return NextResponse.json(
        { error: "Blog not found" },
        { status: 404 }
      );
    }

    // Get other published blogs
    const otherBlogs = await Blog.find({
      _id: { $ne: blogId },
      status: "published",
      isApproved: true,
    })
      .populate("authorId", "profile.fullName profile.avatar name")
      .lean();

    await tensorflowAI.initializeModels();

    // Calculate similarity scores
    const sourceText = `${sourceBlog.title} ${sourceBlog.description} ${sourceBlog.content.substring(0, 500)}`;
    
    const blogsWithScores = await Promise.all(
      otherBlogs.map(async (blog: any) => {
        const blogText = `${blog.title} ${blog.description} ${blog.content.substring(0, 500)}`;
        const similarity = await tensorflowAI.calculateSimilarity(sourceText, blogText);
        
        return {
          ...blog,
          similarityScore: similarity,
        };
      })
    );

    // Sort by similarity and limit results
    const similarBlogs = blogsWithScores
      .sort((a, b) => b.similarityScore - a.similarityScore)
      .slice(0, limit)
      .map(({ similarityScore, ...blog }) => blog);

    return NextResponse.json({
      similarBlogs,
      sourceBlogId: blogId,
      count: similarBlogs.length,
    });
  } catch (error: any) {
    console.error("Similar content search failed:", error);
    return NextResponse.json(
      { error: "Failed to find similar content", message: error.message },
      { status: 500 }
    );
  }
}
