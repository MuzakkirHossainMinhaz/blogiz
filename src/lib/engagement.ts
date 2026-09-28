import mongoose, { type ClientSession } from "mongoose";
import Blog from "@/models/Blog";
import Comment from "@/models/Comment";

export function isDuplicateKey(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && (error as { code?: number }).code === 11000;
}

/** Recount approved comments, including replies, and store that number on the blog. */
export async function syncCommentCount(blogId: mongoose.Types.ObjectId | string, session?: ClientSession | null) {
  const count = await Comment.countDocuments({ blogId, isApproved: true }, { session: session ?? undefined });
  await Blog.updateOne({ _id: blogId }, { total_comments: count }, { session: session ?? undefined });
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
