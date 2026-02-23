"use client";

import React, { useState, useEffect } from "react";
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
}

export default function BannerDisplay({ 
  type = "all", 
  limit = 5,
  className = "" 
}: BannerDisplayProps) {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [carouselSettings, setCarouselSettings] = useState<any>(null);

  useEffect(() => {
    fetchBanners();
  }, [type, limit]);

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (type !== "all") {
        params.append("type", type);
      }
      
      if (type === "featured" || type === "hero") {
        params.append("carousel", "true");
      }
      
      params.append("limit", limit.toString());

      const response = await fetch(`/api/banners?${params.toString()}`);
      
      if (response.ok) {
        const data = await response.json();
        setBanners(data.banners);
        setCarouselSettings(data.carouselSettings);
      } else {
        console.error("Failed to fetch banners");
      }
    } catch (error) {
      console.error("Error fetching banners:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`w-full h-96 md:h-[500px] bg-gray-100 animate-pulse rounded-lg ${className}`}>
        <div className="h-full flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (banners.length === 0) {
    return null;
  }

  // Single hero banner
  if (type === "hero" && banners.length === 1) {
    return <HeroBanner banner={banners[0]} className={className} />;
  }

  // Multiple banners as carousel
  if (banners.length > 1) {
    return (
      <BannerCarousel 
        banners={banners} 
        carouselSettings={carouselSettings}
        className={className}
      />
    );
  }

  // Single banner (non-hero)
  return <HeroBanner banner={banners[0]} className={className} />;
}
