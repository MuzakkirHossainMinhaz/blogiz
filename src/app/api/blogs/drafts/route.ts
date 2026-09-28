import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Blog from "@/models/Blog";
import { denied, requireUser } from "@/lib/authz";
import { jsonError, serverError } from "@/lib/http";
import { parsePageLimit } from "@/lib/pagination";

// GET /api/blogs/drafts - Get user's draft blogs (auth required)
export async function GET(request: NextRequest) {
  try {
    const actor = await requireUser();
    if (denied(actor)) return actor;

    await connectDB();

    const { searchParams } = new URL(request.url);
    const paging = parsePageLimit(searchParams.get("page"), searchParams.get("limit"));
    if ("error" in paging) return jsonError(paging.error, 400);

    const blogs = await Blog.find({
      status: "draft",
      createdBy: actor.id,
    })
      .sort({ updatedAt: -1 })
      .skip(paging.skip)
      .limit(paging.limit)
      .lean();

    const total = await Blog.countDocuments({
      status: "draft",
      createdBy: actor.id,
    });

    return NextResponse.json({
      blogs,
      pagination: {
        page: paging.page,
        limit: paging.limit,
        total,
        pages: Math.ceil(total / paging.limit),
      },
    });
  } catch (error) {
    return serverError("Error fetching draft blogs:", error);
  }
}
