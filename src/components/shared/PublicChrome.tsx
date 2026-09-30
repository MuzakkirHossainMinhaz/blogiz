"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/**
 * Client chrome switch only. Navbar/Footer are passed in from the server layout
 * so they stay Server Components and are not stuck in a stale Turbopack client chunk.
 */
export function PublicChrome({
  navbar,
  footer,
  children,
}: {
  navbar: ReactNode;
  footer: ReactNode;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const isDashboard = pathname.startsWith("/dashboard");

  if (isDashboard) {
    return <>{children}</>;
  }

  return (
    <>
      {navbar}
      {children}
      {footer}
    </>
  );
}
