import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Banner from "@/models/Banner";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";

// GET /api/admin/banners - Get all banners (admin only)
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
    if (!hasPermission(userRole, "viewDashboard")) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const type = searchParams.get("type") || "";
    const status = searchParams.get("status") || ""; // active, inactive
    const audience = searchParams.get("audience") || "";

    const skip = (page - 1) * limit;

    // Build query
    const query: any = {};

    if (type) {
      query.type = type;
    }

    if (status === "active") {
      query.isActive = true;
    } else if (status === "inactive") {
      query.isActive = false;
    }

    if (audience) {
      query.targetAudience = audience;
    }

    // Get banners with pagination
    const banners = await Banner.find(query)
      .populate("createdBy", "name email profile.fullName")
      .sort({ order: 1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count
    const total = await Banner.countDocuments(query);

    return NextResponse.json({
      banners,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("Error fetching banners:", error);
    return NextResponse.json(
      { error: "Failed to fetch banners", message: error.message },
      { status: 500 }
    );
  }
}

// POST /api/admin/banners - Create new banner (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userRole = (session.user as any).role;
    if (!hasPermission(userRole, "viewDashboard")) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    await connectDB();

    const body = await request.json();
    const {
      title,
      subtitle,
      description,
      image,
      backgroundImage,
      ctaText,
      ctaLink,
      isActive = true,
      order = 0,
      type = "featured",
      targetAudience = "all",
      startDate,
      endDate,
      metadata,
    } = body;

    // Validation
    if (!title) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    if (!image) {
      return NextResponse.json(
        { error: "Banner image is required" },
        { status: 400 }
      );
    }

    // Get user ID
    const userId = (session.user as any).id;

    // Create banner
    const banner = await Banner.create({
      title,
      subtitle,
      description,
      image,
      backgroundImage,
      ctaText,
      ctaLink,
      isActive,
      order,
      type,
      targetAudience,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      createdBy: userId,
      metadata,
    });

    // Populate creator info
    const populatedBanner = await Banner.findById(banner._id)
      .populate("createdBy", "name email profile.fullName")
      .lean();

    return NextResponse.json(
      { 
        message: "Banner created successfully", 
        banner: populatedBanner 
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating banner:", error);
    
    // Handle validation errors
    if (error.name === "ValidationError") {
      return NextResponse.json(
        { error: "Validation failed", details: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create banner", message: error.message },
      { status: 500 }
    );
  }
}
