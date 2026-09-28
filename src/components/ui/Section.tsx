import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface SectionProps {
  children: ReactNode;
  className?: string;
  title?: ReactNode;
  subtitle?: string;
}

export function Section({ children, className, title, subtitle }: SectionProps) {
  return (
    <section className={cn("py-10 sm:py-14 md:py-16 lg:py-20", className)}>
      {(title || subtitle) && (
        <div className="text-center mb-10 md:mb-12">
          {title && (
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight text-ink mb-3 md:mb-4">
              {title}
            </h2>
          )}
          {subtitle && <p className="text-base md:text-lg text-accent-500 max-w-2xl mx-auto">{subtitle}</p>}
        </div>
      )}
      {children}
    </section>
  );
}
