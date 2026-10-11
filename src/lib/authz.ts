import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { jsonError } from "@/lib/http";
import { hasPermission, isUserRole, type Permission, type UserRole } from "@/lib/permissions";

export interface AuthContext {
  id: string;
  role: UserRole;
  email: string;
  name: string;
  emailVerified: boolean;
  commentSuspended: boolean;
}

export function denied(result: AuthContext | NextResponse): result is NextResponse {
  return result instanceof NextResponse;
}

export async function requireUser(): Promise<AuthContext | NextResponse> {
  const session = await auth();
  const user = session?.user;
  if (!user?.id || !isUserRole(user.role)) {
    return jsonError("Unauthorized", 401);
  }

  return {
    id: user.id,
    role: user.role,
    email: user.email || "",
    name: user.name || "",
    emailVerified: Boolean(user.emailVerified),
    commentSuspended: Boolean(user.commentSuspended),
  };
}

/**
 * Single permission check for route handlers.
 * Pass verified for privileged actions (uploads, AI).
 */
export async function requirePermission(
  permission: keyof Permission["can"],
  options?: { verified?: boolean }
): Promise<AuthContext | NextResponse> {
  const actor = await requireUser();
  if (denied(actor)) return actor;

  if (!hasPermission(actor.role, permission)) {
    return jsonError("Insufficient permissions", 403);
  }

  if (options?.verified && !actor.emailVerified) {
    return jsonError("Verify your email before continuing", 403);
  }

  return actor;
}
