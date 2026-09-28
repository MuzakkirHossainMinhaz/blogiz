import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getPublicAuthorProfile } from "@/lib/db";
import { denied, requireUser } from "@/lib/authz";
import { jsonError, serverError } from "@/lib/http";
import { canPerformAction } from "@/lib/permissions";
import { isHttpsUrl, isStoredImageUrl } from "@/lib/urls";
import bcrypt from "bcryptjs";
import Blog from "@/models/Blog";
import BlogView from "@/models/BlogView";
import User from "@/models/User";
import Comment from "@/models/Comment";
import Like from "@/models/Like";
import RoleUpgradeRequest from "@/models/RoleUpgradeRequest";

// GET /api/users/[userId] - Get user profile (public information)
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const profile = await getPublicAuthorProfile(userId);
    if (!profile) return jsonError("User not found", 404);

    return NextResponse.json({
      user: {
        _id: profile.id,
        name: profile.name,
        role: profile.role,
        createdAt: profile.createdAt,
        profile: profile.profile,
        stats: {
          publishedBlogsCount: profile.blogs.length,
        },
        recentBlogs: profile.blogs,
      },
    });
  } catch (error) {
    return serverError("Error fetching user profile:", error);
  }
}

// PUT /api/users/[userId] - Update user profile
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const actor = await requireUser();
    if (denied(actor)) return actor;

    const currentUserId = actor.id;
    const currentUserRole = actor.role;
    const { userId } = await params;

    // Check if user can edit this profile
    const canEdit = canPerformAction(
      currentUserRole,
      "editOwnProfile",
      userId,
      currentUserId
    ) || canPerformAction(currentUserRole, "editAnyProfile");

    if (!canEdit) {
      return NextResponse.json(
        { error: "You don't have permission to edit this profile" },
        { status: 403 }
      );
    }

    await connectDB();

    const body = await request.json();
    const {
      name,
      profile,
    } = body;

    // Validate profile data
    if (profile) {
      if (profile.fullName && profile.fullName.trim().length < 2) {
        return NextResponse.json(
          { error: "Full name must be at least 2 characters" },
          { status: 400 }
        );
      }

      if (profile.bio && profile.bio.length > 500) {
        return NextResponse.json(
          { error: "Bio cannot exceed 500 characters" },
          { status: 400 }
        );
      }
    }

    // Update user
    const updateData: any = {};
    if (name) updateData.name = name.trim();
    if (profile) {
      if (profile.fullName !== undefined) updateData["profile.fullName"] = profile.fullName.trim();
      if (profile.bio !== undefined) updateData["profile.bio"] = profile.bio.trim();
      if (profile.avatar !== undefined) {
        if (profile.avatar && !isStoredImageUrl(profile.avatar)) {
          return jsonError("Avatar must be an uploaded image", 400);
        }
        updateData["profile.avatar"] = profile.avatar;
      }
      if (profile.website !== undefined) {
        const website = profile.website.trim();
        if (website && !isHttpsUrl(website)) return jsonError("Website must be an https URL", 400);
        updateData["profile.website"] = website;
      }
      if (profile.location !== undefined) updateData["profile.location"] = profile.location.trim();
      if (profile.expertise !== undefined) updateData["profile.expertise"] = profile.expertise;
      if (profile.socialLinks !== undefined) {
        const links = profile.socialLinks || {};
        for (const key of ["twitter", "linkedin", "github"] as const) {
          const value = typeof links[key] === "string" ? links[key].trim() : "";
          if (value && !isHttpsUrl(value)) return jsonError("Social links must be https URLs", 400);
          links[key] = value;
        }
        updateData["profile.socialLinks"] = links;
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { returnDocument: "after", runValidators: true }
    ).select("-password");

    return NextResponse.json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    return serverError("Error updating user profile:", error);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const actor = await requireUser();
    if (denied(actor)) return actor;

    const { userId } = await params;
    const canDelete =
      canPerformAction(actor.role, "editOwnProfile", userId, actor.id) ||
      canPerformAction(actor.role, "editAnyProfile");
    if (!canDelete || userId !== actor.id) {
      return jsonError("You don't have permission to delete this profile", 403);
    }

    const body = await request.json().catch(() => null);
    const password = typeof body?.password === "string" ? body.password : "";
    if (!password) return jsonError("Invalid input", 400);

    await connectDB();
    const user = await User.findById(userId);
    if (!user) return jsonError("User not found", 404);

    const matches = await bcrypt.compare(password, user.password);
    if (!matches) return jsonError("Invalid input", 400);

    await Promise.all([
      Blog.updateMany({ createdBy: userId }, { status: "draft", isApproved: false }),
      Comment.deleteMany({ userId }),
      Like.deleteMany({ userId }),
      BlogView.deleteMany({ userId }),
      RoleUpgradeRequest.deleteMany({ userId }),
    ]);
    await User.findByIdAndDelete(userId);

    return NextResponse.json({ message: "Account deleted" });
  } catch (error) {
    return serverError("Error deleting account:", error);
  }
}
