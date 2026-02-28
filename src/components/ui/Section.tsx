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
    <section className={cn("py-12 md:py-16 lg:py-20", className)}>
      {(title || subtitle) && (
        <div className="text-center mb-12">
          {title && <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">{title}</h2>}
          {subtitle && <p className="text-lg md:text-xl text-neutral-600 max-w-3xl mx-auto">{subtitle}</p>}
        </div>
      )}
      {children}
    </section>
  );
}
