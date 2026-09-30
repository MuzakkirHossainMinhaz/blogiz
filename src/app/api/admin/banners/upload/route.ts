import { NextRequest, NextResponse } from "next/server";
import { denied, requirePermission } from "@/lib/authz";
import { jsonError, serverError } from "@/lib/http";
import { saveImage } from "@/lib/object-storage";
import { UploadError } from "@/lib/uploads";

export async function POST(request: NextRequest) {
  try {
    const actor = await requirePermission("manageBanners", { verified: true });
    if (denied(actor)) return actor;

    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof Blob)) return jsonError("No file provided", 400);

    const bytes = Buffer.from(await file.arrayBuffer());
    const stored = await saveImage(bytes, { kind: "banners" });

    return NextResponse.json({
      message: "Banner image uploaded successfully",
      url: stored.url,
      size: bytes.length,
      type: stored.contentType,
    });
  } catch (error) {
    if (error instanceof UploadError) return jsonError(error.message, 400);
    return serverError("Error uploading banner image:", error);
  }
}
