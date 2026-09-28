import { randomUUID } from "crypto";
import { GridFSBucket, ObjectId } from "mongodb";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { assertInsideUploadRoot, sniffImage, UPLOAD_ROOT, UploadError, type SniffedImage } from "@/lib/uploads";

const BUCKET = "images";
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

/**
 * Images are stored in GridFS and served only from /api/media with an image content type.
 * The filename is generated here. assertInsideUploadRoot still rejects traversal before the write.
 */
export async function saveImage(bytes: Buffer): Promise<{ url: string; contentType: SniffedImage["mime"] }> {
  const sniffed = sniffImage(bytes);
  if (!sniffed) {
    throw new UploadError("Only JPEG, PNG, and WebP images are allowed");
  }

  const filename = `${randomUUID()}.${sniffed.ext}`;
  assertInsideUploadRoot(UPLOAD_ROOT, filename);

  await connectDB();
  const db = mongoose.connection.db;
  if (!db) {
    throw new UploadError("Storage is unavailable");
  }

  const bucket = new GridFSBucket(db, { bucketName: BUCKET });
  const id = new ObjectId();

  await new Promise<void>((resolve, reject) => {
    const stream = bucket.openUploadStreamWithId(id, filename, {
      metadata: { contentType: sniffed.mime },
    });
    stream.on("error", reject);
    stream.on("finish", () => resolve());
    stream.end(bytes);
  });

  return { url: `/api/media/${id.toHexString()}`, contentType: sniffed.mime };
}

export async function openStoredImage(id: string): Promise<{ stream: NodeJS.ReadableStream; contentType: string } | null> {
  if (!/^[a-f0-9]{24}$/i.test(id)) return null;

  await connectDB();
  const db = mongoose.connection.db;
  if (!db) return null;

  const bucket = new GridFSBucket(db, { bucketName: BUCKET });
  const files = await bucket.find({ _id: new ObjectId(id) }).toArray();
  const file = files[0];
  if (!file) return null;

  const contentType = String(file.metadata?.contentType || "");
  if (!ALLOWED_TYPES.has(contentType)) return null;

  return { stream: bucket.openDownloadStream(file._id), contentType };
}
