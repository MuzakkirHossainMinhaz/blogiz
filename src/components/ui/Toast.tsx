"use client";

import { MOTION_DURATION, MOTION_EASE, usePrefersReducedMotion } from "@/components/motion";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { FiAlertCircle, FiCheckCircle, FiInfo, FiX } from "react-icons/fi";

export type ToastTone = "success" | "error" | "info";

type ToastInput = {
  title?: string;
  description: string;
  tone?: ToastTone;
  durationMs?: number;
};

type ToastItem = ToastInput & {
  id: string;
  tone: ToastTone;
  durationMs: number;
};

type ToastContextValue = {
  toast: (input: ToastInput | string) => string;
  success: (description: string, title?: string) => string;
  error: (description: string, title?: string) => string;
  info: (description: string, title?: string) => string;
  dismiss: (id: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const DEFAULT_DURATION: Record<ToastTone, number> = {
  success: 3200,
  error: 4800,
  info: 3600,
};

const toneStyles: Record<
  ToastTone,
  { shell: string; icon: string; Icon: typeof FiCheckCircle }
> = {
  success: {
    shell: "border-green-200 bg-green-50 text-green-900",
    icon: "text-green-700",
    Icon: FiCheckCircle,
  },
  error: {
    shell: "border-red-200 bg-red-50 text-red-900",
    icon: "text-red-700",
    Icon: FiAlertCircle,
  },
  info: {
    shell: "border-primary-200 bg-primary-50 text-primary-900",
    icon: "text-primary-700",
    Icon: FiInfo,
  },
};

function normalizeInput(input: ToastInput | string): ToastItem {
  const base = typeof input === "string" ? { description: input } : input;
  const tone = base.tone ?? "info";
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: base.title,
    description: base.description,
    tone,
    durationMs: base.durationMs ?? DEFAULT_DURATION[tone],
  };
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return ctx;
}

function ToastCard({
  item,
  onDismiss,
}: {
  item: ToastItem;
  onDismiss: (id: string) => void;
}) {
  const reduceMotion = usePrefersReducedMotion();
  const styles = toneStyles[item.tone];
  const Icon = styles.Icon;

  useEffect(() => {
    if (item.durationMs <= 0) return;
    const timer = window.setTimeout(() => onDismiss(item.id), item.durationMs);
    return () => window.clearTimeout(timer);
  }, [item.durationMs, item.id, onDismiss]);

  return (
    <motion.div
      layout
      role={item.tone === "error" ? "alert" : "status"}
      aria-live={item.tone === "error" ? "assertive" : "polite"}
      className={cn(
        "pointer-events-auto flex w-[min(22rem,calc(100vw-2rem))] items-start gap-3 rounded-2xl border px-4 py-3 shadow-soft-lg",
        styles.shell
      )}
      initial={reduceMotion ? false : { opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={reduceMotion ? undefined : { opacity: 0, y: 6, scale: 0.98 }}
      transition={{ duration: MOTION_DURATION.base, ease: MOTION_EASE }}
    >
      <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", styles.icon)} aria-hidden />
      <div className="min-w-0 flex-1">
        {item.title ? <p className="text-sm font-semibold tracking-tight">{item.title}</p> : null}
        <p className={cn("text-sm leading-relaxed", item.title ? "mt-0.5 opacity-90" : "")}>
          {item.description}
        </p>
      </div>
      <button
        type="button"
        onClick={() => onDismiss(item.id)}
        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-current/70 transition-colors hover:bg-black/5 hover:text-current"
        aria-label="Dismiss notification"
      >
        <FiX className="h-4 w-4" />
      </button>
    </motion.div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  const toast = useCallback((input: ToastInput | string) => {
    const item = normalizeInput(input);
    setItems((current) => [...current, item].slice(-4));
    return item.id;
  }, []);

  const api = useMemo<ToastContextValue>(
    () => ({
      toast,
      success: (description, title) => toast({ description, title, tone: "success" }),
      error: (description, title) => toast({ description, title, tone: "error" }),
      info: (description, title) => toast({ description, title, tone: "info" }),
      dismiss,
    }),
    [dismiss, toast]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[100] flex flex-col items-end gap-2 p-4 sm:p-6"
        aria-label="Notifications"
      >
        <AnimatePresence mode="popLayout">
          {items.map((item) => (
            <ToastCard key={item.id} item={item} onDismiss={dismiss} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
