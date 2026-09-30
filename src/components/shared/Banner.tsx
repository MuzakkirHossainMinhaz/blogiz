"use client";

import BannerDisplay from "@/components/ui/BannerDisplay";
import { HomeHero } from "@/components/shared/HomeHero";

/** Admin-managed hero banners; falls back to the brand HomeHero when none are active. */
export default function Banner() {
  return (
    <section className="border-b border-neutral-200/80">
      <BannerDisplay type="hero" limit={5} className="w-full" fallback={<HomeHero />} />
    </section>
  );
}
