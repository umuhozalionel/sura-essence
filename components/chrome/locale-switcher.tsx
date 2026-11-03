"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Globe } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

// Language chooser: a globe and the current language, opening a small menu of each
// language by its own name. Keeps the visitor on the same page, e.g. /en/contact ⇄ /fr/contact.
// `solid` follows the header: over a photo or video it turns to frosted glass.
export function LocaleSwitcher({ solid = true, className = "" }: { solid?: boolean; className?: string }) {
  const t = useTranslations("LocaleSwitcher");
  const locale = useLocale();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={root} className={`relative ${className}`}>
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={`${t("label")}: ${t(locale)}`}
        onClick={() => setOpen(!open)}
        className={`inline-flex min-h-12 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-colors duration-300 ${
          solid
            ? "border-border bg-muted/40 text-foreground hover:bg-muted/70"
            : "border-white/25 bg-white/10 text-white backdrop-blur-md hover:bg-white/20"
        }`}
      >
        <Globe className="h-4 w-4" aria-hidden="true" />
        <span className="uppercase sm:hidden">{locale}</span>
        <span className="hidden sm:inline">{t(locale)}</span>
        <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            className="absolute right-0 top-full z-50 mt-2 w-44 origin-top-right overflow-hidden rounded-2xl border border-white/15 bg-foreground p-1.5 text-white shadow-xl"
          >
            {routing.locales.map((l) => (
              <li key={l}>
                <Link
                  href={pathname}
                  locale={l}
                  lang={l}
                  aria-current={l === locale ? "true" : undefined}
                  onClick={() => setOpen(false)}
                  className={`flex min-h-11 items-center justify-between gap-3 rounded-xl px-3 text-sm font-medium transition-colors hover:bg-white/10 ${
                    l === locale ? "text-white" : "text-white/70"
                  }`}
                >
                  {t(l)}
                  {l === locale && <Check className="h-4 w-4 text-secondary" aria-hidden="true" />}
                </Link>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
