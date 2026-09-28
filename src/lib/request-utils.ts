import { createHash } from "crypto";
import { headers } from "next/headers";
import { requireAuthSecret } from "@/lib/env";

/**
 * Raw client IPs are not stored.
 * A hash is derived only when TRUSTED_PROXY_HEADER names a proxy header this deployment trusts.
 * View documents that keep that hash expire after 90 days (see BlogView).
 */
export function hashIdentifier(value: string): string {
  return createHash("sha256").update(`${requireAuthSecret()}:${value}`).digest("hex");
}

export function readTrustedClientAddress(headerGetter: (name: string) => string | null): string | null {
  const headerName = process.env.TRUSTED_PROXY_HEADER?.trim().toLowerCase();
  if (!headerName) return null;
  const raw = headerGetter(headerName);
  if (!raw) return null;
  const ip = headerName === "x-forwarded-for" ? raw.split(",")[0]?.trim() : raw.trim();
  if (!ip) return null;
  return ip;
}

export async function trustedClientHash(): Promise<string | null> {
  const headerList = await headers();
  const ip = readTrustedClientAddress((name) => headerList.get(name));
  if (!ip) return null;
  return hashIdentifier(ip);
}
