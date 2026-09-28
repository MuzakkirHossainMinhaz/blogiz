const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

export interface PageQuery {
  page: number;
  limit: number;
  skip: number;
}

/**
 * Page must be a positive integer. Limit is clamped to 1–50.
 * Non-numeric or non-positive values are rejected rather than coerced.
 */
export function parsePageLimit(
  pageRaw: string | null,
  limitRaw: string | null,
  defaultLimit = DEFAULT_LIMIT
): PageQuery | { error: string } {
  const page = parsePositiveInt(pageRaw, 1);
  if (page === null) {
    return { error: "Invalid page" };
  }

  const parsedLimit = parsePositiveInt(limitRaw, defaultLimit);
  if (parsedLimit === null) {
    return { error: "Invalid limit" };
  }

  const limit = Math.min(parsedLimit, MAX_LIMIT);
  return { page, limit, skip: (page - 1) * limit };
}

function parsePositiveInt(value: string | null, fallback: number): number | null {
  if (value === null || value === "") return fallback;
  if (!/^[0-9]+$/.test(value)) return null;
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1) return null;
  return parsed;
}

/** Escape user input before it is placed in a MongoDB $regex. */
export function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function boundedSearch(input: string | null, max = 100): string {
  if (!input) return "";
  return input.trim().slice(0, max);
}
