import React from "react";
import { cn } from "@/lib/utils";

/**
 * The SURA mark from /brand/sura-logo.png. That file is a wide canvas with the
 * mark in the middle, so it's cropped here to fill a small square; in dark
 * mode the black mark is inverted to white. If the logo file changes, check
 * backgroundSize/backgroundPosition.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("block shrink-0 bg-no-repeat dark:invert", className)}
      style={{ backgroundImage: "url(/brand/sura-logo.png)", backgroundSize: "380% auto", backgroundPosition: "50% 30%" }}
    />
  );
}
