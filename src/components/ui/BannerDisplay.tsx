"use client";

import { useEffect, useState, type ReactNode } from "react";
import BannerCarousel, { HeroBanner } from "./BannerCarousel";

interface Banner {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  image: string;
  backgroundImage?: string;
  ctaText?: string;
  ctaLink?: string;
  type: "hero" | "featured" | "announcement" | "promotion";
  metadata?: {
    backgroundColor?: string;
    textColor?: string;
    buttonColor?: string;
    animation?: "fade" | "slide" | "zoom" | "none";
    autoSlide?: boolean;
    slideInterval?: number;
  };
}

interface BannerDisplayProps {
  type?: "hero" | "featured" | "all";
  limit?: number;
  className?: string;
  /** Shown while loading or when no banners are configured in the admin panel. */
  fallback?: ReactNode;
}

export default function BannerDisplay({
  type = "all",
  limit = 5,
  className = "",
  fallback = null,
}: BannerDisplayProps) {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [carouselSettings, setCarouselSettings] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const params = new URLSearchParams();

        if (type !== "all") {
          params.append("type", type);
        }

        if (type === "featured" || type === "hero") {
          params.append("carousel", "true");
        }

        params.append("limit", limit.toString());

        const response = await fetch(`/api/banners?${params.toString()}`);
        if (cancelled) return;

        if (response.ok) {
          const data = await response.json();
          setBanners(data.banners);
          setCarouselSettings(data.carouselSettings);
        } else {
          console.error("Failed to fetch banners");
        }
      } catch (error) {
        if (!cancelled) console.error("Error fetching banners:", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [type, limit]);

  if (loading) {
    return (
      fallback ?? (
        <div className={`w-full min-h-[min(72dvh,34rem)] bg-primary-50 animate-pulse ${className}`}>
          <div className="h-full min-h-[min(72dvh,34rem)] flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
          </div>
        </div>
      )
    );
  }

  if (banners.length === 0) {
    return <>{fallback}</>;
  }

  if (type === "hero" && banners.length === 1) {
    return <HeroBanner banner={banners[0]} className={className} />;
  }

  if (banners.length > 1) {
    return (
      <BannerCarousel
        banners={banners}
        carouselSettings={carouselSettings as never}
        className={className}
      />
    );
  }

  return <HeroBanner banner={banners[0]} className={className} />;
}
