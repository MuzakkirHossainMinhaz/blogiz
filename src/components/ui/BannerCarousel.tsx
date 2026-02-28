"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

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

export default function BannerCarousel({ banners, carouselSettings, className = "" }: BannerCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // Default carousel settings
  const settings = {
    autoSlide: true,
    slideInterval: 5000,
    animation: "slide",
    showIndicators: true,
    showNavigation: true,
    infinite: true,
    ...carouselSettings,
  };

  // Auto-slide functionality
  useEffect(() => {
    if (!settings.autoSlide || banners.length <= 1) return;

    const interval = setInterval(() => {
      handleNext();
    }, settings.slideInterval);

    return () => clearInterval(interval);
  }, [currentIndex, settings.autoSlide, settings.slideInterval, banners.length]);

  const handleNext = () => {
    if (isAnimating) return;

    setIsAnimating(true);
    setTimeout(() => {
      setCurrentIndex((prev) =>
        settings.infinite ? (prev + 1) % banners.length : Math.min(prev + 1, banners.length - 1)
      );
      setIsAnimating(false);
    }, 300);
  };

  const handlePrev = () => {
    if (isAnimating) return;

    setIsAnimating(true);
    setTimeout(() => {
      setCurrentIndex((prev) =>
        settings.infinite ? (prev - 1 + banners.length) % banners.length : Math.max(prev - 1, 0)
      );
      setIsAnimating(false);
    }, 300);
  };

  const goToSlide = (index: number) => {
    if (isAnimating) return;
    setCurrentIndex(index);
  };

  const getAnimationClass = () => {
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

  const currentBanner = banners[currentIndex];

  return (
    <div className={`relative w-full overflow-hidden rounded-lg ${className}`}>
      {/* Banner Container */}
      <div className="relative h-96 md:h-[500px]">
        {banners.map((banner, index) => (
          <div
            key={banner.id}
            className={`absolute inset-0 ${index === currentIndex ? getActiveAnimationClass() : getAnimationClass()}`}
            style={{
              backgroundColor: banner.metadata?.backgroundColor || "#ffffff",
              backgroundImage: banner.backgroundImage ? `url(${banner.backgroundImage})` : undefined,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <div className="relative h-full flex items-center">
              <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                  {/* Content */}
                  <div className="space-y-4 z-10" style={{ color: banner.metadata?.textColor || "#000000" }}>
                    <div className="space-y-2">
                      {banner.type && (
                        <span
                          className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${
                            banner.type === "hero"
                              ? "bg-purple-100 text-purple-800"
                              : banner.type === "featured"
                              ? "bg-blue-100 text-blue-800"
                              : banner.type === "announcement"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {banner.type}
                        </span>
                      )}
                      <h1 className="text-3xl md:text-5xl font-bold leading-tight">{banner.title}</h1>
                      {banner.subtitle && (
                        <h2 className="text-xl md:text-2xl font-medium opacity-90">{banner.subtitle}</h2>
                      )}
                    </div>

                    {banner.description && <p className="text-lg opacity-80 max-w-lg">{banner.description}</p>}

                    {banner.ctaText && banner.ctaLink && (
                      <button
                        onClick={() => (window.location.href = banner.ctaLink!)}
                        className="inline-block px-6 py-3 font-semibold rounded-lg transition-colors hover:opacity-90"
                        style={{
                          backgroundColor: banner.metadata?.buttonColor || "#3b82f6",
                          color: "#ffffff",
                        }}
                      >
                        {banner.ctaText}
                      </button>
                    )}
                  </div>

                  {/* Image */}
                  <div className="relative h-64 md:h-80">
                    <Image
                      src={banner.image}
                      alt={banner.title}
                      fill
                      className="object-contain"
                      priority={index === 0}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      {settings.showNavigation && banners.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-2 rounded-full shadow-lg transition-colors z-20"
            aria-label="Previous banner"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-2 rounded-full shadow-lg transition-colors z-20"
            aria-label="Next banner"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      {/* Indicators */}
      {settings.showIndicators && banners.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2 z-20">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentIndex ? "bg-white" : "bg-white/50 hover:bg-white/75"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Hero Banner Component (for single banner display)
export function HeroBanner({ banner, className = "" }: { banner: Banner; className?: string }) {
  return (
    <div
      className={`relative w-full h-96 md:h-[500px] overflow-hidden rounded-lg ${className}`}
      style={{
        backgroundColor: banner.metadata?.backgroundColor || "#ffffff",
        backgroundImage: banner.backgroundImage ? `url(${banner.backgroundImage})` : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="relative h-full flex items-center">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            {/* Content */}
            <div className="space-y-4 z-10" style={{ color: banner.metadata?.textColor || "#000000" }}>
              <div className="space-y-2">
                {banner.type && (
                  <span
                    className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${
                      banner.type === "hero"
                        ? "bg-purple-100 text-purple-800"
                        : banner.type === "featured"
                        ? "bg-blue-100 text-blue-800"
                        : banner.type === "announcement"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-green-100 text-green-800"
                    }`}
                  >
                    {banner.type}
                  </span>
                )}
                <h1 className="text-3xl md:text-5xl font-bold leading-tight">{banner.title}</h1>
                {banner.subtitle && <h2 className="text-xl md:text-2xl font-medium opacity-90">{banner.subtitle}</h2>}
              </div>

              {banner.description && <p className="text-lg opacity-80 max-w-lg">{banner.description}</p>}

              {banner.ctaText && banner.ctaLink && (
                <button
                  onClick={() => (window.location.href = banner.ctaLink!)}
                  className="inline-block px-6 py-3 font-semibold rounded-lg transition-colors hover:opacity-90"
                  style={{
                    backgroundColor: banner.metadata?.buttonColor || "#3b82f6",
                    color: "#ffffff",
                  }}
                >
                  {banner.ctaText}
                </button>
              )}
            </div>

            {/* Image */}
            <div className="relative h-64 md:h-80">
              <Image src={banner.image} alt={banner.title} fill className="object-contain" priority />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
