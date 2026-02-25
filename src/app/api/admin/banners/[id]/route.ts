import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Banner from "@/models/Banner";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";

// GET /api/admin/banners/[id] - Get single banner
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const banner = await Banner.findById(id)
      .populate("createdBy", "name email profile.fullName")
      .lean();

    if (!banner) {
      return NextResponse.json(
        { error: "Banner not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ banner });
  } catch (error: any) {
    console.error("Error fetching banner:", error);
    return NextResponse.json(
      { error: "Failed to fetch banner", message: error.message },
      { status: 500 }
    );
  }
}

// PUT /api/admin/banners/[id] - Update banner
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
      isActive,
      order,
      type,
      targetAudience,
      startDate,
      endDate,
      metadata,
    } = body;

    // Check if banner exists
    const existingBanner = await Banner.findById(id);
    if (!existingBanner) {
      return NextResponse.json(
        { error: "Banner not found" },
        { status: 404 }
      );
    }

    // Update banner
    const updatedBanner = await Banner.findByIdAndUpdate(
      id,
      {
        ...(title !== undefined && { title }),
        ...(subtitle !== undefined && { subtitle }),
        ...(description !== undefined && { description }),
        ...(image !== undefined && { image }),
        ...(backgroundImage !== undefined && { backgroundImage }),
        ...(ctaText !== undefined && { ctaText }),
        ...(ctaLink !== undefined && { ctaLink }),
        ...(isActive !== undefined && { isActive }),
        ...(order !== undefined && { order }),
        ...(type !== undefined && { type }),
        ...(targetAudience !== undefined && { targetAudience }),
        ...(startDate !== undefined && { startDate: new Date(startDate) }),
        ...(endDate !== undefined && { endDate: new Date(endDate) }),
        ...(metadata !== undefined && { metadata }),
      },
      { new: true, runValidators: true }
    ).populate("createdBy", "name email profile.fullName");

    return NextResponse.json(
      { 
        message: "Banner updated successfully", 
        banner: updatedBanner 
      }
    );
  } catch (error: any) {
    console.error("Error updating banner:", error);
    
    // Handle validation errors
    if (error.name === "ValidationError") {
      return NextResponse.json(
        { error: "Validation failed", details: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update banner", message: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/banners/[id] - Delete banner
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const banner = await Banner.findById(id);
    if (!banner) {
      return NextResponse.json(
        { error: "Banner not found" },
        { status: 404 }
      );
    }

    await Banner.findByIdAndDelete(id);

    return NextResponse.json(
      { message: "Banner deleted successfully" }
    );
  } catch (error: any) {
    console.error("Error deleting banner:", error);
    return NextResponse.json(
      { error: "Failed to delete banner", message: error.message },
      { status: 500 }
    );
  }
}
