"use client";

import { MOTION_DURATION, MOTION_EASE, usePrefersReducedMotion } from "@/components/motion/reduced-motion";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface PageEnterProps {
  children: ReactNode;
  className?: string;
}

/** Shared enter for auth panels and dashboard shells. */
export function PageEnter({ children, className }: PageEnterProps) {
  const reduceMotion = usePrefersReducedMotion();

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={cn(className)}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: MOTION_DURATION.slow, ease: MOTION_EASE }}
    >
      {children}
    </motion.div>
  );
}
