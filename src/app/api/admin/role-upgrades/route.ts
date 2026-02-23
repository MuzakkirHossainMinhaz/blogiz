import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import RoleUpgradeRequest from "@/models/RoleUpgradeRequest";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";

// GET /api/admin/role-upgrades - Get all role upgrade requests
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    const skip = (page - 1) * limit;

    // Build query
    const query: any = {};
    if (status && ["pending", "approved", "rejected"].includes(status)) {
      query.status = status;
    }

    const requests = await RoleUpgradeRequest.find(query)
      .populate("userId", "name email profile.fullName profile.avatar role")
      .populate("reviewedBy", "name profile.fullName")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await RoleUpgradeRequest.countDocuments(query);

    return NextResponse.json({
      requests,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("Error fetching role upgrade requests:", error);
    return NextResponse.json(
      { error: "Failed to fetch requests", message: error.message },
      { status: 500 }
    );
  }
}
