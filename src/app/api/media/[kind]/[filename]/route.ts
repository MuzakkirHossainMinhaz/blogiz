import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { isStoredImageKind } from "@/lib/object-storage";
import { assertInsideUploadRoot, UPLOAD_ROOT, UploadError } from "@/lib/uploads";

const EXT_MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ kind: string; filename: string }> }
) {
  try {
    const { kind, filename } = await params;
    if (!isStoredImageKind(kind)) {
      return new NextResponse("Not found", { status: 404 });
    }

    const ext = filename.split(".").pop()?.toLowerCase() || "";
    const mime = EXT_MIME[ext];
    if (!mime) {
      return new NextResponse("Not found", { status: 404 });
    }

    const kindRoot = path.join(/*turbopackIgnore: true*/ UPLOAD_ROOT, kind);
    const target = assertInsideUploadRoot(kindRoot, filename);
    const bytes = await readFile(target);

    return new NextResponse(bytes, {
      status: 200,
      headers: {
        "Content-Type": mime,
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    if (error instanceof UploadError) {
      return new NextResponse("Not found", { status: 404 });
    }
    const code = (error as NodeJS.ErrnoException)?.code;
    if (code === "ENOENT") {
      return new NextResponse("Not found", { status: 404 });
    }
    return new NextResponse("Not found", { status: 404 });
  }
}
