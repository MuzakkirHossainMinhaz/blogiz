"use client";

import BannerDisplay from "@/components/ui/BannerDisplay";

export default function Banner() {
  return (
    <section>
      {/* Dynamic Hero Banner Carousel */}
      <BannerDisplay 
        type="hero" 
        limit={5}
        className="w-full"
      />
    </section>
  );
}
