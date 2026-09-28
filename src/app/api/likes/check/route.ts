import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
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
    const like = await Like.findOne({ blogId, userId: actor.id }).select("_id");
    return NextResponse.json({ liked: Boolean(like) });
  } catch (error) {
    return serverError("Error checking like status:", error);
  }
}
