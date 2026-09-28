import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import RoleUpgradeRequest from "@/models/RoleUpgradeRequest";
import { denied, requireUser } from "@/lib/authz";
import { isDuplicateKey } from "@/lib/engagement";
import { jsonError, serverError } from "@/lib/http";

// POST /api/user/role-upgrade - Request role upgrade
export async function POST(request: NextRequest) {
  try {
    const actor = await requireUser();
    if (denied(actor)) return actor;
    if (!actor.emailVerified) return jsonError("Verify your email before continuing", 403);

    await connectDB();

    const userId = actor.id;
    const body = await request.json();
    const { requestedRole, reason } = body;

    if (!requestedRole || !reason) {
      return NextResponse.json(
        { error: "Requested role and reason are required" },
        { status: 400 }
      );
    }

    if (!["author", "admin"].includes(requestedRole)) {
      return NextResponse.json(
        { error: "Invalid requested role" },
        { status: 400 }
      );
    }

    // Get current user
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Validate role upgrade path
    if (requestedRole === "author" && user.role !== "user") {
      return NextResponse.json(
        { error: "Only users can request author role" },
        { status: 400 }
      );
    }

    if (requestedRole === "admin" && user.role !== "author") {
      return NextResponse.json(
        { error: "Only authors can request admin role" },
        { status: 400 }
      );
    }

    // The guards above leave only user→author and author→admin. Mongoose's
    // create() input is narrower than User.role, so record that pair explicitly.
    const currentRole: "user" | "author" = requestedRole === "author" ? "user" : "author";

    // Check if there's already a pending request
    const existingRequest = await RoleUpgradeRequest.findOne({
      userId,
      status: "pending",
    });

    if (existingRequest) {
      return NextResponse.json(
        { error: "You already have a pending role upgrade request" },
        { status: 409 }
      );
    }

    // Create role upgrade request
    let upgradeRequest;
    try {
      upgradeRequest = await RoleUpgradeRequest.create({
        userId,
        requestedRole,
        currentRole,
        reason: reason.trim(),
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

// GET /api/user/role-upgrade - Get user's role upgrade requests
export async function GET(request: NextRequest) {
  try {
    const actor = await requireUser();
    if (denied(actor)) return actor;

    await connectDB();

    const userId = actor.id;

    const requests = await RoleUpgradeRequest.find({ userId })
      .populate("reviewedBy", "name profile.fullName")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ requests });
  } catch (error) {
    return serverError("Error fetching role upgrade requests:", error);
  }
}
