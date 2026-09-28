import { Readable } from "stream";
import { NextRequest, NextResponse } from "next/server";
import { openStoredImage } from "@/lib/object-storage";
import { serverError } from "@/lib/http";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const image = await openStoredImage(id);
    if (!image) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const webStream = Readable.toWeb(image.stream as Readable) as ReadableStream;
    return new NextResponse(webStream, {
      headers: {
        "Content-Type": image.contentType,
        "X-Content-Type-Options": "nosniff",
        "Content-Disposition": "inline",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    return serverError("Error reading media:", error);
  }
}
