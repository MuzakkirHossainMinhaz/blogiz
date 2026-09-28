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
    <section className={cn("py-8 sm:py-12 md:py-16 lg:py-20", className)}>
      {(title || subtitle) && (
        <div className="text-center mb-8 md:mb-12 px-1">
          {title && (
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4 break-words">
              {title}
            </h2>
          )}
          {subtitle && (
            <p className="text-base sm:text-lg md:text-xl text-neutral-600 max-w-3xl mx-auto">{subtitle}</p>
          )}
        </div>
      )}
      {children}
    </section>
  );
}
