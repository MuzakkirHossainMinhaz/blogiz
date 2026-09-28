import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import RoleUpgradeRequest from "@/models/RoleUpgradeRequest";
import { denied, requirePermission } from "@/lib/authz";
import { jsonError, serverError } from "@/lib/http";
import { parsePageLimit } from "@/lib/pagination";

export async function GET(request: NextRequest) {
  try {
    const actor = await requirePermission("changeUserRole", { verified: true });
    if (denied(actor)) return actor;

    const { searchParams } = new URL(request.url);
    const paging = parsePageLimit(searchParams.get("page"), searchParams.get("limit"));
    if ("error" in paging) return jsonError(paging.error, 400);

    await connectDB();

    const status = searchParams.get("status") || "";
    const query: Record<string, unknown> = {};
    if (status && ["pending", "approved", "rejected"].includes(status)) {
      query.status = status;
    }

    const [requests, total] = await Promise.all([
      RoleUpgradeRequest.find(query)
        .populate("userId", "name email profile.fullName profile.avatar role")
        .populate("reviewedBy", "name profile.fullName")
        .sort({ createdAt: -1 })
        .skip(paging.skip)
        .limit(paging.limit)
        .lean(),
      RoleUpgradeRequest.countDocuments(query),
    ]);

    return NextResponse.json({
      requests,
      pagination: {
        page: paging.page,
        limit: paging.limit,
        total,
        pages: Math.ceil(total / paging.limit),
      },
    });
  } catch (error) {
    return serverError("Error fetching role upgrade requests:", error);
  }
}
