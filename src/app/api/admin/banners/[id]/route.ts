import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import Banner from "@/models/Banner";
import { parseBannerWrite } from "@/lib/banner-input";
import { denied, requirePermission } from "@/lib/authz";
import { jsonError, serverError } from "@/lib/http";
import { deleteStoredImage } from "@/lib/object-storage";
import { UploadError } from "@/lib/uploads";

async function guard() {
  return requirePermission("manageBanners", { verified: true });
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await guard();
    if (denied(actor)) return actor;

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) return jsonError("Banner not found", 404);

    await connectDB();
    const banner = await Banner.findById(id).populate("createdBy", "name profile.fullName").lean();
    if (!banner) return jsonError("Banner not found", 404);
    return NextResponse.json({ banner });
  } catch (error) {
    return serverError("Error fetching banner:", error);
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await guard();
    if (denied(actor)) return actor;

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) return jsonError("Banner not found", 404);

    const parsed = parseBannerWrite(await request.json().catch(() => null), { requireImage: false });
    if ("error" in parsed) return jsonError(parsed.error, 400);

    await connectDB();
    const existingBanner = await Banner.findById(id);
    if (!existingBanner) return jsonError("Banner not found", 404);

    if (parsed.image && existingBanner.image !== parsed.image) {
      await deleteStoredImage(existingBanner.image);
    }
    if (parsed.backgroundImage !== undefined && existingBanner.backgroundImage !== parsed.backgroundImage) {
      await deleteStoredImage(existingBanner.backgroundImage);
    }

    const updatedBanner = await Banner.findByIdAndUpdate(
      id,
      {
        ...parsed,
        ...(parsed.startDate !== undefined && { startDate: new Date(parsed.startDate) }),
        ...(parsed.endDate !== undefined && { endDate: new Date(parsed.endDate) }),
      },
      { returnDocument: "after", runValidators: true }
    ).populate("createdBy", "name profile.fullName");

    return NextResponse.json({ message: "Banner updated successfully", banner: updatedBanner });
  } catch (error) {
    if (error instanceof UploadError) return jsonError(error.message, 400);
    return serverError("Error updating banner:", error);
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await guard();
    if (denied(actor)) return actor;

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) return jsonError("Banner not found", 404);

    await connectDB();
    const banner = await Banner.findById(id);
    if (!banner) return jsonError("Banner not found", 404);
    await deleteStoredImage(banner.image);
    await deleteStoredImage(banner.backgroundImage);
    await Banner.findByIdAndDelete(id);
    return NextResponse.json({ message: "Banner deleted successfully" });
  } catch (error) {
    if (error instanceof UploadError) return jsonError(error.message, 400);
    return serverError("Error deleting banner:", error);
  }
}
