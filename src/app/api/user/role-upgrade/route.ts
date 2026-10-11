import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import RoleUpgradeRequest from "@/models/RoleUpgradeRequest";
import { denied, requireUser } from "@/lib/authz";
import { isDuplicateKey } from "@/lib/engagement";
import { jsonError, serverError } from "@/lib/http";

export async function POST(request: NextRequest) {
  try {
    const actor = await requireUser();
    if (denied(actor)) return actor;
    if (!actor.emailVerified) return jsonError("Verify your email before continuing", 403);

    await connectDB();

    const userId = actor.id;
    const body = await request.json().catch(() => null);
    const reason = typeof body?.reason === "string" ? body.reason.trim() : "";

    if (!reason || reason.length > 1000) {
      return jsonError("Reason is required", 400);
    }

    const user = await User.findById(userId);
    if (!user) {
      return jsonError("User not found", 404);
    }

    if (user.role !== "reader") {
      return jsonError("Only readers can request author role", 400);
    }

    const existingRequest = await RoleUpgradeRequest.findOne({
      userId,
      status: "pending",
    });

    if (existingRequest) {
      return jsonError("You already have a pending role upgrade request", 409);
    }

    let upgradeRequest;
    try {
      upgradeRequest = await RoleUpgradeRequest.create({
        userId,
        requestedRole: "author",
        currentRole: "reader",
        reason,
      });
    } catch (error) {
      if (isDuplicateKey(error)) {
        return jsonError("You already have a pending role upgrade request", 409);
      }
      throw error;
    }

    return NextResponse.json({
      message: "Role upgrade request submitted successfully",
      request: upgradeRequest,
    });
  } catch (error) {
    return serverError("Error creating role upgrade request:", error);
  }
}

export async function GET(request: NextRequest) {
  try {
    const actor = await requireUser();
    if (denied(actor)) return actor;

    await connectDB();

    const requests = await RoleUpgradeRequest.find({ userId: actor.id })
      .populate("reviewedBy", "name profile.fullName")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ requests });
  } catch (error) {
    return serverError("Error fetching role upgrade requests:", error);
  }
}
