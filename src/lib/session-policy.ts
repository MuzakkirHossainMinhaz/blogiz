import type { UserRole } from "@/lib/permissions";

export interface SessionUserRecord {
  role: UserRole;
  isActive: boolean;
  isApproved: boolean;
  emailVerified?: boolean;
  sessionVersion: number;
  email?: string;
  name?: string;
}

/**
 * Login gate aligned with seed and registration.
 * - Inactive accounts never sign in.
 * - Authors must be approved (admins set isApproved when promoting).
 * - Readers, admins, and superadmins do not need isApproved.
 * - emailVerified is not required to sign in (uploads and privileged writes still check it).
 */
export function canSignIn(user: {
  isActive: boolean;
  role: UserRole;
  isApproved: boolean;
}): boolean {
  if (!user.isActive) return false;
  if (user.role === "author" && !user.isApproved) return false;
  return true;
}

/**
 * Session gate. Missing, inactive, or revoked (sessionVersion mismatch) sessions are rejected.
 * Authors who lose approval mid-session are dropped. The role returned here is the database role.
 */
export function evaluateSession(
  user: SessionUserRecord | null,
  tokenVersion: number | undefined
):
  | { ok: false }
  | {
      ok: true;
      role: UserRole;
      isApproved: boolean;
      emailVerified: boolean;
      email: string;
      name: string;
    } {
  if (!user || user.isActive === false) return { ok: false };
  if (typeof tokenVersion === "number" && user.sessionVersion !== tokenVersion) return { ok: false };
  if (user.role === "author" && !user.isApproved) return { ok: false };
  return {
    ok: true,
    role: user.role,
    isApproved: user.isApproved,
    emailVerified: Boolean(user.emailVerified),
    email: user.email || "",
    name: user.name || "",
  };
}
