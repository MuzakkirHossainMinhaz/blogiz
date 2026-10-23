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

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

/**
 * Format date to a stable en-US-style string (SSR/client identical).
 */
export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return dateString;
    return `${MONTHS[date.getUTCMonth()]} ${date.getUTCDate()}, ${date.getUTCFullYear()}`;
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

function asObjectIdString(value: unknown): string | null {
  if (typeof value === "string" && /^[a-fA-F0-9]{24}$/.test(value)) return value;
  if (value && typeof value === "object" && "toString" in value) {
    const text = String(value);
    return /^[a-fA-F0-9]{24}$/.test(text) ? text : null;
  }
  return null;
}

/** ObjectId string from a raw id, string, or populated user ref. */
export function authorProfileId(authorId: unknown): string | null {
  const direct = asObjectIdString(authorId);
  if (direct) return direct;
  if (!authorId || typeof authorId !== "object" || !("_id" in authorId)) return null;
  return asObjectIdString((authorId as { _id?: unknown })._id);
}

/** Avatar URL from a populated author ref, if present. */
export function authorAvatarUrl(authorId: unknown): string | undefined {
  if (!authorId || typeof authorId !== "object") return undefined;
  const profile = (authorId as { profile?: { avatar?: unknown } }).profile;
  return typeof profile?.avatar === "string" && profile.avatar.trim() ? profile.avatar.trim() : undefined;
}
