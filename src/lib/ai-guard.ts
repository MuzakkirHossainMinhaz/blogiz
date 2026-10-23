import { NextRequest, NextResponse } from "next/server";
import { enforceAiRateLimit } from "@/lib/ai-rate-limit";
import { denied, requireUser, type AuthContext } from "@/lib/authz";
import { jsonError } from "@/lib/http";

/**
 * Verified signed-in user plus env-driven AI rate limit (IP-hashed when available).
 */
export async function requireAiUser(
  request: NextRequest
): Promise<AuthContext | NextResponse> {
  const actor = await requireUser();
  if (denied(actor)) return actor;
  if (!actor.emailVerified) return jsonError("Verify your email before continuing", 403);

  const limited = await enforceAiRateLimit(request, actor.id);
  if (limited) return limited;

  return actor;
}
