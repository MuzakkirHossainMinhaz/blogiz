import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { invalidateSessionUserCache } from "@/lib/cache-invalidation";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import ModerationAction from "@/models/ModerationAction";
import { denied, requirePermission } from "@/lib/authz";
import { jsonError, serverError } from "@/lib/http";
import { boundedSearch, escapeRegex, parsePageLimit } from "@/lib/pagination";
import { canManageRole, hasPermission, isUserRole, type Permission, type UserRole } from "@/lib/permissions";
import { passwordSchema } from "@/lib/validation";

const ACTION_PERMISSION: Record<string, keyof Permission["can"]> = {
  deactivate: "deactivateUser",
  activate: "deactivateUser",
  changeRole: "changeUserRole",
  suspendCommenting: "suspendCommenting",
  unsuspendCommenting: "suspendCommenting",
  resetPassword: "resetUserPassword",
  delete: "deleteUser",
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
    else if (status === "comment_suspended") query.commentSuspended = true;
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
    const actor = await requirePermission("viewUsers", { verified: true });
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
    if (userId === actor.id && (action === "deactivate" || action === "delete")) {
      return jsonError("You cannot perform this action on yourself", 400);
    }
    if (!canManageRole(actor.role, user.role) && action !== "changeRole") {
      // Admins manage authors/readers; changing role has its own checks
      if (action !== "changeRole") {
        return jsonError("Insufficient permissions", 403);
      }
    }
    if (user.role === "admin" && actor.id !== userId && !canManageRole(actor.role, user.role)) {
      return jsonError("Insufficient permissions", 403);
    }

    let message = "";
    let moderationAction:
      | "suspend_user"
      | "unsuspend_user"
      | "suspend_commenting"
      | "unsuspend_commenting"
      | "reset_password"
      | "delete_user"
      | "change_role"
      | null = null;
    const metadata: Record<string, unknown> = {};

    if (action === "deactivate") {
      if (!canManageRole(actor.role, user.role)) return jsonError("Insufficient permissions", 403);
      user.isActive = false;
      user.sessionVersion = (user.sessionVersion ?? 0) + 1;
      message = "User deactivated successfully";
      moderationAction = "suspend_user";
    } else if (action === "activate") {
      if (!canManageRole(actor.role, user.role)) return jsonError("Insufficient permissions", 403);
      user.isActive = true;
      user.sessionVersion = (user.sessionVersion ?? 0) + 1;
      message = "User activated successfully";
      moderationAction = "unsuspend_user";
    } else if (action === "changeRole") {
      const newRole = body?.newRole;
      if (!isUserRole(newRole)) {
        return jsonError("Invalid role", 400);
      }
      if (!canManageRole(actor.role, user.role) || !canManageRole(actor.role, newRole as UserRole)) {
        return jsonError("Insufficient permissions", 403);
      }
      if (user.role === "admin" && newRole !== "admin") {
        const adminCount = await User.countDocuments({ role: "admin", isActive: true });
        if (adminCount <= 1) {
          return jsonError("Cannot demote the last admin", 400);
        }
      }
      metadata.previousRole = user.role;
      metadata.newRole = newRole;
      user.role = newRole as UserRole;
      user.sessionVersion = (user.sessionVersion ?? 0) + 1;
      message = `User role changed to ${newRole} successfully`;
      moderationAction = "change_role";
    } else if (action === "suspendCommenting") {
      if (!canManageRole(actor.role, user.role)) return jsonError("Insufficient permissions", 403);
      user.commentSuspended = true;
      user.commentSuspendedAt = new Date();
      user.commentSuspendedReason =
        typeof body?.reason === "string" ? body.reason.trim().slice(0, 500) : "";
      user.commentSuspendedBy = actor.id as unknown as typeof user.commentSuspendedBy;
      message = "Commenting suspended";
      moderationAction = "suspend_commenting";
    } else if (action === "unsuspendCommenting") {
      if (!canManageRole(actor.role, user.role)) return jsonError("Insufficient permissions", 403);
      user.commentSuspended = false;
      user.commentSuspendedAt = undefined;
      user.commentSuspendedReason = undefined;
      user.commentSuspendedBy = undefined;
      message = "Commenting restored";
      moderationAction = "unsuspend_commenting";
    } else if (action === "resetPassword") {
      if (!canManageRole(actor.role, user.role)) return jsonError("Insufficient permissions", 403);
      const parsed = passwordSchema.safeParse(body?.newPassword);
      if (!parsed.success) return jsonError("Invalid password", 400);
      user.password = await bcrypt.hash(parsed.data, 12);
      user.sessionVersion = (user.sessionVersion ?? 0) + 1;
      user.passwordResetTokenHash = undefined;
      user.passwordResetExpires = undefined;
      message = "Password reset successfully";
      moderationAction = "reset_password";
    } else if (action === "delete") {
      if (!canManageRole(actor.role, user.role)) return jsonError("Insufficient permissions", 403);
      if (user.role === "admin") {
        const adminCount = await User.countDocuments({ role: "admin", isActive: true });
        if (adminCount <= 1) {
          return jsonError("Cannot delete the last admin", 400);
        }
      }
      await ModerationAction.create({
        actorId: actor.id,
        subjectUserId: userId,
        action: "delete_user",
        reason: typeof body?.reason === "string" ? body.reason : undefined,
      });
      await User.findByIdAndDelete(userId);
      await invalidateSessionUserCache(userId);
      return NextResponse.json({ message: "User deleted successfully" });
    }

    await user.save();
    // Bust session snapshot on sessionVersion bumps and comment-suspend toggles.
    await invalidateSessionUserCache(userId);

    if (moderationAction) {
      await ModerationAction.create({
        actorId: actor.id,
        subjectUserId: userId,
        action: moderationAction,
        reason: typeof body?.reason === "string" ? body.reason : undefined,
        metadata: Object.keys(metadata).length ? metadata : undefined,
      });
    }

    const updatedUser = await User.findById(userId).select("-password");
    return NextResponse.json({ message, user: updatedUser });
  } catch (error) {
    return serverError("Error updating user:", error);
  }
}
