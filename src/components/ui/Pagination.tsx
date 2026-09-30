"use client";

import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import Link from "next/link";

type PaginationProps = {
  page: number;
  pages: number;
  total?: number;
  className?: string;
  /** Prefetched URLs for server-rendered link pagination (must be strings, not functions). */
  prevHref?: string;
  nextHref?: string;
  /** Client-side navigation (e.g. dashboard tables). */
  onPageChange?: (page: number) => void;
};

const linkBtnClass =
  "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200 ease-out px-3 py-1.5 text-sm min-h-9 border border-primary-300 text-primary-800 hover:bg-primary-50";

export function Pagination({
  page,
  pages,
  total,
  className,
  prevHref,
  nextHref,
  onPageChange,
}: PaginationProps) {
  if (pages <= 1) return null;

  const prevDisabled = page <= 1;
  const nextDisabled = page >= pages;
  const linkMode = prevHref != null || nextHref != null;

  return (
    <nav
      aria-label="Pagination"
      className={cn("flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3", className)}
    >
      <p className="text-sm text-accent-500">
        Page {page} of {pages}
        {typeof total === "number" ? <span className="text-accent-400"> · {total} total</span> : null}
      </p>
      <div className="flex items-center gap-2">
        {linkMode ? (
          <>
            {prevDisabled || !prevHref ? (
              <span className={cn(linkBtnClass, "opacity-50 pointer-events-none")} aria-disabled>
                Previous
              </span>
            ) : (
              <Link href={prevHref} className={linkBtnClass}>
                Previous
              </Link>
            )}
            {nextDisabled || !nextHref ? (
              <span className={cn(linkBtnClass, "opacity-50 pointer-events-none")} aria-disabled>
                Next
              </span>
            ) : (
              <Link href={nextHref} className={linkBtnClass}>
                Next
              </Link>
            )}
          </>
        ) : (
          <>
            <Button
              variant="outline"
              size="sm"
              disabled={prevDisabled}
              onClick={() => onPageChange?.(page - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={nextDisabled}
              onClick={() => onPageChange?.(page + 1)}
            >
              Next
            </Button>
          </>
        )}
      </div>
    </nav>
  );
}
