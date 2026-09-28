import { huggingFaceAI } from "@/lib/huggingface";
import { huggingFaceConfigured } from "@/lib/ai-provider";
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
        { author_name: { $regex: pattern, $options: "i" } },
      ];
    }

    const [blogs, total] = await Promise.all([
      Blog.find(query)
        .select(PUBLIC_CARD_FIELDS)
        .populate("authorId", PUBLIC_AUTHOR_FIELDS)
        .sort({ publish_date: -1, updatedAt: -1 })
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

    const { title, description, content, author_name, blog_image, status, publish_date, tags, enableAI } = parsed.data;

    if (blog_image && !isStoredImageUrl(blog_image)) {
      return jsonError("Image must be an uploaded file", 400);
    }

    const finalStatus = resolveCreateStatus(actor.role, status);
    const wordCount = content.split(/\s+/).filter(Boolean).length;
    const readingTime = Math.max(1, Math.ceil(wordCount / 200));

    let aiAnalysis: Record<string, unknown> | undefined;
    if (enableAI && huggingFaceConfigured()) {
      try {
        const finalTags = tags?.length ? tags : await huggingFaceAI.generateTags(content);
        const seo = await huggingFaceAI.generateSEOMetadata(title, content);
        const summary = await huggingFaceAI.generateBlogSummary(content);
        const sentiment = await huggingFaceAI.analyzeSentiment(content);
        if (!finalTags.length && !summary) {
          return jsonError("Writing assistant is unavailable", 502);
        }
        aiAnalysis = { tags: finalTags, seo, summary, sentiment, readingTime, wordCount };
      } catch (error) {
        console.error("AI analysis failed:", error);
        return jsonError("Writing assistant is unavailable", 502);
      }
    }

    const blog = await Blog.create({
      title,
      description,
      content,
      author_name,
      authorId: actor.id,
      ...(blog_image ? { blog_image } : {}),
      status: finalStatus.status,
      isApproved: finalStatus.isApproved,
      ...(finalStatus.isApproved ? { approvedBy: actor.id, approvedAt: new Date() } : {}),
      publish_date: publish_date ? new Date(publish_date) : new Date(),
      tags: (aiAnalysis?.tags as string[] | undefined) || tags || [],
      readingTime,
      createdBy: actor.id,
      total_likes: 0,
      total_comments: 0,
      total_views: 0,
    });

    return NextResponse.json(
      {
        message: finalStatus.status === "pending" ? "Blog submitted for approval" : "Blog created successfully",
        blog,
        ...(aiAnalysis ? { aiAnalysis } : {}),
      },
      { status: 201 }
    );
  } catch (error) {
    return serverError("Error creating blog:", error);
  }
}
