"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

// EN | FR switch. Keeps the visitor on the same page, e.g. /en/contact ⇄ /fr/contact.
// `solid` follows the header: over the hero image it turns into a frosted white pill.
export function LocaleSwitcher({ solid = true, className = "" }: { solid?: boolean; className?: string }) {
  const t = useTranslations("LocaleSwitcher");
  const locale = useLocale();
  const pathname = usePathname();

  return (
    <div
      role="group"
      aria-label={t("label")}
      className={`flex items-center rounded-lg border p-0.5 transition-colors duration-300 ${
        solid
          ? "border-border bg-muted/40"
          : "border-white/25 bg-white/10 backdrop-blur-md"
      } ${className}`}
    >
      {routing.locales.map((l) => (
        <Link
          key={l}
          href={pathname}
          locale={l}
          lang={l}
          title={t(l)}
          aria-label={t(l)}
          aria-current={l === locale ? "true" : undefined}
          className={`inline-flex min-h-12 min-w-12 items-center justify-center px-2.5 py-1.5 rounded-md text-xs font-bold uppercase tracking-wide transition-colors ${
            l === locale
              ? solid
                ? "bg-card text-primary shadow-sm"
                : "bg-card text-foreground shadow-sm"
              : solid
                ? "text-muted-foreground hover:text-foreground"
                : "text-white/75 hover:text-white"
          }`}
        >
          {l}
        </Link>
      ))}
    </div>
  );
}
