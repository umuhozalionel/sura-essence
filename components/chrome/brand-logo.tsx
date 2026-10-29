import Image from "next/image";
import { getBrand, type BrandId } from "@/lib/brands";

/**
 * The brand's mark, from the logo file in lib/brands. Movana and Iwacu use
 * placeholder SVG wordmarks (public/brand/<id>-logo.svg) until the real files
 * replace them; a brand with `{ type: "wordmark" }` draws its name as text.
 *
 * `tone`: "dark" for light surfaces, "light" for photos and dark surfaces.
 * `size`: "header" (28/32px tall) or "footer" (48px tall).
 */
export function BrandLogo({
  brand,
  tone,
  size = "header",
  preload = false,
}: {
  brand: BrandId;
  tone: "dark" | "light";
  size?: "header" | "footer";
  preload?: boolean;
}) {
  const config = getBrand(brand);

  if (config.logo.type === "image") {
    return (
      <span className={`relative block ${size === "footer" ? "h-12 w-40" : "h-7 w-28 md:h-8 md:w-32"}`}>
        <Image
          src={config.logo.src}
          alt={config.logo.alt}
          fill
          sizes={size === "footer" ? "160px" : "(min-width: 768px) 128px, 112px"}
          className={`object-contain object-left transition-[filter] duration-300 ${
            tone === "dark" ? "brightness-0" : "brightness-0 invert"
          }`}
          preload={preload}
        />
      </span>
    );
  }

  return (
    <span
      className={`flex items-baseline gap-1.5 whitespace-nowrap font-display leading-none transition-colors duration-300 ${
        tone === "dark" ? "text-foreground" : "text-white"
      } ${size === "footer" ? "text-3xl" : "text-xl md:text-2xl"}`}
    >
      <span className="text-[0.55em] font-bold uppercase tracking-widest opacity-70">SURA</span>
      <span className="font-extrabold tracking-tight">{config.shortName}</span>
    </span>
  );
}
