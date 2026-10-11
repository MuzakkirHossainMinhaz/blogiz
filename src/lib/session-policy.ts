import type { UserRole } from "@/lib/permissions";

export interface SessionUserRecord {
  role: UserRole;
  isActive: boolean;
  emailVerified?: boolean;
  commentSuspended?: boolean;
  sessionVersion: number;
  email?: string;
  name?: string;
  avatar?: string;
}

/**
 * Login gate: inactive accounts never sign in.
 * emailVerified is not required to sign in (uploads and privileged writes still check it).
 */
export function canSignIn(user: { isActive: boolean }): boolean {
  return user.isActive !== false;
}

/**
 * Session gate. Missing, inactive, or revoked (sessionVersion mismatch) sessions are rejected.
 * The role returned here is the database role.
 */
export function evaluateSession(
  user: SessionUserRecord | null,
  tokenVersion: number | undefined
):
  | { ok: false }
  | {
      ok: true;
      role: UserRole;
      emailVerified: boolean;
      commentSuspended: boolean;
      email: string;
      name: string;
      avatar: string;
    } {
  if (!user || user.isActive === false) return { ok: false };
  if (typeof tokenVersion === "number" && user.sessionVersion !== tokenVersion) return { ok: false };
  return {
    ok: true,
    role: user.role,
    emailVerified: Boolean(user.emailVerified),
    commentSuspended: Boolean(user.commentSuspended),
    email: user.email || "",
    name: user.name || "",
    avatar: user.avatar || "",
  };
}
