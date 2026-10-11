import mongoose, { type ClientSession } from "mongoose";
import Blog from "@/models/Blog";
import Comment from "@/models/Comment";
import Reaction from "@/models/Reaction";
import { setCachedReaction } from "@/lib/reaction-cache";
import type { ReactionKind } from "@/lib/validation";

export function isDuplicateKey(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && (error as { code?: number }).code === 11000;
}

/** Recount like and dislike rows and store both totals on the blog. */
export async function syncReactionCounts(blogId: mongoose.Types.ObjectId | string, session?: ClientSession | null) {
  const options = { session: session ?? undefined };
  const [totalLikes, totalDislikes] = await Promise.all([
    Reaction.countDocuments({ blogId, type: "like" }, options),
    Reaction.countDocuments({ blogId, type: "dislike" }, options),
  ]);
  await Blog.updateOne({ _id: blogId }, { totalLikes, totalDislikes }, options);
  return { totalLikes, totalDislikes };
}

/**
 * One reaction per user per blog. The same choice removes it. The other choice replaces it.
 * Uses incremental blog counters (not a full recount) and warms Redis for fast reads.
 */
export async function applyBlogReaction(blogId: string, userId: string, reaction: ReactionKind) {
  const existing = await Reaction.findOne({ blogId, userId });
  let saved: ReactionKind | null = null;
  let likesDelta = 0;
  let dislikesDelta = 0;

  if (!existing) {
    try {
      await Reaction.create({ blogId, userId, type: reaction });
      saved = reaction;
      if (reaction === "like") likesDelta = 1;
      else dislikesDelta = 1;
    } catch (error) {
      if (!isDuplicateKey(error)) throw error;
      const raced = await Reaction.findOne({ blogId, userId });
      if (!raced) {
        const counts = await syncReactionCounts(blogId);
        return { reaction: null, ...counts };
      }
      if (raced.type === reaction) {
        await Reaction.deleteOne({ _id: raced._id, type: reaction });
        saved = null;
        if (reaction === "like") likesDelta = -1;
        else dislikesDelta = -1;
      } else {
        await Reaction.updateOne({ _id: raced._id }, { $set: { type: reaction } });
        saved = reaction;
        if (reaction === "like") {
          likesDelta = 1;
          dislikesDelta = -1;
        } else {
          likesDelta = -1;
          dislikesDelta = 1;
        }
      }
    }
  } else if (existing.type === reaction) {
    await Reaction.deleteOne({ _id: existing._id, type: reaction });
    saved = null;
    if (reaction === "like") likesDelta = -1;
    else dislikesDelta = -1;
  } else {
    await Reaction.updateOne({ _id: existing._id }, { $set: { type: reaction } });
    saved = reaction;
    if (reaction === "like") {
      likesDelta = 1;
      dislikesDelta = -1;
    } else {
      likesDelta = -1;
      dislikesDelta = 1;
    }
  }

  const blog = await Blog.findByIdAndUpdate(
    blogId,
    { $inc: { totalLikes: likesDelta, totalDislikes: dislikesDelta } },
    { returnDocument: "after" }
  ).select("totalLikes totalDislikes");

  let totalLikes = Math.max(0, blog?.totalLikes ?? 0);
  let totalDislikes = Math.max(0, blog?.totalDislikes ?? 0);

  if ((blog?.totalLikes ?? 0) < 0 || (blog?.totalDislikes ?? 0) < 0) {
    const repaired = await syncReactionCounts(blogId);
    totalLikes = repaired.totalLikes;
    totalDislikes = repaired.totalDislikes;
  }

  const result = { reaction: saved, totalLikes, totalDislikes };
  void setCachedReaction(blogId, userId, result);
  return result;
}

/** Recount visible comments, including replies, and store that number on the blog. */
export async function syncCommentCount(blogId: mongoose.Types.ObjectId | string, session?: ClientSession | null) {
  const count = await Comment.countDocuments({ blogId, isVisible: true }, { session: session ?? undefined });
  await Blog.updateOne({ _id: blogId }, { totalComments: count }, { session: session ?? undefined });
  return count;
}

export async function withOptionalTransaction<T>(work: (session: ClientSession | null) => Promise<T>): Promise<T> {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const result = await work(session);
    await session.commitTransaction();
    return result;
  } catch (error) {
    try {
      await session.abortTransaction();
    } catch {
      // The deployment may not support transactions.
    }
    const message = error instanceof Error ? error.message : "";
    if (message.includes("Transaction numbers are only allowed") || message.includes("replica set")) {
      return work(null);
    }
    throw error;
  } finally {
    session.endSession();
  }
}
