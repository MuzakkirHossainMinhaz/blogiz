import mongoose, { type ClientSession } from "mongoose";
import Blog from "@/models/Blog";
import Comment from "@/models/Comment";
import Reaction from "@/models/Reaction";
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
 */
export async function applyBlogReaction(blogId: string, userId: string, reaction: ReactionKind) {
  const existing = await Reaction.findOne({ blogId, userId });

  if (!existing) {
    try {
      await Reaction.create({ blogId, userId, type: reaction });
    } catch (error) {
      if (!isDuplicateKey(error)) throw error;
      const raced = await Reaction.findOne({ blogId, userId });
      if (raced && raced.type !== reaction) {
        await Reaction.updateOne({ _id: raced._id }, { $set: { type: reaction } });
      }
    }
  } else if (existing.type === reaction) {
    await Reaction.deleteOne({ _id: existing._id, type: reaction });
  } else {
    await Reaction.updateOne({ _id: existing._id }, { $set: { type: reaction } });
  }

  const counts = await syncReactionCounts(blogId);
  const current = await Reaction.findOne({ blogId, userId }).select("type");
  const saved = current?.type === "like" || current?.type === "dislike" ? current.type : null;
  return { reaction: saved, ...counts };
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
