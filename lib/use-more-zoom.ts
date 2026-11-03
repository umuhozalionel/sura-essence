"use client";

import { useEffect, type RefObject } from "react";

// The same rule as the .more-zoom block in app/globals.css: keep the two in step.
const ZOOM_QUERY = "(prefers-reduced-motion: no-preference) and (min-width: 64rem)";

const clamp = (p: number) => Math.min(1, Math.max(0, p));

/** Scales a box up as it enters. Fully entered, it keeps no transform, so nothing stays trapped inside it. */
function zoomIn(box: HTMLElement, p: number) {
  box.style.transform = p < 1 ? `scale(${0.88 + 0.12 * p})` : "";
  box.style.borderRadius = p < 1 ? `${2 * (1 - p)}rem` : "";
}

/**
 * While `active`, every .more-zoom box under `root` scales up as it scrolls into
 * view. Done in script because Firefox doesn't run CSS scroll-driven animations.
 * Reduced motion and phones get a normal stack.
 */
export function useMoreZoom(root: RefObject<HTMLElement | null>, active: boolean) {
  useEffect(() => {
    if (!active || !root.current) return;
    const media = window.matchMedia(ZOOM_QUERY);
    const boxes = [...root.current.querySelectorAll<HTMLElement>(".more-zoom")];
    let frame = 0;

    const apply = () => {
      frame = 0;
      const screen = window.innerHeight;
      // Measuring the top edge is safe while scaled: boxes scale from their top.
      for (const box of boxes) zoomIn(box, media.matches ? clamp((screen - box.getBoundingClientRect().top) / (0.7 * screen)) : 1);
    };
    const schedule = () => {
      frame ||= requestAnimationFrame(apply);
    };

    apply();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    media.addEventListener("change", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      media.removeEventListener("change", schedule);
      for (const box of boxes) zoomIn(box, 1);
    };
  }, [root, active]);
}
