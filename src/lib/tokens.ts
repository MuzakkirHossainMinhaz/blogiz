import { createHash, randomBytes } from "crypto";

const HOUR_MS = 60 * 60 * 1000;

export function createSecretToken(ttlMs = HOUR_MS): { raw: string; hash: string; expires: Date } {
  const raw = randomBytes(32).toString("base64url");
  return { raw, hash: hashToken(raw), expires: new Date(Date.now() + ttlMs) };
}

export function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}
