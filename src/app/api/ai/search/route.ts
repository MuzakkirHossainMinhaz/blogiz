import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Blog from "@/models/Blog";
import { denied } from "@/lib/authz";
import { requireAiUser } from "@/lib/ai-guard";
import { jsonError, serverError } from "@/lib/http";
import { boundedSearch, escapeRegex, parsePageLimit } from "@/lib/pagination";
import { PUBLIC_AUTHOR_FIELDS, PUBLIC_CARD_FIELDS, publicPostFilter } from "@/lib/public-posts";

const CANDIDATE_CAP = 50;

export async function POST(request: NextRequest) {
  try {
    const actor = await requireAiUser();
    if (denied(actor)) return actor;

    const body = await request.json().catch(() => null);
    const queryText = boundedSearch(typeof body?.query === "string" ? body.query : "", 200);
    if (!queryText) return jsonError("Search query is required", 400);

    const paging = parsePageLimit(null, String(body?.limit ?? ""));
    if ("error" in paging) return jsonError(paging.error, 400);

    await connectDB();

    const pattern = escapeRegex(queryText);
    const filter = publicPostFilter({
      $or: [
        { title: { $regex: pattern, $options: "i" } },
        { description: { $regex: pattern, $options: "i" } },
        { tags: { $regex: pattern, $options: "i" } },
      ],
    });

    const blogs = await Blog.find(filter)
      .select(PUBLIC_CARD_FIELDS)
      .populate("authorId", PUBLIC_AUTHOR_FIELDS)
      .sort({ publish_date: -1 })
      .limit(Math.min(paging.limit, CANDIDATE_CAP))
      .lean();

    return NextResponse.json({
      blogs,
      query: queryText,
      totalFound: blogs.length,
      semantic: false,
    });
  } catch (error) {
    return serverError("AI search failed:", error);
  }
}

export async function GET(request: NextRequest) {
  try {
    const actor = await requireAiUser();
    if (denied(actor)) return actor;

    const { searchParams } = new URL(request.url);
    const paging = parsePageLimit(null, searchParams.get("limit") || "5");
    if ("error" in paging) return jsonError(paging.error, 400);

    await connectDB();
    const recommendations = await Blog.find(publicPostFilter())
      .select(PUBLIC_CARD_FIELDS)
      .populate("authorId", PUBLIC_AUTHOR_FIELDS)
      .sort({ total_likes: -1, publish_date: -1 })
      .limit(paging.limit)
      .lean();

    return NextResponse.json({
      recommendations,
      type: searchParams.get("type") || "trending",
      count: recommendations.length,
    });
  } catch (error) {
    return serverError("Recommendations failed:", error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const actor = await requireAiUser();
    if (denied(actor)) return actor;

    const body = await request.json().catch(() => null);
    const blogId = typeof body?.blogId === "string" ? body.blogId : "";
    if (!blogId) return jsonError("Blog ID is required", 400);

    const paging = parsePageLimit(null, String(body?.limit ?? 5));
    if ("error" in paging) return jsonError(paging.error, 400);

    await connectDB();
    const source = await Blog.findOne({ _id: blogId, ...publicPostFilter() }).select("tags");
    if (!source) return jsonError("Blog not found", 404);

    const similarBlogs = await Blog.find(
      publicPostFilter({
        _id: { $ne: blogId },
        ...(source.tags?.length ? { tags: { $in: source.tags } } : {}),
      })
    )
      .select(PUBLIC_CARD_FIELDS)
      .populate("authorId", PUBLIC_AUTHOR_FIELDS)
      .sort({ publish_date: -1 })
      .limit(paging.limit)
      .lean();

    return NextResponse.json({ similarBlogs, sourceBlogId: blogId, count: similarBlogs.length });
  } catch (error) {
    return serverError("Similar content search failed:", error);
  }
}
