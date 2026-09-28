import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import Banner from "@/models/Banner";
import { denied, requirePermission } from "@/lib/authz";
import { jsonError, serverError } from "@/lib/http";

export async function PUT(request: NextRequest) {
  try {
    const actor = await requirePermission("manageBanners", { verified: true });
    if (denied(actor)) return actor;

    const body = await request.json().catch(() => null);
    const bannerOrders = body?.bannerOrders;
    if (!Array.isArray(bannerOrders) || bannerOrders.length > 100) {
      return jsonError("bannerOrders must be an array", 400);
    }

    for (const item of bannerOrders) {
      if (!item || typeof item.id !== "string" || !mongoose.Types.ObjectId.isValid(item.id) || typeof item.order !== "number") {
        return jsonError("Each item must have id and order properties", 400);
      }
    }

    await connectDB();
    const updatedBanners = await Promise.all(
      bannerOrders.map(({ id, order }: { id: string; order: number }) => Banner.findByIdAndUpdate(id, { order }, { returnDocument: "after" }))
    );

    return NextResponse.json({ message: "Banners reordered successfully", banners: updatedBanners });
  } catch (error) {
    return serverError("Error reordering banners:", error);
  }
}
