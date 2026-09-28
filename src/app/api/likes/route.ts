import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import Blog from "@/models/Blog";
import Like from "@/models/Like";
import { denied, requireUser } from "@/lib/authz";
import { isDuplicateKey } from "@/lib/engagement";
import { jsonError, serverError } from "@/lib/http";
import { publicPostFilter } from "@/lib/public-posts";

export async function POST(request: NextRequest) {
  try {
    const actor = await requireUser();
    if (denied(actor)) return actor;

    const body = await request.json().catch(() => null);
    const blogId = typeof body?.blogId === "string" ? body.blogId : "";
    if (!mongoose.Types.ObjectId.isValid(blogId)) {
      return jsonError("Invalid blog ID", 400);
    }

    await connectDB();

    const blog = await Blog.findOne({ _id: blogId, ...publicPostFilter() }).select("_id");
    if (!blog) return jsonError("Blog not found", 404);

    const removed = await Like.findOneAndDelete({ blogId, userId: actor.id });
    if (removed) {
      const updated = await Blog.findOneAndUpdate(
        { _id: blogId, total_likes: { $gt: 0 } },
        { $inc: { total_likes: -1 } },
        { returnDocument: "after" }
      );
      const total = updated?.total_likes ?? 0;
      return NextResponse.json({ message: "Blog unliked successfully", liked: false, total_likes: total, count: total });
    }

    try {
      await Like.create({ blogId, userId: actor.id });
    } catch (error) {
      if (!isDuplicateKey(error)) throw error;
      const current = await Blog.findById(blogId).select("total_likes");
      const total = current?.total_likes ?? 0;
      return NextResponse.json({ message: "Blog liked successfully", liked: true, total_likes: total, count: total });
    }

    const updated = await Blog.findByIdAndUpdate(blogId, { $inc: { total_likes: 1 } }, { returnDocument: "after" });
    const total = updated?.total_likes ?? 0;
    return NextResponse.json({ message: "Blog liked successfully", liked: true, total_likes: total, count: total });
  } catch (error) {
    return serverError("Error toggling like:", error);
  }
}
