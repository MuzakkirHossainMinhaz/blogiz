import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { assertInsideUploadRoot, sniffImage, UPLOAD_ROOT, UploadError, type SniffedImage } from "@/lib/uploads";
import { isLocalMediaUrl, isPollinationsImageUrl, localMediaRelativePath, isStoredImageUrl } from "@/lib/urls";

export type StoredImageKind = "avatars" | "banners" | "covers" | "general";

const KINDS = new Set<StoredImageKind>(["avatars", "banners", "covers", "general"]);

export function isStoredImageKind(value: string): value is StoredImageKind {
  return KINDS.has(value as StoredImageKind);
}

/**
 * Persist image bytes under `var/uploads/{kind}/` and return a same-origin
 * `/api/media/{kind}/{filename}` URL for the database.
 */
export async function saveImage(
  bytes: Buffer,
  options?: { kind?: StoredImageKind }
): Promise<{ url: string; contentType: SniffedImage["mime"] }> {
  const sniffed = sniffImage(bytes);
  if (!sniffed) {
    throw new UploadError("Only JPEG, PNG, and WebP images are allowed");
  }

  const kind = options?.kind ?? "general";
  if (!isStoredImageKind(kind)) {
    throw new UploadError("Invalid upload kind");
  }

  const id = randomUUID();
  const filename = `${id}.${sniffed.ext}`;
  const kindRoot = path.join(/*turbopackIgnore: true*/ UPLOAD_ROOT, kind);
  const target = assertInsideUploadRoot(kindRoot, filename);

  await mkdir(kindRoot, { recursive: true });
  await writeFile(target, bytes);

  const url = `/api/media/${kind}/${filename}`;
  if (!isStoredImageUrl(url)) {
    throw new UploadError("Upload failed");
  }

  return { url, contentType: sniffed.mime };
}

/**
 * Delete a previously stored local upload. Pollinations (and other external)
 * URLs are ignored — nothing to clean up on this server.
 */
export async function deleteStoredImage(url: string | null | undefined): Promise<void> {
  if (!url?.trim()) return;
  if (isPollinationsImageUrl(url) || !isLocalMediaUrl(url)) return;

  const relative = localMediaRelativePath(url);
  if (!relative) return;

  const [kind, filename] = relative.split("/");
  if (!kind || !filename || !isStoredImageKind(kind)) return;

  const kindRoot = path.join(/*turbopackIgnore: true*/ UPLOAD_ROOT, kind);
  let target: string;
  try {
    target = assertInsideUploadRoot(kindRoot, filename);
  } catch {
    return;
  }

  try {
    await unlink(target);
  } catch (error) {
    const code = (error as NodeJS.ErrnoException)?.code;
    if (code === "ENOENT") return;
    throw new UploadError("Could not delete the stored image");
  }
}
