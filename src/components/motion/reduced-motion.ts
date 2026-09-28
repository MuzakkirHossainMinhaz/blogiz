"use client";

import { useReducedMotion as useFramerReducedMotion } from "framer-motion";

/** Prefer Framer's hook; treat null (SSR) as motion allowed. */
export function usePrefersReducedMotion(): boolean {
  return useFramerReducedMotion() ?? false;
}

export const MOTION_EASE = [0.22, 1, 0.36, 1] as const;

export const MOTION_DURATION = {
  fast: 0.15,
  base: 0.28,
  slow: 0.4,
} as const;
