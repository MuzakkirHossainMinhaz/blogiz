import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";

// GET /api/admin/users - Get all users with pagination and filtering
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
    if (!hasPermission(userRole, "viewUsers")) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const role = searchParams.get("role") || "";
    const status = searchParams.get("status") || ""; // active, inactive, approved, pending

    const skip = (page - 1) * limit;

    // Build query
    const query: any = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { "profile.fullName": { $regex: search, $options: "i" } },
      ];
    }

    if (role) {
      query.role = role;
    }

    if (status) {
      if (status === "active") {
        query.isActive = true;
      } else if (status === "inactive") {
        query.isActive = false;
      } else if (status === "approved") {
        query.isApproved = true;
      } else if (status === "pending") {
        query.isApproved = false;
      }
    }

    // Get users with pagination
    const users = await User.find(query)
      .select("-password") // Exclude password
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count
    const total = await User.countDocuments(query);

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users", message: error.message },
      { status: 500 }
    );
  }
}

// PUT /api/admin/users/[userId]/approve - Approve a user (typically for authors)
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userRole = (session.user as any).role;
    if (!hasPermission(userRole, "approveUser")) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    await connectDB();

    const body = await request.json();
    const { userId, action } = body; // action: "approve", "deactivate", "activate", "changeRole"

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    let updateData: any = {};
    let message = "";

    switch (action) {
      case "approve":
        updateData = { isApproved: true };
        message = "User approved successfully";
        break;
      case "deactivate":
        updateData = { isActive: false };
        message = "User deactivated successfully";
        break;
      case "activate":
        updateData = { isActive: true };
        message = "User activated successfully";
        break;
      case "changeRole":
        const { newRole } = body;
        if (!newRole || !["user", "author", "admin"].includes(newRole)) {
          return NextResponse.json(
            { error: "Invalid role" },
            { status: 400 }
          );
        }
        if (!hasPermission(userRole, "changeUserRole")) {
          return NextResponse.json(
            { error: "Insufficient permissions to change user role" },
            { status: 403 }
          );
        }
        updateData = { role: newRole };
        message = `User role changed to ${newRole} successfully`;
        break;
      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        );
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true }
    ).select("-password");

    return NextResponse.json({
      message,
      user: updatedUser,
    });
  } catch (error: any) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Failed to update user", message: error.message },
      { status: 500 }
    );
  }
}
