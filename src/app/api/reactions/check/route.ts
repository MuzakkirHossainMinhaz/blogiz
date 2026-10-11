import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import Blog from "@/models/Blog";
import Reaction from "@/models/Reaction";
import { denied, requireUser } from "@/lib/authz";
import { getCachedReaction, setCachedReaction } from "@/lib/reaction-cache";
import { jsonError, serverError } from "@/lib/http";

export async function GET(request: NextRequest) {
  try {
    const actor = await requireUser();
    if (denied(actor)) return actor;

    const blogId = new URL(request.url).searchParams.get("blogId") || "";
    if (!mongoose.Types.ObjectId.isValid(blogId)) {
      return jsonError("Invalid blog ID", 400);
    }

    const cached = await getCachedReaction(blogId, actor.id);
    if (cached) {
      return NextResponse.json(cached);
    }

    await connectDB();
    const [reactionDoc, blog] = await Promise.all([
      Reaction.findOne({ blogId, userId: actor.id }).select("type"),
      Blog.findById(blogId).select("totalLikes totalDislikes"),
    ]);
    const reaction = reactionDoc?.type === "like" || reactionDoc?.type === "dislike" ? reactionDoc.type : null;
    const state = {
      reaction,
      totalLikes: blog?.totalLikes ?? 0,
      totalDislikes: blog?.totalDislikes ?? 0,
    };
    void setCachedReaction(blogId, actor.id, state);
    return NextResponse.json(state);
  } catch (error) {
    return serverError("Error checking reaction:", error);
  }
}
