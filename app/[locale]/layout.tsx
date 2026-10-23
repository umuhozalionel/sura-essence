import type { Metadata } from "next";
import { Toaster } from "sonner";
import { notFound } from "next/navigation";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { manrope } from "@/lib/fonts";
import { SiteChrome } from "@/components/site-chrome";
import { PricingProvider } from "@/components/pricing-provider";
import { getActivePricing } from "@/lib/cms/pricing-config-server";
import "../globals.css";

type Props = Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>;

// Build both /en and /fr versions of every page ahead of time.
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Omit<Props, "children">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });

  return {
    title: t("title"),
    description: t("description"),
    generator: "Bravonet technologies",
    icons: {
      icon: "/brand/sura-logo.png",
      apple: "/brand/sura-logo.png",
      shortcut: "/brand/sura-logo.png",
    },
    // No `alternates` needed: proxy.ts already tells Google that /en/x and /fr/x are the same page.
  };
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  // Lets pages in this language be rendered statically
  setRequestLocale(locale);
  const t = await getTranslations("Layout");
  // Active rates from pricing_config, or DEFAULT_PRICING if the database can't answer (never throws).
  const { config, revision } = await getActivePricing();

  return (
    // No smooth scrolling on <html>: Next.js would animate every route change from
    // the old scroll position back to the top. In-page scrolls ask for it themselves.
    <html lang={locale} className={manrope.variable}>
      {/* Body is now transparent/base to allow child backgrounds to fill the screen */}
      <body className={`${manrope.className} min-h-screen w-full text-foreground antialiased selection:bg-primary/20`}>
        <NextIntlClientProvider>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:bg-card focus:text-primary focus:px-3 focus:py-2 focus:rounded-xl z-[80] border border-border shadow-xl"
          >
            {t("skipToContent")}
          </a>

          {/* Header and footer live here, so they stay mounted between pages. */}
          <PricingProvider value={{ config, revision }}>
            <SiteChrome>{children}</SiteChrome>
          </PricingProvider>

          <Toaster position="top-center" richColors closeButton />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
