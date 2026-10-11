"use client";

import { useSession } from "next-auth/react";

/**
 * Session helpers that stay stable during next-auth `update()` refetches.
 * Treating those refetches as a full loading/unauthenticated state causes
 * layout flashes that feel like a page reload.
 */
export function useSessionStatus() {
  const sessionApi = useSession();
  const { data: session, status } = sessionApi;

  return {
    ...sessionApi,
    session,
    /** True only before the first session payload is available. */
    isInitialLoading: status === "loading" && !session,
    isAuthenticated: Boolean(session?.user),
  };
}
