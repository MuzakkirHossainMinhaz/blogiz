import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind CSS classes with clsx
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Truncate text to a specified length
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + "...";
}

/**
 * Format date to readable string
 */
export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return dateString;
  }
}

/**
 * Format number with commas
 */
export function formatNumber(num: string | number): string {
  const number = typeof num === "string" ? parseInt(num, 10) : num;
  if (isNaN(number)) return "0";
  return number.toLocaleString();
}

/**
 * Validate URL
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Generate unique ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function authorProfileId(authorId: unknown): string | null {
  if (typeof authorId === "string" && /^[a-fA-F0-9]{24}$/.test(authorId)) return authorId;
  if (!authorId || typeof authorId !== "object" || !("_id" in authorId)) return null;
  const id = (authorId as { _id?: unknown })._id;
  if (typeof id === "string" && /^[a-fA-F0-9]{24}$/.test(id)) return id;
  if (id && typeof id === "object" && "toString" in id) {
    const value = String(id);
    return /^[a-fA-F0-9]{24}$/.test(value) ? value : null;
  }
  return null;
}

/** Avatar URL from a populated author ref, if present. */
export function authorAvatarUrl(authorId: unknown): string | undefined {
  if (!authorId || typeof authorId !== "object") return undefined;
  const profile = (authorId as { profile?: { avatar?: unknown } }).profile;
  return typeof profile?.avatar === "string" && profile.avatar.trim() ? profile.avatar.trim() : undefined;
}
