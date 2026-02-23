import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import RoleUpgradeRequest from "@/models/RoleUpgradeRequest";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";

// PUT /api/admin/role-upgrades/[requestId] - Approve or reject role upgrade request
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userRole = (session.user as any).role;
    if (!hasPermission(userRole, "changeUserRole")) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

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

    const adminId = (session.user as any).id;

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
      { new: true }
    ).populate("reviewedBy", "name profile.fullName");

    // If approved, update user role
    if (action === "approve") {
      await User.findByIdAndUpdate(upgradeRequest.userId, {
        role: upgradeRequest.requestedRole,
        isApproved: upgradeRequest.requestedRole === "author" ? true : undefined,
      });
    }

    return NextResponse.json({
      message: `Role upgrade request ${action}d successfully`,
      request: updatedRequest,
    });
  } catch (error: any) {
    console.error("Error processing role upgrade request:", error);
    return NextResponse.json(
      { error: "Failed to process request", message: error.message },
      { status: 500 }
    );
  }
}
