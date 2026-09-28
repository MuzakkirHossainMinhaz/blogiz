import { NextRequest } from "next/server";
import { denied, requireUser } from "@/lib/authz";
import { jsonError, serverError } from "@/lib/http";
import { saveImage } from "@/lib/object-storage";
import { UploadError } from "@/lib/uploads";
import { NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const actor = await requireUser();
    if (denied(actor)) return actor;
    if (!actor.emailVerified) return jsonError("Verify your email before continuing", 403);

    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof Blob)) {
      return jsonError("No file provided", 400);
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const stored = await saveImage(bytes);

    return NextResponse.json({
      message: "File uploaded successfully",
      url: stored.url,
    });
  } catch (error) {
    if (error instanceof UploadError) {
      return jsonError(error.message, 400);
    }
    return serverError("Error uploading file:", error);
  }
}
