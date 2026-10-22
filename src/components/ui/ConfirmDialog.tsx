"use client";

import { Button } from "@/components/ui/Button";
import { MOTION_DURATION, MOTION_EASE, usePrefersReducedMotion } from "@/components/motion";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "primary";
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "primary",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const reduceMotion = usePrefersReducedMotion();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useBodyScrollLock(open);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onCancel]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="presentation">
          <motion.button
            type="button"
            className="absolute inset-0 bg-ink/35 backdrop-blur-[1px]"
            aria-label="Close Dialog"
            onClick={onCancel}
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0 }}
            transition={{ duration: MOTION_DURATION.fast }}
          />
          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
            aria-describedby="confirm-dialog-message"
            data-modal-scroll
            className="relative max-h-[min(90dvh,40rem)] w-full max-w-md overflow-y-auto overscroll-contain rounded-2xl border border-neutral-200 bg-surface p-5 shadow-soft-lg sm:p-6"
            initial={reduceMotion ? false : { opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: MOTION_DURATION.base, ease: MOTION_EASE }}
          >
            <h2 id="confirm-dialog-title" className="font-display text-lg font-semibold text-ink">
              {title}
            </h2>
            <p id="confirm-dialog-message" className="mt-2 text-sm text-accent-500">
              {message}
            </p>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
              <Button type="button" variant="outline" onClick={onCancel} className="w-full sm:w-auto">
                {cancelLabel}
              </Button>
              <Button
                type="button"
                variant={tone === "danger" ? "outline" : "primary"}
                onClick={onConfirm}
                className={
                  tone === "danger"
                    ? "w-full sm:w-auto border-red-300 text-red-700 hover:bg-red-50"
                    : "w-full sm:w-auto"
                }
              >
                {confirmLabel}
              </Button>
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body
  );
}
