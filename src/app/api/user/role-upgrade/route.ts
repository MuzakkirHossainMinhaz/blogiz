import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import RoleUpgradeRequest from "@/models/RoleUpgradeRequest";
import { auth } from "@/lib/auth";

// POST /api/user/role-upgrade - Request role upgrade
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    const userId = (session.user as any).id;
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
    const upgradeRequest = await RoleUpgradeRequest.create({
      userId,
      requestedRole,
      currentRole: user.role,
      reason: reason.trim(),
    });

    return NextResponse.json({
      message: "Role upgrade request submitted successfully",
      request: upgradeRequest,
    });
  } catch (error: any) {
    console.error("Error creating role upgrade request:", error);
    return NextResponse.json(
      { error: "Failed to submit request", message: error.message },
      { status: 500 }
    );
  }
}

// GET /api/user/role-upgrade - Get user's role upgrade requests
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    const userId = (session.user as any).id;

    const requests = await RoleUpgradeRequest.find({ userId })
      .populate("reviewedBy", "name profile.fullName")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ requests });
  } catch (error: any) {
    console.error("Error fetching role upgrade requests:", error);
    return NextResponse.json(
      { error: "Failed to fetch requests", message: error.message },
      { status: 500 }
    );
  }
}
