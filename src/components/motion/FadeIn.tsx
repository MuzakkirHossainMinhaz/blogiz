"use client";

import { MOTION_DURATION, MOTION_EASE, usePrefersReducedMotion } from "@/components/motion/reduced-motion";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface FadeInProps {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}

export function FadeIn({ children, delay = 0, y = 12, className }: FadeInProps) {
  const reduceMotion = usePrefersReducedMotion();

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={cn(className)}
      initial={{ opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: MOTION_DURATION.base, delay, ease: MOTION_EASE }}
    >
      {children}
    </motion.div>
  );
}
