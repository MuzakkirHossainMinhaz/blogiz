import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import Blog from "@/models/Blog";
import Like from "@/models/Like";
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
    const [like, blog] = await Promise.all([
      Like.findOne({ blogId, userId: actor.id }).select("type"),
      Blog.findById(blogId).select("total_likes total_dislikes"),
    ]);
    const reaction = like?.type === "like" || like?.type === "dislike" ? like.type : null;
    return NextResponse.json({
      reaction,
      total_likes: blog?.total_likes ?? 0,
      total_dislikes: blog?.total_dislikes ?? 0,
    });
  } catch (error) {
    return serverError("Error checking reaction:", error);
  }
}
