import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type ChartCardProps = {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  empty?: boolean;
  emptyMessage?: string;
};

export function ChartCard({
  title,
  description,
  children,
  className,
  empty = false,
  emptyMessage = "Not Enough Data Yet",
}: ChartCardProps) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-primary-100 bg-surface p-4 sm:p-5 shadow-soft",
        className
      )}
    >
      <header className="mb-4">
        <h2 className="text-base sm:text-lg font-semibold text-ink tracking-tight">{title}</h2>
        {description ? <p className="mt-1 text-sm text-accent-500">{description}</p> : null}
      </header>
      {empty ? (
        <div className="flex min-h-[220px] items-center justify-center rounded-xl bg-primary-50/60 px-4 text-center">
          <p className="text-sm text-accent-500">{emptyMessage}</p>
        </div>
      ) : (
        children
      )}
    </section>
  );
}
