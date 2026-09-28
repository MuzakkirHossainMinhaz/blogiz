import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Comment from "@/models/Comment";
import Blog from "@/models/Blog";
import { denied, requirePermission } from "@/lib/authz";
import { syncCommentCount } from "@/lib/engagement";
import { jsonError, serverError } from "@/lib/http";
import { parsePageLimit } from "@/lib/pagination";
import { hasPermission } from "@/lib/permissions";
import { publicPostFilter } from "@/lib/public-posts";
import mongoose from "mongoose";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const blogId = searchParams.get("blogId") || "";
    if (!mongoose.Types.ObjectId.isValid(blogId)) {
      return jsonError("Blog ID is required", 400);
    }

    const paging = parsePageLimit(searchParams.get("page"), searchParams.get("limit"));
    if ("error" in paging) return jsonError(paging.error, 400);

    await connectDB();

    const filter = { blogId, parentId: null, isApproved: true };
    const [comments, total] = await Promise.all([
      Comment.find(filter)
        .populate("userId", "profile.fullName profile.avatar name")
        .sort({ createdAt: -1 })
        .skip(paging.skip)
        .limit(paging.limit)
        .lean(),
      Comment.countDocuments(filter),
    ]);

    const commentsWithReplies = await Promise.all(
      comments.map(async (comment) => {
        const replies = await Comment.find({ parentId: comment._id, isApproved: true })
          .populate("userId", "profile.fullName profile.avatar name")
          .sort({ createdAt: 1 })
          .lean();
        return { ...comment, replies };
      })
    );

    return NextResponse.json({
      comments: commentsWithReplies,
      pagination: {
        page: paging.page,
        limit: paging.limit,
        total,
        pages: Math.ceil(total / paging.limit),
      },
    });
  } catch (error) {
    return serverError("Error fetching comments:", error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const actor = await requirePermission("createComment", { verified: true });
    if (denied(actor)) return actor;

    const body = await request.json().catch(() => null);
    const blogId = typeof body?.blogId === "string" ? body.blogId : "";
    const content = typeof body?.content === "string" ? body.content.trim() : "";
    const parentId = typeof body?.parentId === "string" ? body.parentId : "";

    if (!mongoose.Types.ObjectId.isValid(blogId) || content.length < 1 || content.length > 1000) {
      return jsonError("Blog ID and content are required", 400);
    }

    await connectDB();

    const blog = await Blog.findOne({ _id: blogId, ...publicPostFilter() }).select("_id");
    if (!blog) return jsonError("Blog not found", 404);

    if (parentId) {
      if (!mongoose.Types.ObjectId.isValid(parentId)) return jsonError("Parent comment not found", 404);
      const parentComment = await Comment.findOne({ _id: parentId, blogId }).select("_id");
      if (!parentComment) return jsonError("Parent comment not found", 404);
    }

    const isApproved = hasPermission(actor.role, "approveComment");
    const comment = await Comment.create({
      blogId,
      userId: actor.id,
      content,
      parentId: parentId || null,
      isApproved,
    });

    if (isApproved) {
      await syncCommentCount(blogId);
    }

    const populatedComment = await Comment.findById(comment._id)
      .populate("userId", "profile.fullName profile.avatar name")
      .lean();

    return NextResponse.json(
      {
        message: isApproved ? "Comment posted successfully" : "Comment submitted for approval",
        comment: populatedComment,
      },
      { status: 201 }
    );
  } catch (error) {
    return serverError("Error creating comment:", error);
  }
}
