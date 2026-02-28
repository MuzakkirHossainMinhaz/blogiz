import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

// POST /api/seed - Create superadmin user (one-time setup)
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { email, password } = await request.json();

    // Check if superadmin already exists
    const existingSuperAdmin = await User.findOne({
      role: "superadmin",
    });

    if (existingSuperAdmin) {
      return NextResponse.json({ success: true, message: "Superadmin user already exists" }, { status: 200 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create superadmin user
    const superadmin = await User.create({
      email: process.env.ADMIN_EMAIL || "superadmin@blogiz.com",
      password: hashedPassword,
      name: "Super Admin",
      role: "superadmin",
      profile: {
        fullName: "Super Administrator",
        bio: "System administrator with full access to all features and settings.",
      },
      isApproved: true,
      emailVerified: true,
    });

    console.log("✅ Superadmin user created successfully");
    console.log("Email:", process.env.ADMIN_EMAIL || "superadmin@blogiz.com");
    console.log("Password:", process.env.ADMIN_PASSWORD || "superadmin123");

    return NextResponse.json(
      {
        success: true,
        message: "Superadmin user created successfully",
        user: {
          email: superadmin.email,
          name: superadmin.name,
          role: superadmin.role,
          profile: superadmin.profile,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error seeding database:", error);
    return NextResponse.json(
      { success: false, message: error.message, error: "Failed to seed database" },
      { status: 500 }
    );
  }
}

// GET /api/seed - Check if superadmin exists and get user stats
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const superadminExists = await User.exists({ role: "superadmin" });
    const adminCount = await User.countDocuments({ role: "admin" });
    const authorCount = await User.countDocuments({ role: "author" });
    const userCount = await User.countDocuments({ role: "user" });
    const pendingAuthors = await User.countDocuments({
      role: "author",
      isApproved: false,
    });

    return NextResponse.json({
      superadminExists: !!superadminExists,
      message: superadminExists
        ? "Superadmin user exists"
        : "Superadmin user not found. POST to this endpoint to create.",
      stats: {
        totalUsers: userCount + authorCount + adminCount,
        superadmin: superadminExists ? 1 : 0,
        admins: adminCount,
        authors: authorCount,
        users: userCount,
        pendingAuthors,
      },
    });
  } catch (error: any) {
    console.error("Error checking seed status:", error);
    return NextResponse.json(
      { success: false, message: error.message, error: "Failed to check seed status" },
      { status: 500 }
    );
  }
}
