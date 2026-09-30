import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type DashboardPageHeaderProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
};

/** Shared page title + subtitle for dashboard screens. */
export function DashboardPageHeader({ title, description, actions, className }: DashboardPageHeaderProps) {
  return (
    <header
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between",
        className
      )}
    >
      <div className="min-w-0">
        <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-ink">{title}</h1>
        {description ? <p className="mt-1 text-sm sm:text-base text-accent-500">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2 sm:gap-3 shrink-0">{actions}</div> : null}
    </header>
  );
}
