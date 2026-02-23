import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Blog from "@/models/Blog";
import { auth } from "@/lib/auth";
import { huggingFaceAI } from "@/lib/huggingface";

// GET /api/blogs - Get all published blogs
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "published";

    const skip = (page - 1) * limit;

    // Build query
    const query: any = { status };

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { author_name: { $regex: search, $options: "i" } },
      ];
    }

    // Get blogs with pagination
    const blogs = await Blog.find(query)
      .populate("authorId", "profile.fullName profile.avatar profile.bio name")
      .sort({ publish_date: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count
    const total = await Blog.countDocuments(query);

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
    console.error("Error fetching blogs:", error);
    return NextResponse.json(
      { error: "Failed to fetch blogs", message: error.message },
      { status: 500 }
    );
  }
}

// POST /api/blogs - Create new blog (auth required)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized - Please login" },
        { status: 401 }
      );
    }

    await connectDB();

    const body = await request.json();
    const {
      title,
      description,
      content,
      author_name,
      blog_image,
      status = "draft",
      publish_date,
      tags,
      enableAI = true, // Enable AI analysis by default
    } = body;

    // Validation
    if (!title || !description || !content || !author_name) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get user info
    const userId = (session.user as any).id;
    const userRole = (session.user as any).role;

    // Determine blog status based on user role
    let finalStatus = status;
    if (status === "published" && userRole !== "admin" && userRole !== "superadmin") {
      // Non-admin users need approval
      finalStatus = "pending";
    }

    // Calculate reading time (rough estimate: 200 words per minute)
    const wordCount = content.split(/\s+/).length;
    const readingTime = Math.ceil(wordCount / 200);

    // AI Analysis (if enabled)
    let aiAnalysis: any = null;
    if (enableAI) {
      try {
        // Generate tags if not provided
        let finalTags = tags || [];
        if (!finalTags.length) {
          finalTags = await huggingFaceAI.generateTags(content);
        }

        // Generate SEO metadata
        const seoData = await huggingFaceAI.generateSEOMetadata(title, content);
        
        // Generate summary
        const summary = await huggingFaceAI.generateBlogSummary(content);
        
        // Analyze sentiment
        const sentiment = await huggingFaceAI.analyzeSentiment(content);

        aiAnalysis = {
          tags: finalTags,
          seo: seoData,
          summary,
          sentiment,
          readingTime,
          wordCount,
        };
      } catch (error) {
        console.error("AI analysis failed:", error);
        // Continue without AI analysis if it fails
      }
    }

    // Create blog
    const blog = await Blog.create({
      title,
      description,
      content,
      author_name,
      authorId: userId,
      ...(blog_image && { blog_image }),
      status: finalStatus,
      isApproved: finalStatus === "published",
      publish_date: publish_date || new Date(),
      tags: aiAnalysis?.tags || tags || [],
      readingTime: aiAnalysis?.readingTime || readingTime,
      createdBy: userId,
      total_likes: 0,
      total_comments: 0,
      total_views: 0,
    });

    return NextResponse.json(
      { 
        message: finalStatus === "pending" 
          ? "Blog submitted for approval" 
          : "Blog created successfully", 
        blog,
        aiAnalysis, // Include AI analysis in response
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating blog:", error);
    return NextResponse.json(
      { error: "Failed to create blog", message: error.message },
      { status: 500 }
    );
  }
}
