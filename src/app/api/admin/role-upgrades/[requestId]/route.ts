import { NextRequest, NextResponse } from "next/server";
import { invalidateSessionUserCache } from "@/lib/cache-invalidation";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import RoleUpgradeRequest from "@/models/RoleUpgradeRequest";
import ModerationAction from "@/models/ModerationAction";
import { denied, requirePermission } from "@/lib/authz";
import { jsonError, serverError } from "@/lib/http";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ requestId: string }> }) {
  try {
    const actor = await requirePermission("reviewRoleUpgrades", { verified: true });
    if (denied(actor)) return actor;

    await connectDB();
    const { requestId } = await params;

    const upgradeRequest = await RoleUpgradeRequest.findById(requestId);
    if (!upgradeRequest) {
      return jsonError("Role upgrade request not found", 404);
    }

    if (upgradeRequest.status !== "pending") {
      return jsonError("Request has already been processed", 400);
    }

    const body = await request.json().catch(() => null);
    const action = body?.action;
    const rejectionReason = typeof body?.rejectionReason === "string" ? body.rejectionReason.trim() : "";

    if (!["approve", "reject"].includes(action)) {
      return jsonError("Invalid action", 400);
    }

    const updateData: Record<string, unknown> = {
      status: action === "approve" ? "approved" : "rejected",
      reviewedBy: actor.id,
      reviewedAt: new Date(),
    };

    if (action === "reject" && rejectionReason) {
      updateData.rejectionReason = rejectionReason.slice(0, 500);
    }

    const updatedRequest = await RoleUpgradeRequest.findByIdAndUpdate(requestId, updateData, {
      returnDocument: "after",
    }).populate("reviewedBy", "name profile.fullName");

    if (action === "approve") {
      await User.findByIdAndUpdate(upgradeRequest.userId, {
        role: "author",
        $inc: { sessionVersion: 1 },
      });
      await invalidateSessionUserCache(upgradeRequest.userId.toString());
      await ModerationAction.create({
        actorId: actor.id,
        subjectUserId: upgradeRequest.userId,
        action: "approve_role_upgrade",
      });
    } else {
      await ModerationAction.create({
        actorId: actor.id,
        subjectUserId: upgradeRequest.userId,
        action: "reject_role_upgrade",
        reason: rejectionReason || undefined,
      });
    }

    return NextResponse.json({
      message: `Role upgrade request ${action}d successfully`,
      request: updatedRequest,
    });
  } catch (error) {
    return serverError("Error processing role upgrade request:", error);
  }
}
