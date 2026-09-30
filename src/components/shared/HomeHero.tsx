"use client";

import { FadeIn } from "@/components/motion";
import { APP_CONFIG, ROUTES } from "@/config/constants";
import Image from "next/image";
import Link from "next/link";

/** Brand fallback hero when no admin banners are published. */
export function HomeHero() {
  return (
    <section className="relative overflow-hidden">
      <div
        className="absolute inset-0 -z-10"
        aria-hidden="true"
        style={{
          background: `
            radial-gradient(ellipse 80% 60% at 15% 20%, rgba(192, 200, 255, 0.55), transparent 55%),
            radial-gradient(ellipse 70% 50% at 90% 10%, rgba(123, 133, 240, 0.18), transparent 50%),
            radial-gradient(ellipse 60% 40% at 70% 90%, rgba(63, 66, 133, 0.08), transparent 55%),
            linear-gradient(180deg, #f7f6ff 0%, #eef0ff 48%, #f7f6ff 100%)
          `,
        }}
      />
      <div
        className="absolute inset-0 -z-10 opacity-[0.35]"
        aria-hidden="true"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%233f4285' fill-opacity='0.04'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div className="container-custom flex min-h-[min(72dvh,34rem)] sm:min-h-[min(68dvh,36rem)] flex-col items-center justify-center py-16 sm:py-20 md:py-24 text-center">
        <FadeIn className="flex flex-col items-center">
          <Image
            src="/logo.png"
            width={112}
            height={112}
            alt={`${APP_CONFIG.SITE_NAME} logo`}
            className="mb-6 h-20 w-20 sm:h-24 sm:w-24 md:h-28 md:w-28 object-contain drop-shadow-sm"
            priority
          />
          <h1 className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-semibold tracking-tight text-ink">
            {APP_CONFIG.SITE_NAME}
          </h1>
        </FadeIn>

        <FadeIn delay={0.08} className="mt-5 max-w-xl">
          <p className="font-display text-xl sm:text-2xl md:text-3xl font-medium text-primary-800/90 tracking-tight">
            Stories worth putting to paper
          </p>
          <p className="mt-3 text-base sm:text-lg text-accent-500 leading-relaxed">
            An editorial home for writers and readers — draft, publish, and share with a calm indigo craft.
          </p>
        </FadeIn>

        <FadeIn
          delay={0.16}
          className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto max-w-sm sm:max-w-none"
        >
          <Link
            href={ROUTES.BLOGS}
            className="inline-flex items-center justify-center min-h-12 px-7 rounded-xl text-base font-semibold text-white bg-primary-500 hover:bg-primary-600 shadow-soft transition-colors"
          >
            Explore blogs
          </Link>
          <Link
            href="/auth/register"
            className="inline-flex items-center justify-center min-h-12 px-7 rounded-xl text-base font-semibold text-ink bg-white/80 border border-primary-200 hover:bg-white hover:border-primary-300 shadow-soft transition-colors"
          >
            Get started
          </Link>
        </FadeIn>
      </div>
    </section>
  );
}
