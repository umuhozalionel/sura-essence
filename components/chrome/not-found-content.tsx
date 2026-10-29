"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

/**
 * The 404 message, in the visitor's language, with a way back to `homeHref`.
 * A client component on purpose: as a server component in a not-found.tsx it
 * reads the locale from the request, which turns every page beside it dynamic.
 */
export function NotFoundContent({ homeHref = "/" }: { homeHref?: string }) {
  const t = useTranslations("NotFound");

  return (
    <section className="min-h-screen flex flex-col items-center justify-center gap-6 px-6 text-center bg-foreground text-white">
      <span className="text-xs font-bold uppercase tracking-widest text-secondary">404</span>
      <h1 className="text-3xl md:text-5xl font-extrabold uppercase tracking-tight">{t("title")}</h1>
      <p className="text-sm text-white/70 max-w-md">{t("description")}</p>
      <Link
        href={homeHref}
        className="inline-flex min-h-12 items-center px-6 py-3 rounded-2xl bg-primary-on-dark hover:bg-card hover:text-foreground text-primary-on-dark-foreground text-xs font-bold uppercase tracking-widest transition-colors"
      >
        {t("backHome")}
      </Link>
    </section>
  );
}
