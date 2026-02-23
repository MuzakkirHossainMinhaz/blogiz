import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Blog from "@/models/Blog";
import { auth } from "@/lib/auth";
import { canPerformAction } from "@/lib/permissions";

// GET /api/users/[userId] - Get user profile (public information)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    await connectDB();
    const { userId } = await params;

    const user = await User.findById(userId)
      .select("name role profile.fullName profile.bio profile.avatar profile.website profile.socialLinks profile.location profile.expertise createdAt isApproved")
      .lean();

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Get user's published blogs count
    const publishedBlogsCount = await Blog.countDocuments({
      authorId: userId,
      status: "published",
      isApproved: true,
    });

    // Get user's recent published blogs
    const recentBlogs = await Blog.find({
      authorId: userId,
      status: "published",
      isApproved: true,
    })
      .select("title description blog_image publish_date total_likes total_comments tags readingTime")
      .sort({ publish_date: -1 })
      .limit(5)
      .lean();

    return NextResponse.json({
      user: {
        ...user,
        stats: {
          publishedBlogsCount,
        },
        recentBlogs,
      },
    });
  } catch (error: any) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch user profile", message: error.message },
      { status: 500 }
    );
  }
}

// PUT /api/users/[userId] - Update user profile
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const currentUserId = (session.user as any).id;
    const currentUserRole = (session.user as any).role;
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
      if (profile.avatar !== undefined) updateData["profile.avatar"] = profile.avatar;
      if (profile.website !== undefined) updateData["profile.website"] = profile.website.trim();
      if (profile.location !== undefined) updateData["profile.location"] = profile.location.trim();
      if (profile.expertise !== undefined) updateData["profile.expertise"] = profile.expertise;
      if (profile.socialLinks !== undefined) updateData["profile.socialLinks"] = profile.socialLinks;
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select("-password");

    return NextResponse.json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error: any) {
    console.error("Error updating user profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile", message: error.message },
      { status: 500 }
    );
  }
}
