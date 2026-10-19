import { getImageProps } from "next/image";

/**
 * CSS `background-image` value for a photo in /public, served through Next's
 * image optimizer: a resized WebP/AVIF copy instead of the original file.
 * Several photos in /public are 1–12 MB (the aerial views, nyungwe_sky), so
 * this is what keeps pages that use them as backgrounds fast.
 *
 *   style={{ backgroundImage: optimizedBg("/backgrounds/nyungwe_sky.jpg") }}
 *
 * `width` is the display width the copy is made for. Sharp (2x) screens get a
 * larger copy, up to 1920px wide: plenty for a photo behind text and overlays,
 * and it keeps phones from downloading a 4K file. A missing file still just
 * shows the colour behind it.
 */
export function optimizedBg(src: string, width = 1920): string {
  if (!src) return "none";
  if (!src.startsWith("/")) return `url("${src}")`;
  const { props } = getImageProps({ src, alt: "", width, height: width, quality: 75 });
  const maxWidth = Math.max(width, 1920);
  const candidates = (props.srcSet ?? "")
    .split(", ")
    .filter(Boolean)
    .map((entry) => entry.split(" "))
    .filter(([url]) => Number(new URL(url, "http://x").searchParams.get("w")) <= maxWidth)
    .map(([url, density]) => `url("${url}") ${density}`);
  return candidates.length ? `image-set(${candidates.join(", ")})` : `url("${props.src}")`;
}

/** Branded stand-in for an event or season photo whose file is missing. */
export const FALLBACK_IMAGE = "/images/activities/generic-placeholder.jpg";

/**
 * Like optimizedBg, with FALLBACK_IMAGE as a second layer underneath. A photo that
 * loads covers it; a missing one leaves the branded placeholder showing instead of
 * an empty panel. Use it for photos that come from the JSON, not fixed backgrounds.
 */
export function optimizedBgWithFallback(src: string, width = 1920): string {
  const fallback = optimizedBg(FALLBACK_IMAGE, width);
  return !src || src === FALLBACK_IMAGE ? fallback : `${optimizedBg(src, width)}, ${fallback}`;
}
