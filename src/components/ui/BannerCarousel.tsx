"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { isCloudinaryDeliveryUrl, isSafeNavigationUrl } from "@/lib/urls";

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

interface BannerCarouselProps {
  banners: Banner[];
  carouselSettings?: {
    autoSlide: boolean;
    slideInterval: number;
    animation: "fade" | "slide" | "zoom" | "none";
    showIndicators: boolean;
    showNavigation: boolean;
    infinite: boolean;
  };
  className?: string;
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return reduced;
}

function bannerMediaUrl(banner: Banner): string | null {
  if (banner.backgroundImage && isCloudinaryDeliveryUrl(banner.backgroundImage)) {
    return banner.backgroundImage;
  }
  if (banner.image && isCloudinaryDeliveryUrl(banner.image)) {
    return banner.image;
  }
  return null;
}

function BannerSlideContent({ banner }: { banner: Banner }) {
  const textColor = banner.metadata?.textColor || "#ffffff";
  const buttonColor = banner.metadata?.buttonColor || "#7B85F0";
  const ctaOk = Boolean(banner.ctaText && banner.ctaLink && isSafeNavigationUrl(banner.ctaLink));

  return (
    <div className="relative z-10 w-full max-w-2xl" style={{ color: textColor }}>
      {banner.subtitle ? (
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] opacity-90">{banner.subtitle}</p>
      ) : null}
      <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight leading-tight break-words">
        {banner.title}
      </h1>
      {banner.description ? (
        <p className="mt-4 text-base sm:text-lg leading-relaxed opacity-90 max-w-xl break-words">{banner.description}</p>
      ) : null}
      {ctaOk ? (
        <Link
          href={banner.ctaLink!}
          className="mt-8 inline-flex items-center justify-center min-h-12 px-7 rounded-xl text-base font-semibold text-white shadow-soft transition-opacity hover:opacity-90"
          style={{ backgroundColor: buttonColor }}
        >
          {banner.ctaText}
        </Link>
      ) : null}
    </div>
  );
}

function BannerSlideShell({
  banner,
  className = "",
  children,
}: {
  banner: Banner;
  className?: string;
  children?: ReactNode;
}) {
  const media = bannerMediaUrl(banner);
  const fallbackBg = banner.metadata?.backgroundColor || "#3f4285";

  return (
    <div className={`relative w-full overflow-hidden ${className}`} style={{ backgroundColor: fallbackBg }}>
      {media ? (
        <Image
          src={media}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
          aria-hidden
        />
      ) : null}
      <div
        className="absolute inset-0"
        aria-hidden
        style={{
          background: media
            ? "linear-gradient(105deg, rgba(31,33,48,0.78) 0%, rgba(31,33,48,0.45) 48%, rgba(31,33,48,0.2) 100%)"
            : "radial-gradient(ellipse 70% 80% at 12% 20%, rgba(192,200,255,0.28), transparent 55%), linear-gradient(180deg, rgba(63,66,133,0.92), rgba(47,49,99,0.96))",
        }}
      />
      <div className="relative container-custom flex min-h-[min(72dvh,34rem)] sm:min-h-[min(68dvh,36rem)] items-end sm:items-center py-14 sm:py-16 md:py-20">
        {children ?? <BannerSlideContent banner={banner} />}
      </div>
    </div>
  );
}

