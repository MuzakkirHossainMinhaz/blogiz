import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Blog from "@/models/Blog";
import { denied, requireUser } from "@/lib/authz";
import { applyBlogReaction } from "@/lib/engagement";
import { jsonError, serverError } from "@/lib/http";
import { publicPostFilter } from "@/lib/public-posts";
import { reactionSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  try {
    const actor = await requireUser();
    if (denied(actor)) return actor;

    const parsed = reactionSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return jsonError("Invalid input", 400);

    await connectDB();

    const blog = await Blog.findOne({ _id: parsed.data.blogId, ...publicPostFilter() }).select("_id");
    if (!blog) return jsonError("Blog not found", 404);

    const result = await applyBlogReaction(parsed.data.blogId, actor.id, parsed.data.reaction);
    return NextResponse.json({
      message: result.reaction ? "Reaction saved" : "Reaction removed",
      ...result,
    });
  } catch (error) {
    return serverError("Error saving reaction:", error);
  }
}
