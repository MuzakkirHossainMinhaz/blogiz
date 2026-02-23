import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Banner from "@/models/Banner";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";

// PUT /api/admin/banners/reorder - Reorder banners for carousel
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
    if (!hasPermission(userRole, "viewDashboard")) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    await connectDB();

    const body = await request.json();
    const { bannerOrders } = body; // Array of { id: string, order: number }

    if (!Array.isArray(bannerOrders)) {
      return NextResponse.json(
        { error: "bannerOrders must be an array" },
        { status: 400 }
      );
    }

    // Validate each item in the array
    for (const item of bannerOrders) {
      if (!item.id || typeof item.order !== "number") {
        return NextResponse.json(
          { error: "Each item must have id and order properties" },
          { status: 400 }
        );
      }
    }

    // Update banner orders in bulk
    const updatePromises = bannerOrders.map(({ id, order }) =>
      Banner.findByIdAndUpdate(id, { order }, { new: true })
    );

    const updatedBanners = await Promise.all(updatePromises);

    return NextResponse.json({
      message: "Banners reordered successfully",
      banners: updatedBanners,
    });
  } catch (error: any) {
    console.error("Error reordering banners:", error);
    return NextResponse.json(
      { error: "Failed to reorder banners", message: error.message },
      { status: 500 }
    );
  }
}
