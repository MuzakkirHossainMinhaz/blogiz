import { invalidateBlogCaches } from "@/lib/cache-invalidation";
import { connectDB } from "@/lib/mongodb";
import { denied, requirePermission, requireUser } from "@/lib/authz";
import { jsonError, serverError } from "@/lib/http";
import { boundedSearch, escapeRegex, parsePageLimit } from "@/lib/pagination";
import {
  PUBLIC_AUTHOR_FIELDS,
  PUBLIC_CARD_FIELDS,
  buildBlogListFilter,
  resolveCreateStatus,
} from "@/lib/public-posts";
import { isStoredImageUrl } from "@/lib/urls";
import { blogWriteSchema } from "@/lib/validation";
import Blog from "@/models/Blog";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const paging = parsePageLimit(searchParams.get("page"), searchParams.get("limit"));
    if ("error" in paging) {
      return jsonError(paging.error, 400);
    }

    const actor = await requireUser();
    const viewer = denied(actor) ? null : actor;

    await connectDB();

    const query = buildBlogListFilter(viewer, searchParams.get("scope"), searchParams.get("status"));
    const search = boundedSearch(searchParams.get("search"));
    if (search) {
      const pattern = escapeRegex(search);
      query.$or = [
        { title: { $regex: pattern, $options: "i" } },
        { description: { $regex: pattern, $options: "i" } },
        { authorName: { $regex: pattern, $options: "i" } },
      ];
    }

    const [blogs, total] = await Promise.all([
      Blog.find(query)
        .select(PUBLIC_CARD_FIELDS)
        .populate("authorId", PUBLIC_AUTHOR_FIELDS)
        .sort({ publishedAt: -1, updatedAt: -1 })
        .skip(paging.skip)
        .limit(paging.limit)
        .lean(),
      Blog.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      message: "Blogs fetched successfully",
      blogs,
      pagination: {
        page: paging.page,
        limit: paging.limit,
        total,
        pages: Math.ceil(total / paging.limit),
      },
    });
  } catch (error) {
    return serverError("Error fetching blogs:", error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const actor = await requirePermission("createBlog", { verified: true });
    if (denied(actor)) return actor;

    await connectDB();

    const parsed = blogWriteSchema.safeParse(await request.json());
    if (!parsed.success) {
      return jsonError("Invalid input", 400);
    }

    const { title, description, content, authorName, thumbnail, thumbnailPublicId, thumbnailSource, status, tags } =
      parsed.data;

    if (thumbnail && !isStoredImageUrl(thumbnail)) {
      return jsonError("Image must be an uploaded file", 400);
    }

    const finalStatus = resolveCreateStatus(status);
    const wordCount = content.split(/\s+/).filter(Boolean).length;
    const readingTime = Math.max(1, Math.ceil(wordCount / 200));
    const now = new Date();

    const blog = await Blog.create({
      title,
      description,
      content,
      authorName,
      authorId: actor.id,
      ...(thumbnail ? { thumbnail } : {}),
      ...(thumbnailPublicId ? { thumbnailPublicId } : {}),
      thumbnailSource: thumbnailSource || (thumbnail ? "upload" : "none"),
      status: finalStatus,
      publishedAt: finalStatus === "published" ? now : null,
      tags: tags || [],
      readingTime,
      createdBy: actor.id,
      totalLikes: 0,
      totalDislikes: 0,
      totalComments: 0,
      totalViews: 0,
    });

    if (finalStatus === "published") {
      await invalidateBlogCaches({ blogId: blog._id.toString(), authorId: actor.id });
    } else {
      await invalidateBlogCaches({ authorId: actor.id });
    }

    return NextResponse.json(
      {
        message: finalStatus === "published" ? "Blog published successfully" : "Draft saved successfully",
        blog,
      },
      { status: 201 }
    );
  } catch (error) {
    return serverError("Error creating blog:", error);
  }
}
