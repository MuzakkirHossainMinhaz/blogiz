/**
 * Required process environment. There is no localhost or placeholder fallback:
 * a missing value throws before the app talks to a database or signs a session.
 */

function read(name: string): string {
  const value = process.env[name];
  if (typeof value !== "string") return "";
  return value.trim();
}

export function requireMongoUri(): string {
  const uri = read("MONGODB_URI");
  if (!uri) {
    throw new Error("MONGODB_URI is required");
  }
  return uri;
}

export function requireAuthSecret(): string {
  const secret = read("AUTH_SECRET") || read("NEXTAUTH_SECRET");
  if (!secret) {
    throw new Error("AUTH_SECRET is required");
  }
  if (!read("AUTH_SECRET")) {
    process.env.AUTH_SECRET = secret;
  }
  return secret;
}

export function requireAuthUrl(): string {
  const url = read("AUTH_URL") || read("NEXTAUTH_URL");
  if (!url) {
    throw new Error("AUTH_URL is required");
  }
  if (!read("AUTH_URL")) {
    process.env.AUTH_URL = url;
  }
  return url;
}
