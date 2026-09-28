import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import Like from "@/models/Like";
import { jsonError, serverError } from "@/lib/http";
import { parsePageLimit } from "@/lib/pagination";

export async function GET(request: NextRequest, { params }: { params: Promise<{ blogId: string }> }) {
  try {
    const { blogId } = await params;
    if (!mongoose.Types.ObjectId.isValid(blogId)) {
      return jsonError("Invalid blog ID", 400);
    }

    const paging = parsePageLimit(
      new URL(request.url).searchParams.get("page"),
      new URL(request.url).searchParams.get("limit"),
      20
    );
    if ("error" in paging) return jsonError(paging.error, 400);

    await connectDB();

    const [likes, total] = await Promise.all([
      Like.find({ blogId })
        .sort({ createdAt: -1 })
        .skip(paging.skip)
        .limit(paging.limit)
        .select("userId createdAt")
        .lean(),
      Like.countDocuments({ blogId }),
    ]);

    return NextResponse.json({
      likes,
      pagination: {
        page: paging.page,
        limit: paging.limit,
        total,
        pages: Math.ceil(total / paging.limit),
      },
    });
  } catch (error) {
    return serverError("Error fetching likes:", error);
  }
}
