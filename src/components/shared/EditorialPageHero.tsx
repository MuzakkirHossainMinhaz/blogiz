import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type EditorialPageHeroProps = {
  eyebrow?: string;
  title: ReactNode;
  description: ReactNode;
  className?: string;
};

/** Soft indigo page header shared by About, Support, Privacy, and Terms. */
export function EditorialPageHero({ eyebrow, title, description, className }: EditorialPageHeroProps) {
  return (
    <header
      className={cn(
        "relative overflow-hidden border-b border-neutral-200/80",
        className
      )}
    >
      <div
        className="absolute inset-0 -z-10"
        aria-hidden="true"
        style={{
          background: `
            radial-gradient(ellipse 70% 80% at 8% 0%, rgba(192, 200, 255, 0.5), transparent 55%),
            radial-gradient(ellipse 50% 60% at 92% 20%, rgba(123, 133, 240, 0.16), transparent 50%),
            linear-gradient(180deg, #f7f6ff 0%, #eef0ff 55%, #f7f6ff 100%)
          `,
        }}
      />
      <div className="container-custom py-14 sm:py-16 md:py-20">
        <div className="max-w-2xl">
          {eyebrow ? (
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-primary-600">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight text-ink">
            {title}
          </h1>
          <p className="mt-4 text-base sm:text-lg text-accent-500 leading-relaxed">{description}</p>
        </div>
      </div>
    </header>
  );
}
