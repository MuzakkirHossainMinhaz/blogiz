import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import Blog from "@/models/Blog";
import { denied, requireUser } from "@/lib/authz";
import { jsonError, serverError } from "@/lib/http";
import { canPerformAction, hasPermission } from "@/lib/permissions";
import { resolvePublishStatus } from "@/lib/public-posts";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireUser();
    if (denied(actor)) return actor;
    if (!actor.emailVerified) return jsonError("Verify your email before continuing", 403);
    if (actor.role === "author" && !actor.isApproved) {
      return jsonError("Author account is not approved", 403);
    }

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return jsonError("Invalid blog ID", 400);
    }

    await connectDB();

    const existingBlog = await Blog.findById(id);
    if (!existingBlog) return jsonError("Blog not found", 404);

    const canPublish =
      canPerformAction(actor.role, "editOwnBlog", existingBlog.createdBy.toString(), actor.id) ||
      hasPermission(actor.role, "approveBlog");
    if (!canPublish) return jsonError("Forbidden", 403);

    const next = resolvePublishStatus(actor.role);
    const updatedBlog = await Blog.findByIdAndUpdate(
      id,
      {
        status: next.status,
        isApproved: next.isApproved,
        publish_date: new Date(),
        ...(next.isApproved ? { approvedBy: actor.id, approvedAt: new Date(), rejectionReason: "" } : { isApproved: false }),
      },
      { returnDocument: "after" }
    );

    return NextResponse.json({
      message: next.message,
      blog: updatedBlog,
    });
  } catch (error) {
    return serverError("Error publishing blog:", error);
  }
}
