import { cn } from "@/lib/utils";

/** Shared control chrome so inputs, selects, and textareas match the app theme. */
export function controlClassName({
  error,
  withIcon,
  withTrailing,
  className,
}: {
  error?: boolean;
  withIcon?: boolean;
  withTrailing?: boolean;
  className?: string;
} = {}) {
  return cn(
    "w-full border rounded-lg bg-white font-medium text-base transition-all duration-200 appearance-none",
    "focus:outline-none focus:ring-2 focus:border-transparent",
    "disabled:opacity-50 disabled:cursor-not-allowed",
    "placeholder:text-neutral-400",
    withIcon ? "pl-10" : "pl-4",
    withTrailing ? "pr-12" : "pr-4",
    "py-3",
    error
      ? "border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500"
      : "border-neutral-300 text-neutral-900 focus:ring-primary-500",
    className
  );
}

export const fieldLabelClassName = "block text-sm font-medium text-neutral-700 mb-2";
export const fieldErrorClassName = "mt-1 text-sm text-red-600";
