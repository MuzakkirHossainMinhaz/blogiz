"use client";

import { isStoredImageUrl } from "@/lib/urls";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useState } from "react";

type BlogCoverImageProps = {
  src?: string | null;
  alt: string;
  width: number;
  height: number;
  className?: string;
  sizes?: string;
  priority?: boolean;
};

/**
 * Uses stored cover URLs (local `/api/media/...` or Pollinations HTTPS).
 * On missing/invalid/failed images, shows a branded indigo placeholder.
 */
export function BlogCoverImage({
  src,
  alt,
  width,
  height,
  className,
  sizes,
  priority = false,
}: BlogCoverImageProps) {
  const remote = src && isStoredImageUrl(src) ? src : null;
  const [failed, setFailed] = useState(false);

  if (!remote || failed) {
    return (
      <div
        className={cn(
          "flex w-full items-end bg-linear-to-br from-primary-100 via-feather to-primary-200",
          className
        )}
        role="img"
        aria-label={alt}
      >
        <div className="w-full bg-linear-to-t from-ink/25 to-transparent px-4 py-3">
          <span className="line-clamp-2 font-display text-sm font-semibold text-white drop-shadow-sm sm:text-base">
            {alt}
          </span>
        </div>
      </div>
    );
  }

  return (
    <Image
      src={remote}
      alt={alt}
      width={width}
      height={height}
      className={className}
      sizes={sizes}
      priority={priority}
      unoptimized={remote.startsWith("/api/media/")}
      onError={() => setFailed(true)}
    />
  );
}
