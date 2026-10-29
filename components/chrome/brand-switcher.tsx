"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { BRAND_IDS, getBrand, type BrandId } from "@/lib/brands";

/**
 * SURA Essence · Movana · Iwacu, with the current one marked.
 *
 * `bar`: slim text links in the alert bar, wide screens only (mouse pointers;
 *        the bar is 36px tall, so these are shorter than the 48px touch rule).
 * `menu`: full 48px rows at the top of the mobile menu, where touch happens.
 */
export function BrandSwitcher({
  current,
  variant,
  solid = true,
  onNavigate,
}: {
  current: BrandId;
  variant: "bar" | "menu";
  solid?: boolean;
  onNavigate?: () => void;
}) {
  const t = useTranslations("Brands.switcher");

  if (variant === "bar") {
    return (
      <nav aria-label={t("label")} className="flex items-center h-full">
        {BRAND_IDS.map((id, i) => (
          <span key={id} className="flex items-center h-full">
            {i > 0 && <span aria-hidden="true" className="px-1.5 text-white/30">·</span>}
            <Link
              href={getBrand(id).homeHref}
              aria-current={id === current ? "true" : undefined}
              className={`flex h-full items-center text-xs font-bold uppercase tracking-widest transition-colors ${
                id === current
                  ? "text-secondary"
                  : solid
                    ? "text-white/60 hover:text-white"
                    : "text-white/85 hover:text-white drop-shadow-[0_1px_6px_rgba(0,0,0,0.8)]"
              }`}
            >
              {getBrand(id).shortName}
            </Link>
          </span>
        ))}
      </nav>
    );
  }

  return (
    <nav aria-label={t("label")} className="grid grid-cols-3 gap-2">
      {BRAND_IDS.map((id) => (
        <Link
          key={id}
          href={getBrand(id).homeHref}
          onClick={onNavigate}
          aria-current={id === current ? "true" : undefined}
          className={`flex min-h-12 items-center justify-center rounded-lg border px-2 text-xs font-bold uppercase tracking-wide text-center transition-colors ${
            id === current
              ? "border-primary bg-primary/5 text-primary"
              : "border-border bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-card"
          }`}
        >
          {getBrand(id).shortName}
        </Link>
      ))}
    </nav>
  );
}
