import path from "path";

export class UploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UploadError";
  }
}

export interface SniffedImage {
  mime: "image/jpeg" | "image/png" | "image/webp";
  ext: "jpg" | "png" | "webp";
}

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export function sniffImage(bytes: Buffer): SniffedImage | null {
  if (bytes.length < 12 || bytes.length > MAX_IMAGE_BYTES) return null;

  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { mime: "image/jpeg", ext: "jpg" };
  }

  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 && bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a) {
    return { mime: "image/png", ext: "png" };
  }

  if (bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP") {
    return { mime: "image/webp", ext: "webp" };
  }

  return null;
}

/**
 * Reject a filename unless the resolved path stays inside `root`.
 * The caller must pass a server-generated name, never the client filename.
 */
export function assertInsideUploadRoot(root: string, filename: string): string {
  if (!filename || filename !== path.basename(filename) || filename.includes("\0") || filename.includes("..")) {
    throw new UploadError("Invalid upload path");
  }

  const rootResolved = path.resolve(root);
  const target = path.resolve(rootResolved, filename);
  const relative = path.relative(rootResolved, target);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new UploadError("Invalid upload path");
  }
  return target;
}

export const UPLOAD_ROOT = path.join(process.cwd(), "var", "uploads");
export { MAX_IMAGE_BYTES };
