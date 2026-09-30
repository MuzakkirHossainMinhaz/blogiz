import { randomUUID } from "crypto";
import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";
import { assertInsideUploadRoot, sniffImage, UPLOAD_ROOT, UploadError, type SniffedImage } from "@/lib/uploads";
import { cloudinaryPublicId, isStoredImageUrl } from "@/lib/urls";

/** Root Cloudinary folder for every Blogiz upload. */
export const CLOUDINARY_ROOT_FOLDER = "blogiz";

export type StoredImageKind = "avatars" | "banners" | "covers" | "general";

const KIND_SUBFOLDER: Record<StoredImageKind, string> = {
  avatars: `${CLOUDINARY_ROOT_FOLDER}/avatars`,
  banners: `${CLOUDINARY_ROOT_FOLDER}/banners`,
  covers: `${CLOUDINARY_ROOT_FOLDER}/covers`,
  general: CLOUDINARY_ROOT_FOLDER,
};

export function requireCloudinaryConfig(): { cloud_name: string; api_key: string; api_secret: string } {
  const cloud_name = process.env.CLOUDINARY_CLOUD_NAME?.trim() ?? "";
  const api_key = process.env.CLOUDINARY_API_KEY?.trim() ?? "";
  const api_secret = process.env.CLOUDINARY_API_SECRET?.trim() ?? "";
  if (!cloud_name || !api_key || !api_secret) {
    throw new UploadError("CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET are required");
  }
  if (!/^[a-z0-9_-]+$/i.test(cloud_name)) {
    throw new UploadError("CLOUDINARY_CLOUD_NAME is invalid");
  }
  cloudinary.config({ cloud_name, api_key, api_secret, secure: true });
  return { cloud_name, api_key, api_secret };
}

/**
 * Server-side Cloudinary upload into the `blogiz` folder (optional subfolder by kind).
 * The client filename is ignored. Magic bytes choose the format.
 */
export async function saveImage(
  bytes: Buffer,
  options?: { kind?: StoredImageKind }
): Promise<{ url: string; contentType: SniffedImage["mime"] }> {
  const sniffed = sniffImage(bytes);
  if (!sniffed) {
    throw new UploadError("Only JPEG, PNG, and WebP images are allowed");
  }

  const id = randomUUID();
  const filename = `${id}.${sniffed.ext}`;
  assertInsideUploadRoot(UPLOAD_ROOT, filename);
  const { cloud_name } = requireCloudinaryConfig();
  const folder = KIND_SUBFOLDER[options?.kind ?? "general"];

  const uploaded = await new Promise<UploadApiResponse>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: id,
        resource_type: "image",
        format: sniffed.ext,
        unique_filename: false,
        overwrite: false,
        use_filename: false,
      },
      (error, result) => {
        if (error || !result?.secure_url) {
          reject(error instanceof Error ? error : new UploadError("Upload failed"));
          return;
        }
        resolve(result);
      }
    );
    stream.end(bytes);
  });

  if (!isStoredImageUrl(uploaded.secure_url, cloud_name)) {
    throw new UploadError("Upload failed");
  }

  return { url: uploaded.secure_url, contentType: sniffed.mime };
}

/** Deletes a previously stored image. Missing objects are ignored. */
export async function deleteStoredImage(url: string | null | undefined): Promise<void> {
  if (!url?.trim()) return;
  const publicId = cloudinaryPublicId(url);
  if (!publicId) return;

  requireCloudinaryConfig();
  const result = await cloudinary.uploader.destroy(publicId, { resource_type: "image", invalidate: true });
  if (result.result !== "ok" && result.result !== "not found") {
    throw new UploadError("Could not delete the stored image");
  }
}
