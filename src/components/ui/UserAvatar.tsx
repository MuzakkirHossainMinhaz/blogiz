"use client";

import { UI_CONFIG } from "@/config/constants";
import { cn } from "@/lib/utils";
import { isStoredImageUrl } from "@/lib/urls";
import Image from "next/image";
import { useState } from "react";

const SIZES = {
  sm: { box: "w-8 h-8", px: 32, text: "text-xs" },
  md: { box: "w-10 h-10", px: 40, text: "text-sm" },
  lg: { box: "w-12 h-12", px: 48, text: "text-base" },
  xl: { box: "w-20 h-20", px: 80, text: "text-2xl" },
} as const;

type UserAvatarProps = {
  src?: string | null;
  name?: string | null;
  size?: keyof typeof SIZES;
  className?: string;
  /** Use for above-the-fold avatars to avoid Next.js LCP warnings. */
  priority?: boolean;
};

/**
 * Shows this app's Cloudinary avatar when available.
 * Otherwise tries `/author.png`. If that fails, shows the first letter of the name.
 */
export function UserAvatar({ src, name, size = "md", className, priority = false }: UserAvatarProps) {
  const dims = SIZES[size];
  const remote = src && isStoredImageUrl(src) ? src : null;
  const [failed, setFailed] = useState(false);
  const alt = name?.trim() || "User avatar";
  const initial = (name?.trim()?.charAt(0) || "?").toUpperCase();

  if (failed) {
    return (
      <span
        className={cn(
          "inline-flex shrink-0 items-center justify-center rounded-full bg-primary-100 font-semibold text-primary-800 ring-2 ring-primary-100",
          dims.box,
          dims.text,
          className
        )}
        aria-label={alt}
        title={alt}
      >
        {initial}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 overflow-hidden rounded-full bg-primary-50 ring-2 ring-primary-100",
        dims.box,
        className
      )}
    >
      <Image
        src={remote || UI_CONFIG.DEFAULT_AVATAR}
        alt={alt}
        width={dims.px}
        height={dims.px}
        className="h-full w-full object-cover"
        unoptimized={!remote}
        priority={priority}
        onError={() => setFailed(true)}
      />
    </span>
  );
}
