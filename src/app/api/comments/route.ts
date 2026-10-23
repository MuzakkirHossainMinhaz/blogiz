import { NextRequest, NextResponse } from "next/server";
import { commentsCacheKey, invalidateCommentCaches } from "@/lib/cache-invalidation";
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
import { cacheGetJson, cacheSetJson, defaultCacheTtlSeconds } from "@/lib/redis-cache";
import mongoose from "mongoose";

type CommentsPayload = {
  comments: unknown[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
};

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

    // Never cache moderator / showHidden views — visibility differs by actor.
    const publicCacheKey = !showHidden ? commentsCacheKey(blogId, paging.page, paging.limit) : null;
    if (publicCacheKey) {
      const cached = await cacheGetJson<CommentsPayload>(publicCacheKey);
      if (cached) return NextResponse.json(cached);
    }

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

    const parentIds = comments.map((comment) => comment._id);
    const replies =
      parentIds.length === 0
        ? []
        : await Comment.find({ parentId: { $in: parentIds }, ...visibilityFilter })
            .populate("userId", "profile.fullName profile.avatar name")
            .sort({ createdAt: 1 })
            .lean();

    const repliesByParent = new Map<string, typeof replies>();
    for (const reply of replies) {
      const parentKey = String(reply.parentId);
      const list = repliesByParent.get(parentKey) ?? [];
      list.push(reply);
      repliesByParent.set(parentKey, list);
    }

    const commentsWithReplies = comments.map((comment) => ({
      ...comment,
      replies: repliesByParent.get(String(comment._id)) ?? [],
    }));

    const payload: CommentsPayload = {
      comments: commentsWithReplies,
      pagination: {
        page: paging.page,
        limit: paging.limit,
        total,
        pages: Math.ceil(total / paging.limit),
      },
    };

    if (publicCacheKey) {
      await cacheSetJson(publicCacheKey, payload, defaultCacheTtlSeconds());
    }

    return NextResponse.json(payload);
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

    const blog = await Blog.findOne({ _id: blogId, ...publicPostFilter() }).select("_id authorId");
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
    await invalidateCommentCaches(blogId, blog.authorId.toString());

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
