import { isSafeNavigationUrl, isStoredImageUrl } from "@/lib/urls";

const TYPES = ["hero", "featured", "announcement", "promotion"] as const;
const AUDIENCES = ["all", "users", "authors", "admins"] as const;

export interface BannerWrite {
  title?: string;
  subtitle?: string;
  description?: string;
  image?: string;
  backgroundImage?: string;
  ctaText?: string;
  ctaLink?: string;
  isActive?: boolean;
  order?: number;
  type?: (typeof TYPES)[number];
  targetAudience?: (typeof AUDIENCES)[number];
  startDate?: string;
  endDate?: string;
  metadata?: Record<string, unknown>;
}

export function parseBannerWrite(body: unknown, { requireImage }: { requireImage: boolean }): BannerWrite | { error: string } {
  if (!body || typeof body !== "object") return { error: "Invalid input" };
  const input = body as Record<string, unknown>;
  const result: BannerWrite = {};

  if (input.title !== undefined) {
    if (typeof input.title !== "string" || !input.title.trim() || input.title.trim().length > 100) {
      return { error: "Title is required" };
    }
    result.title = input.title.trim();
  } else if (requireImage) {
    return { error: "Title is required" };
  }

  if (typeof input.subtitle === "string") result.subtitle = input.subtitle.trim().slice(0, 150);
  if (typeof input.description === "string") result.description = input.description.trim().slice(0, 500);
  if (typeof input.ctaText === "string") result.ctaText = input.ctaText.trim().slice(0, 50);

  if (input.image !== undefined) {
    if (typeof input.image !== "string" || !isStoredImageUrl(input.image)) {
      return { error: "Banner image is required" };
    }
    result.image = input.image.trim();
  } else if (requireImage) {
    return { error: "Banner image is required" };
  }

  if (input.backgroundImage !== undefined && input.backgroundImage !== "") {
    if (typeof input.backgroundImage !== "string" || !isStoredImageUrl(input.backgroundImage)) {
      return { error: "Invalid background image" };
    }
    result.backgroundImage = input.backgroundImage.trim();
  }

  if (input.ctaLink !== undefined && input.ctaLink !== "") {
    if (typeof input.ctaLink !== "string" || !isSafeNavigationUrl(input.ctaLink)) {
      return { error: "Invalid link" };
    }
    result.ctaLink = input.ctaLink.trim();
  }

  if (input.isActive !== undefined) {
    if (typeof input.isActive !== "boolean") return { error: "Invalid input" };
    result.isActive = input.isActive;
  }
  if (input.order !== undefined) {
    if (typeof input.order !== "number" || !Number.isFinite(input.order)) return { error: "Invalid input" };
    result.order = input.order;
  }
  if (input.type !== undefined) {
    if (typeof input.type !== "string" || !(TYPES as readonly string[]).includes(input.type)) {
      return { error: "Invalid input" };
    }
    result.type = input.type as BannerWrite["type"];
  }
  if (input.targetAudience !== undefined) {
    if (typeof input.targetAudience !== "string" || !(AUDIENCES as readonly string[]).includes(input.targetAudience)) {
      return { error: "Invalid input" };
    }
    result.targetAudience = input.targetAudience as BannerWrite["targetAudience"];
  }
  if (typeof input.startDate === "string") result.startDate = input.startDate;
  if (typeof input.endDate === "string") result.endDate = input.endDate;
  if (input.metadata && typeof input.metadata === "object") {
    result.metadata = input.metadata as Record<string, unknown>;
  }

  return result;
}