export default function BannerCarousel({ banners, carouselSettings, className = "" }: BannerCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const prefersReducedMotion = usePrefersReducedMotion();

  const settings = {
    autoSlide: true,
    slideInterval: 5000,
    animation: "slide" as const,
    showIndicators: true,
    showNavigation: true,
    infinite: true,
    ...carouselSettings,
  };

  const animationEnabled = !prefersReducedMotion && settings.animation !== "none";
  const autoSlideEnabled = settings.autoSlide && !prefersReducedMotion;

  const handleNext = useCallback(() => {
    if (isAnimating) return;

    if (!animationEnabled) {
      setCurrentIndex((prev) =>
        settings.infinite ? (prev + 1) % banners.length : Math.min(prev + 1, banners.length - 1)
      );
      return;
    }

    setIsAnimating(true);
    setTimeout(() => {
      setCurrentIndex((prev) =>
        settings.infinite ? (prev + 1) % banners.length : Math.min(prev + 1, banners.length - 1)
      );
      setIsAnimating(false);
    }, 300);
  }, [animationEnabled, banners.length, isAnimating, settings.infinite]);

  const handlePrev = useCallback(() => {
    if (isAnimating) return;

    if (!animationEnabled) {
      setCurrentIndex((prev) =>
        settings.infinite ? (prev - 1 + banners.length) % banners.length : Math.max(prev - 1, 0)
      );
      return;
    }

    setIsAnimating(true);
    setTimeout(() => {
      setCurrentIndex((prev) =>
        settings.infinite ? (prev - 1 + banners.length) % banners.length : Math.max(prev - 1, 0)
      );
      setIsAnimating(false);
    }, 300);
  }, [animationEnabled, banners.length, isAnimating, settings.infinite]);

  useEffect(() => {
    if (!autoSlideEnabled || banners.length <= 1) return;

    const interval = setInterval(() => {
      handleNext();
    }, settings.slideInterval);

    return () => clearInterval(interval);
  }, [autoSlideEnabled, banners.length, currentIndex, handleNext, settings.slideInterval]);

  const goToSlide = (index: number) => {
    if (isAnimating) return;
    setCurrentIndex(index);
  };

  const getAnimationClass = () => {
    if (!animationEnabled) return "opacity-0";
    switch (settings.animation) {
      case "fade":
        return "opacity-0 transition-opacity duration-300";
      case "zoom":
        return "scale-95 opacity-0 transition-all duration-300";
      case "slide":
      default:
        return "translate-x-full transition-transform duration-300";
    }
  };

  const getActiveAnimationClass = () => {
    if (!animationEnabled) return "opacity-100";
    switch (settings.animation) {
      case "fade":
        return "opacity-100";
      case "zoom":
        return "scale-100 opacity-100";
      case "slide":
      default:
        return "translate-x-0";
    }
  };

  if (!banners || banners.length === 0) {
    return null;
  }

  return (
    <div className={`relative w-full overflow-hidden ${className}`}>
      <div className="relative min-h-[min(72dvh,34rem)] sm:min-h-[min(68dvh,36rem)]">
        {banners.map((banner, index) => (
          <div
            key={banner.id}
            className={`absolute inset-0 ${
              index === currentIndex ? getActiveAnimationClass() : getAnimationClass()
            } ${index === currentIndex ? "pointer-events-auto" : "pointer-events-none"}`}
            aria-hidden={index !== currentIndex}
          >
            <BannerSlideShell banner={banner} className="h-full min-h-[min(72dvh,34rem)] sm:min-h-[min(68dvh,36rem)]" />
          </div>
        ))}
      </div>

      {settings.showNavigation && banners.length > 1 && (
        <div className="pointer-events-none absolute inset-y-0 inset-x-0 z-20 flex items-center justify-between px-2 sm:px-4">
          <button
            onClick={handlePrev}
            className="pointer-events-auto bg-white/90 hover:bg-white text-ink min-h-11 min-w-11 p-2.5 rounded-full shadow-soft transition-colors"
            aria-label="Previous banner"
          >
            <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={handleNext}
            className="pointer-events-auto bg-white/90 hover:bg-white text-ink min-h-11 min-w-11 p-2.5 rounded-full shadow-soft transition-colors"
            aria-label="Next banner"
          >
            <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}

      {settings.showIndicators && banners.length > 1 && (
        <div className="absolute bottom-3 sm:bottom-4 inset-x-0 flex justify-center gap-1 z-20">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className="min-h-11 min-w-11 inline-flex items-center justify-center"
              aria-label={`Go to slide ${index + 1}`}
              aria-current={index === currentIndex}
            >
              <span
                className={`block w-2.5 h-2.5 rounded-full transition-colors ${
                  index === currentIndex ? "bg-white" : "bg-white/50 hover:bg-white/75"
                }`}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function HeroBanner({ banner, className = "" }: { banner: Banner; className?: string }) {
  return <BannerSlideShell banner={banner} className={className} />;
}
