import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { denied, requirePermission } from "@/lib/authz";
import { jsonError, serverError } from "@/lib/http";
import { boundedSearch, escapeRegex, parsePageLimit } from "@/lib/pagination";
import { canManageRole, hasPermission, isUserRole, type Permission, type UserRole } from "@/lib/permissions";

const ACTION_PERMISSION: Record<string, keyof Permission["can"]> = {
  approve: "approveUser",
  deactivate: "deactivateUser",
  activate: "deactivateUser",
  changeRole: "changeUserRole",
};

export async function GET(request: NextRequest) {
  try {
    const actor = await requirePermission("viewUsers");
    if (denied(actor)) return actor;

    const { searchParams } = new URL(request.url);
    const paging = parsePageLimit(searchParams.get("page"), searchParams.get("limit"));
    if ("error" in paging) return jsonError(paging.error, 400);

    await connectDB();

    const query: Record<string, unknown> = {};
    const search = boundedSearch(searchParams.get("search"));
    if (search) {
      const pattern = escapeRegex(search);
      query.$or = [
        { name: { $regex: pattern, $options: "i" } },
        { email: { $regex: pattern, $options: "i" } },
        { "profile.fullName": { $regex: pattern, $options: "i" } },
      ];
    }

    const role = searchParams.get("role") || "";
    if (role) {
      if (!isUserRole(role)) return jsonError("Invalid role", 400);
      query.role = role;
    }

    const status = searchParams.get("status") || "";
    if (status === "active") query.isActive = true;
    else if (status === "inactive") query.isActive = false;
    else if (status === "approved") query.isApproved = true;
    else if (status === "pending") query.isApproved = false;
    else if (status) return jsonError("Invalid status", 400);

    const [users, total] = await Promise.all([
      User.find(query).select("-password").sort({ createdAt: -1 }).skip(paging.skip).limit(paging.limit).lean(),
      User.countDocuments(query),
    ]);

    return NextResponse.json({
      users,
      pagination: {
        page: paging.page,
        limit: paging.limit,
        total,
        pages: Math.ceil(total / paging.limit),
      },
    });
  } catch (error) {
    return serverError("Error fetching users:", error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const actor = await requirePermission("approveUser", { verified: true });
    if (denied(actor)) return actor;

    const body = await request.json().catch(() => null);
    const userId = typeof body?.userId === "string" ? body.userId : "";
    const action = typeof body?.action === "string" ? body.action : "";
    const permission = ACTION_PERMISSION[action];
    if (!userId || !permission) return jsonError("Invalid action", 400);
    if (!hasPermission(actor.role, permission)) {
      return jsonError("Insufficient permissions", 403);
    }

    await connectDB();
    const user = await User.findById(userId);
    if (!user) return jsonError("User not found", 404);
    if (!canManageRole(actor.role, user.role)) {
      return jsonError("Insufficient permissions", 403);
    }

    let message = "";
    if (action === "approve") {
      user.isApproved = true;
      message = "User approved successfully";
    } else if (action === "deactivate") {
      user.isActive = false;
      user.sessionVersion = (user.sessionVersion ?? 0) + 1;
      message = "User deactivated successfully";
    } else if (action === "activate") {
      user.isActive = true;
      user.sessionVersion = (user.sessionVersion ?? 0) + 1;
      message = "User activated successfully";
    } else if (action === "changeRole") {
      const newRole = body?.newRole;
      if (!isUserRole(newRole) || newRole === "superadmin") {
        return jsonError("Invalid role", 400);
      }
      if (!canManageRole(actor.role, newRole as UserRole)) {
        return jsonError("Insufficient permissions", 403);
      }
      user.role = newRole as UserRole;
      user.sessionVersion = (user.sessionVersion ?? 0) + 1;
      message = `User role changed to ${newRole} successfully`;
    }

    await user.save();
    const updatedUser = await User.findById(userId).select("-password");

    return NextResponse.json({ message, user: updatedUser });
  } catch (error) {
    return serverError("Error updating user:", error);
  }
}
