import { NextResponse } from "next/server";
import { denied, requireUser, type AuthContext } from "@/lib/authz";
import { jsonError } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";

const WINDOW_MS = 10 * 60 * 1000;
const LIMIT = 20;

export async function requireAiUser(): Promise<AuthContext | NextResponse> {
  const actor = await requireUser();
  if (denied(actor)) return actor;
  if (!actor.emailVerified) return jsonError("Verify your email before continuing", 403);

  const attempt = rateLimit(`ai:${actor.id}`, LIMIT, WINDOW_MS);
  if (!attempt.ok) return jsonError("Too many requests", 429);
  return actor;
}
