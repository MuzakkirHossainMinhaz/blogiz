import { NextRequest, NextResponse } from "next/server";
import { denied, requireUser } from "@/lib/authz";
import { jsonError, serverError } from "@/lib/http";
import { saveImage, type StoredImageKind } from "@/lib/object-storage";
import { UploadError } from "@/lib/uploads";

const KINDS = new Set<StoredImageKind>(["avatars", "banners", "covers", "general"]);

function parseKind(value: FormDataEntryValue | null): StoredImageKind {
  if (typeof value === "string" && KINDS.has(value as StoredImageKind)) {
    return value as StoredImageKind;
  }
  return "covers";
}

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

    const kind = parseKind(formData.get("kind"));
    const bytes = Buffer.from(await file.arrayBuffer());
    const stored = await saveImage(bytes, { kind });

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
