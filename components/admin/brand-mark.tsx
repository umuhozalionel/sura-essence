import React from "react";
import { cn } from "@/lib/utils";

/**
 * The SURA mark from /brand/sura-logo.png, filling a small square: the file is
 * cropped to the logo (979×359), so it's scaled up a little and centred, which
 * trims the outer letters as before. In dark mode the mark is inverted to white.
 * If the logo file changes, check backgroundSize/backgroundPosition.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("block shrink-0 bg-no-repeat dark:invert", className)}
      style={{ backgroundImage: "url(/brand/sura-logo.png)", backgroundSize: "132% auto", backgroundPosition: "50% 50%" }}
    />
  );
}
