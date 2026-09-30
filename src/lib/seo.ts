import type { Metadata } from "next";
import { APP_CONFIG } from "@/config/constants";

const FALLBACK_SITE_URL = "http://localhost:3000";

export function siteUrl(): string {
  const raw = process.env.AUTH_URL || process.env.NEXTAUTH_URL || FALLBACK_SITE_URL;
  return raw.replace(/\/$/, "");
}

export function absoluteUrl(path = "/"): string {
  const base = siteUrl();
  if (!path || path === "/") return base;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

function truncate(text: string, max: number): string {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (cleaned.length <= max) return cleaned;
  return `${cleaned.slice(0, max - 1).trimEnd()}…`;
}

export interface PageMetaInput {
  title: string;
  description: string;
  path?: string;
  image?: string;
  type?: "website" | "article" | "profile";
  noIndex?: boolean;
}

/** Public page metadata. Never put secrets or emails into these fields. */
export function buildPageMetadata({
  title,
  description,
  path = "/",
  image,
  type = "website",
  noIndex = false,
}: PageMetaInput): Metadata {
  const url = absoluteUrl(path);
  const desc = truncate(description, 160);
  const fullTitle = title === APP_CONFIG.SITE_NAME ? title : `${title} · ${APP_CONFIG.SITE_NAME}`;
  const ogImage = image || absoluteUrl("/logo.png");

  return {
    title: fullTitle,
    description: desc,
    metadataBase: new URL(siteUrl()),
    alternates: {
      canonical: url,
    },
    robots: noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true },
    openGraph: {
      title: fullTitle,
      description: desc,
      url,
      siteName: APP_CONFIG.SITE_NAME,
      type,
      images: [{ url: ogImage, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description: desc,
      images: [ogImage],
    },
  };
}

export const DEFAULT_DESCRIPTION = APP_CONFIG.SITE_DESCRIPTION;
