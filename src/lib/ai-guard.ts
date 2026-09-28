import { NextResponse } from "next/server";
import { denied, requireUser, type AuthContext } from "@/lib/authz";
import { jsonError } from "@/lib/http";
import { rateLimit, RateLimitUnavailable } from "@/lib/rate-limit";

const WINDOW_MS = 10 * 60 * 1000;
const LIMIT = 20;

export async function requireAiUser(): Promise<AuthContext | NextResponse> {
  const actor = await requireUser();
  if (denied(actor)) return actor;
  if (!actor.emailVerified) return jsonError("Verify your email before continuing", 403);

  try {
    const attempt = await rateLimit(`ai:${actor.id}`, LIMIT, WINDOW_MS);
    if (!attempt.ok) return jsonError("Too many requests", 429);
  } catch (error) {
    if (error instanceof RateLimitUnavailable) return jsonError(error.message, 503);
    throw error;
  }
  return actor;
}
