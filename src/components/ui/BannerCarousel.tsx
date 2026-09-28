"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
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

function BannerTypeBadge({ type }: { type: Banner["type"] }) {
  return (
    <span
      className={`inline-block px-2.5 py-1 text-xs font-semibold rounded-lg ${
        type === "hero"
          ? "bg-primary-100 text-primary-800"
          : type === "featured"
            ? "bg-primary-50 text-primary-700"
            : type === "announcement"
              ? "bg-accent-100 text-accent-700"
              : "bg-neutral-100 text-neutral-700"
      }`}
    >
      {type}
    </span>
  );
}

function BannerContent({ banner }: { banner: Banner }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-8 items-center py-6 sm:py-8 md:py-0">
      <div className="space-y-3 sm:space-y-4 z-10" style={{ color: banner.metadata?.textColor || "#000000" }}>
        <div className="space-y-2">
          {banner.type && <BannerTypeBadge type={banner.type} />}
          <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-semibold leading-tight break-words tracking-tight">
            {banner.title}
          </h1>
          {banner.subtitle && (
            <h2 className="text-base sm:text-xl md:text-2xl font-medium opacity-90 break-words">{banner.subtitle}</h2>
          )}
        </div>

        {banner.description && (
          <p className="text-sm sm:text-base md:text-lg opacity-80 max-w-lg break-words">{banner.description}</p>
        )}

        {banner.ctaText && banner.ctaLink && isSafeNavigationUrl(banner.ctaLink) && (
          <a
            href={banner.ctaLink}
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center min-h-11 px-5 sm:px-6 py-3 font-semibold rounded-xl transition-colors hover:opacity-90"
            style={{
              backgroundColor: banner.metadata?.buttonColor || "#7B85F0",
              color: "#ffffff",
            }}
          >
            {banner.ctaText}
          </a>
        )}
      </div>

      <div className="relative h-40 sm:h-56 md:h-80 w-full max-w-md mx-auto md:max-w-none">
        {isCloudinaryDeliveryUrl(banner.image) && (
          <Image
            src={banner.image}
            alt={banner.title}
            fill
            className="object-contain"
            sizes="(max-width: 768px) 100vw, 50vw"
            priority
          />
        )}
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
      <div className="relative min-h-[22rem] sm:min-h-[24rem] md:h-[500px]">
        {banners.map((banner, index) => (
          <div
            key={banner.id}
            className={`absolute inset-0 overflow-y-auto ${
              index === currentIndex ? getActiveAnimationClass() : getAnimationClass()
            } ${index === currentIndex ? "pointer-events-auto" : "pointer-events-none"}`}
            style={{
              backgroundColor: banner.metadata?.backgroundColor || "#ffffff",
              backgroundImage: banner.backgroundImage ? `url(${banner.backgroundImage})` : undefined,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
            aria-hidden={index !== currentIndex}
          >
            <div className="relative h-full flex items-center">
              <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <BannerContent banner={banner} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {settings.showNavigation && banners.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-neutral-800 min-h-11 min-w-11 p-2.5 rounded-full shadow-lg transition-colors z-20"
            aria-label="Previous banner"
          >
            <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={handleNext}
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-neutral-800 min-h-11 min-w-11 p-2.5 rounded-full shadow-lg transition-colors z-20"
            aria-label="Next banner"
          >
            <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      {settings.showIndicators && banners.length > 1 && (
        <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 flex space-x-1 z-20">
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
  return (
    <div
      className={`relative w-full min-h-[22rem] sm:min-h-[24rem] md:h-[500px] overflow-hidden ${className}`}
      style={{
        backgroundColor: banner.metadata?.backgroundColor || "#ffffff",
        backgroundImage: banner.backgroundImage ? `url(${banner.backgroundImage})` : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="relative h-full flex items-center">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <BannerContent banner={banner} />
        </div>
      </div>
    </div>
  );
}
