"use client";

import { useEffect } from "react";

const LOCK_CLASS = "modal-scroll-lock";

function isScrollAllowed(target: EventTarget | null) {
  if (!(target instanceof Element)) return false;
  if (target.closest("[data-modal-scroll]")) return true;
  // Allow typing / caret keys inside form fields outside the dialog shell.
  return Boolean(target.closest("input, textarea, select, [contenteditable='true']"));
}

/**
 * Freeze background scroll while a dialog is open.
 *
 * Do not set `overflow: hidden` on `html` or `position: fixed` on `body`:
 * - overflow on `html` breaks `position: sticky` (dashboard nav slides away)
 * - fixed body with negative top shifts sticky chrome off-screen
 */
export function useBodyScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return;

    const html = document.documentElement;
    const { body } = document;
    const scrollY = window.scrollY;
    const scrollbarWidth = window.innerWidth - html.clientWidth;
    const previousPaddingRight = body.style.paddingRight;

    html.classList.add(LOCK_CLASS);
    if (scrollbarWidth > 0) {
      body.style.paddingRight = `${scrollbarWidth}px`;
    }

    const onWheel = (event: WheelEvent) => {
      if (!isScrollAllowed(event.target)) event.preventDefault();
    };

    const onTouchMove = (event: TouchEvent) => {
      if (!isScrollAllowed(event.target)) event.preventDefault();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      const keys = new Set(["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "]);
      if (!keys.has(event.key)) return;
      if (isScrollAllowed(event.target)) return;
      event.preventDefault();
    };

    const onScroll = () => {
      if (window.scrollY !== scrollY) window.scrollTo(0, scrollY);
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("scroll", onScroll);
      html.classList.remove(LOCK_CLASS);
      body.style.paddingRight = previousPaddingRight;
    };
  }, [locked]);
}
