"use client";

import { useEffect } from "react";

// How many overlays currently hold the lock, and the page's own overflow value
// from before the first one took it.
let holders = 0;
let previousOverflow = "";

/**
 * Stops the page behind a menu, sheet or modal from scrolling while `locked`.
 *
 * The lock is counted, so two overlays open at once (e.g. a lightbox over a
 * sheet) only release the page when the last one closes. The scrollbar's room
 * stays reserved by `scrollbar-gutter: stable` on <html> (app/globals.css), so
 * the page doesn't slide sideways when the scrollbar disappears.
 */
export function useScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return;
    const root = document.documentElement;
    if (holders === 0) {
      previousOverflow = root.style.overflow;
      root.style.overflow = "hidden";
    }
    holders += 1;
    return () => {
      holders -= 1;
      if (holders === 0) root.style.overflow = previousOverflow;
    };
  }, [locked]);
}
