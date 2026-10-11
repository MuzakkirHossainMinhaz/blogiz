import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Comment from "@/models/Comment";
import Blog from "@/models/Blog";
import User from "@/models/User";
import { denied, requirePermission, requireUser } from "@/lib/authz";
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

    const actor = await requireUser();
    const viewer = denied(actor) ? null : actor;
    const canModerateAny = viewer && hasPermission(viewer.role, "deleteAnyComment");

    let canModerateOwn = false;
    if (viewer && hasPermission(viewer.role, "moderateOwnBlogComments")) {
      const blog = await Blog.findById(blogId).select("authorId").lean();
      canModerateOwn = Boolean(blog && blog.authorId.toString() === viewer.id);
    }

    const showHidden = Boolean(canModerateAny || canModerateOwn);
    const visibilityFilter = showHidden ? {} : { isVisible: true };

    const filter = { blogId, parentId: null, ...visibilityFilter };
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
        const replies = await Comment.find({ parentId: comment._id, ...visibilityFilter })
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

    if (actor.commentSuspended) {
      return jsonError("Your commenting privileges are suspended", 403);
    }

    const body = await request.json().catch(() => null);
    const blogId = typeof body?.blogId === "string" ? body.blogId : "";
    const content = typeof body?.content === "string" ? body.content.trim() : "";
    const parentId = typeof body?.parentId === "string" ? body.parentId : "";

    if (!mongoose.Types.ObjectId.isValid(blogId) || content.length < 1 || content.length > 1000) {
      return jsonError("Blog ID and content are required", 400);
    }

    await connectDB();

    const dbUser = await User.findById(actor.id).select("commentSuspended isActive");
    if (!dbUser?.isActive) return jsonError("Account inactive", 403);
    if (dbUser.commentSuspended) return jsonError("Your commenting privileges are suspended", 403);

    const blog = await Blog.findOne({ _id: blogId, ...publicPostFilter() }).select("_id");
    if (!blog) return jsonError("Blog not found", 404);

    if (parentId) {
      if (!mongoose.Types.ObjectId.isValid(parentId)) return jsonError("Parent comment not found", 404);
      const parentComment = await Comment.findOne({ _id: parentId, blogId, isVisible: true }).select(
        "_id parentId"
      );
      if (!parentComment) return jsonError("Parent comment not found", 404);
      if (parentComment.parentId) {
        return jsonError("Replies are limited to one level", 400);
      }
    }

    const comment = await Comment.create({
      blogId,
      userId: actor.id,
      content,
      parentId: parentId || null,
      isVisible: true,
    });

    await syncCommentCount(blogId);

    const populatedComment = await Comment.findById(comment._id)
      .populate("userId", "profile.fullName profile.avatar name")
      .lean();

    return NextResponse.json(
      {
        message: "Comment posted successfully",
        comment: populatedComment,
      },
      { status: 201 }
    );
  } catch (error) {
    return serverError("Error creating comment:", error);
  }
}
