import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Comment from "@/models/Comment";
import Blog from "@/models/Blog";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { tensorflowAI } from "@/lib/tensorflow";

// GET /api/comments - Get comments for a blog
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const blogId = searchParams.get("blogId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    if (!blogId) {
      return NextResponse.json(
        { error: "Blog ID is required" },
        { status: 400 }
      );
    }

    const skip = (page - 1) * limit;

    // Get approved comments (top-level only)
    const comments = await Comment.find({ 
      blogId, 
      parentId: null, 
      isApproved: true 
    })
      .populate("userId", "profile.fullName profile.avatar name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get replies for each comment
    const commentsWithReplies = await Promise.all(
      comments.map(async (comment: any) => {
        const replies = await Comment.find({ 
          parentId: comment._id, 
          isApproved: true 
        })
          .populate("userId", "profile.fullName profile.avatar name")
          .sort({ createdAt: 1 })
          .lean();

        return {
          ...comment,
          replies,
        };
      })
    );

    // Get total count
    const total = await Comment.countDocuments({ 
      blogId, 
      parentId: null, 
      isApproved: true 
    });

    return NextResponse.json({
      comments: commentsWithReplies,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("Error fetching comments:", error);
    return NextResponse.json(
      { error: "Failed to fetch comments", message: error.message },
      { status: 500 }
    );
  }
}

// POST /api/comments - Create a new comment
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized - Please login to comment" },
        { status: 401 }
      );
    }

    await connectDB();

    const body = await request.json();
    const { blogId, content, parentId } = body;

    // Validation
    if (!blogId || !content) {
      return NextResponse.json(
        { error: "Blog ID and content are required" },
        { status: 400 }
      );
    }

    // Check if blog exists
    const blog = await Blog.findById(blogId);
    if (!blog) {
      return NextResponse.json(
        { error: "Blog not found" },
        { status: 404 }
      );
    }

    // Check if parent comment exists (if it's a reply)
    if (parentId) {
      const parentComment = await Comment.findById(parentId);
      if (!parentComment) {
        return NextResponse.json(
          { error: "Parent comment not found" },
          { status: 404 }
        );
      }
    }

    const userId = (session.user as any).id;
    const userRole = (session.user as any).role;

    // AI Content Moderation
    let moderationResult: any = null;
    let autoApproved = false;

    try {
      // Initialize TensorFlow.js models
      await tensorflowAI.initializeModels();
      
      // Validate comment content
      moderationResult = await tensorflowAI.validateComment(content);
      
      // Auto-approve if content is clean and user has permission
      if (moderationResult.isValid && hasPermission(userRole, "approveComment")) {
        autoApproved = true;
      }
    } catch (error) {
      console.error("AI moderation failed:", error);
      // Continue without moderation if it fails
    }

    // Create comment
    const comment = await Comment.create({
      blogId,
      userId,
      content: content.trim(),
      parentId: parentId || null,
      isApproved: autoApproved || moderationResult?.isValid || false,
    });

    // Update blog comment count
    await Blog.findByIdAndUpdate(blogId, {
      $inc: { total_comments: 1 },
    });

    // Populate user info
    const populatedComment = await Comment.findById(comment._id)
      .populate("userId", "profile.fullName profile.avatar name")
      .lean();

    return NextResponse.json(
      { 
        message: comment.isApproved 
          ? "Comment posted successfully" 
          : "Comment submitted for approval", 
        comment: populatedComment,
        moderation: moderationResult, // Include moderation results
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating comment:", error);
    return NextResponse.json(
      { error: "Failed to create comment", message: error.message },
      { status: 500 }
    );
  }
}
