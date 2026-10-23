import { NextRequest, NextResponse } from "next/server";
import { jsonError } from "@/lib/http";
import { rateLimit, RateLimitUnavailable } from "@/lib/rate-limit";
import { hashIdentifier, readTrustedClientAddress } from "@/lib/request-utils";

const DEFAULT_MAX = 3;
const DEFAULT_WINDOW_SECONDS = 60;

export const AI_RATE_LIMIT_MESSAGE = "Too many AI requests. Try again in a minute.";

export type AiRateLimitConfig = {
  maxRequests: number;
  windowSeconds: number;
  windowMs: number;
};

/**
 * Parse AI_RATE_LIMIT_* env knobs.
 * Missing values use defaults (3 / 60). Invalid values return null (caller → 503).
 */
export function parseAiRateLimitConfig(): AiRateLimitConfig | null {
  const maxRaw = process.env.AI_RATE_LIMIT_MAX_REQUESTS?.trim();
  const windowRaw = process.env.AI_RATE_LIMIT_WINDOW_SECONDS?.trim();

  const maxRequests = maxRaw ? Number(maxRaw) : DEFAULT_MAX;
  const windowSeconds = windowRaw ? Number(windowRaw) : DEFAULT_WINDOW_SECONDS;

  if (!Number.isSafeInteger(maxRequests) || maxRequests < 1) return null;
  if (!Number.isSafeInteger(windowSeconds) || windowSeconds < 1) return null;

  return {
    maxRequests,
    windowSeconds,
    windowMs: windowSeconds * 1000,
  };
}

function resolveAiRateLimitKey(request: NextRequest, actorId: string): string {
  const ip = readTrustedClientAddress((name) => request.headers.get(name));
  if (ip) return `ai-ip:${hashIdentifier(ip)}`;
  return `ai-user:${actorId}`;
}

/**
 * Env-driven AI sliding-window limit (IP-hashed when TRUSTED_PROXY_HEADER yields an address).
 * Returns a NextResponse on block / misconfig / Redis failure; otherwise null.
 */
export async function enforceAiRateLimit(
  request: NextRequest,
  actorId: string
): Promise<NextResponse | null> {
  const config = parseAiRateLimitConfig();
  if (!config) {
    return jsonError("AI rate limit is misconfigured", 503);
  }

  try {
    const key = resolveAiRateLimitKey(request, actorId);
    const attempt = await rateLimit(key, config.maxRequests, config.windowMs);
    if (!attempt.ok) return jsonError(AI_RATE_LIMIT_MESSAGE, 429);
  } catch (error) {
    if (error instanceof RateLimitUnavailable) return jsonError(error.message, 503);
    throw error;
  }
  return null;
}
