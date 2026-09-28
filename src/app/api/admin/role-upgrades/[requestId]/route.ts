import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import RoleUpgradeRequest from "@/models/RoleUpgradeRequest";
import { denied, requirePermission } from "@/lib/authz";
import { serverError } from "@/lib/http";

// PUT /api/admin/role-upgrades/[requestId] - Approve or reject role upgrade request
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    const actor = await requirePermission("changeUserRole", { verified: true });
    if (denied(actor)) return actor;

    await connectDB();
    const { requestId } = await params;

    const upgradeRequest = await RoleUpgradeRequest.findById(requestId);
    if (!upgradeRequest) {
      return NextResponse.json(
        { error: "Role upgrade request not found" },
        { status: 404 }
      );
    }

    if (upgradeRequest.status !== "pending") {
      return NextResponse.json(
        { error: "Request has already been processed" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { action, rejectionReason } = body; // action: "approve" or "reject"

    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action" },
        { status: 400 }
      );
    }

    const adminId = actor.id;

    // Update request
    const updateData: any = {
      status: action === "approve" ? "approved" : "rejected",
      reviewedBy: adminId,
      reviewedAt: new Date(),
    };

    if (action === "reject" && rejectionReason) {
      updateData.rejectionReason = rejectionReason.trim();
    }

    const updatedRequest = await RoleUpgradeRequest.findByIdAndUpdate(
      requestId,
      updateData,
      { returnDocument: "after" }
    ).populate("reviewedBy", "name profile.fullName");

    // If approved, update user role
    if (action === "approve") {
      await User.findByIdAndUpdate(upgradeRequest.userId, {
        role: upgradeRequest.requestedRole,
        isApproved: true,
        $inc: { sessionVersion: 1 },
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
