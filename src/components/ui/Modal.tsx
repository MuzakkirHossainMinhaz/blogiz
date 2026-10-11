"use client";

import { MOTION_DURATION, MOTION_EASE, usePrefersReducedMotion } from "@/components/motion";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useId, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { FiX } from "react-icons/fi";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  /** Dialog size. Default `md`. */
  size?: "sm" | "md" | "lg";
  className?: string;
};

const SIZES = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-xl",
} as const;

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  size = "md",
  className,
}: ModalProps) {
  const reduceMotion = usePrefersReducedMotion();
  const [mounted, setMounted] = useState(false);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    setMounted(true);
  }, []);

  useBodyScrollLock(open);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="presentation">
          <motion.button
            type="button"
            className="absolute inset-0 bg-ink/35 backdrop-blur-[1px]"
            aria-label="Close dialog"
            onClick={onClose}
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0 }}
            transition={{ duration: MOTION_DURATION.fast }}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={description ? descriptionId : undefined}
            data-modal-scroll
            className={cn(
              "relative flex max-h-[min(90dvh,40rem)] w-full flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-surface shadow-soft-lg",
              SIZES[size],
              className
            )}
            initial={reduceMotion ? false : { opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: MOTION_DURATION.base, ease: MOTION_EASE }}
          >
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-neutral-100 px-5 py-4 sm:px-6">
              <div className="min-w-0">
                <h2 id={titleId} className="font-display text-lg font-semibold tracking-tight text-ink">
                  {title}
                </h2>
                {description ? (
                  <p id={descriptionId} className="mt-0.5 text-sm text-accent-500">
                    {description}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-accent-500 transition-colors hover:bg-neutral-100 hover:text-ink"
                aria-label="Close"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6 sm:py-6">
              {children}
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body
  );
}
