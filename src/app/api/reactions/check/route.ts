import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import Blog from "@/models/Blog";
import Reaction from "@/models/Reaction";
import { denied, requireUser } from "@/lib/authz";
import { jsonError, serverError } from "@/lib/http";

export async function GET(request: NextRequest) {
  try {
    const actor = await requireUser();
    if (denied(actor)) return actor;

    const blogId = new URL(request.url).searchParams.get("blogId") || "";
    if (!mongoose.Types.ObjectId.isValid(blogId)) {
      return jsonError("Invalid blog ID", 400);
    }

    await connectDB();
    const [reactionDoc, blog] = await Promise.all([
      Reaction.findOne({ blogId, userId: actor.id }).select("type"),
      Blog.findById(blogId).select("totalLikes totalDislikes"),
    ]);
    const reaction = reactionDoc?.type === "like" || reactionDoc?.type === "dislike" ? reactionDoc.type : null;
    return NextResponse.json({
      reaction,
      totalLikes: blog?.totalLikes ?? 0,
      totalDislikes: blog?.totalDislikes ?? 0,
    });
  } catch (error) {
    return serverError("Error checking reaction:", error);
  }
}
