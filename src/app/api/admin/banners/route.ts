import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Banner from "@/models/Banner";
import { parseBannerWrite } from "@/lib/banner-input";
import { denied, requirePermission } from "@/lib/authz";
import { jsonError, serverError } from "@/lib/http";
import { parsePageLimit } from "@/lib/pagination";

async function guard() {
  return requirePermission("manageBanners", { verified: true });
}

export async function GET(request: NextRequest) {
  try {
    const actor = await guard();
    if (denied(actor)) return actor;

    const { searchParams } = new URL(request.url);
    const paging = parsePageLimit(searchParams.get("page"), searchParams.get("limit"));
    if ("error" in paging) return jsonError(paging.error, 400);

    await connectDB();

    const query: Record<string, unknown> = {};
    const type = searchParams.get("type") || "";
    const status = searchParams.get("status") || "";
    const audience = searchParams.get("audience") || "";
    if (type) query.type = type;
    if (status === "active") query.isActive = true;
    else if (status === "inactive") query.isActive = false;
    if (audience) query.targetAudience = audience;

    const [banners, total] = await Promise.all([
      Banner.find(query)
        .populate("createdBy", "name profile.fullName")
        .sort({ order: 1, createdAt: -1 })
        .skip(paging.skip)
        .limit(paging.limit)
        .lean(),
      Banner.countDocuments(query),
    ]);

    return NextResponse.json({
      banners,
      pagination: { page: paging.page, limit: paging.limit, total, pages: Math.ceil(total / paging.limit) },
    });
  } catch (error) {
    return serverError("Error fetching banners:", error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const actor = await guard();
    if (denied(actor)) return actor;

    const parsed = parseBannerWrite(await request.json().catch(() => null), { requireImage: true });
    if ("error" in parsed) return jsonError(parsed.error, 400);

    await connectDB();
    const banner = await Banner.create({
      ...parsed,
      startDate: parsed.startDate ? new Date(parsed.startDate) : undefined,
      endDate: parsed.endDate ? new Date(parsed.endDate) : undefined,
      createdBy: actor.id,
    });

    const populatedBanner = await Banner.findById(banner._id).populate("createdBy", "name profile.fullName").lean();
    return NextResponse.json({ message: "Banner created successfully", banner: populatedBanner }, { status: 201 });
  } catch (error) {
    return serverError("Error creating banner:", error);
  }
}
