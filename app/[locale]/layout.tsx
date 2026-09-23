import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import { Toaster } from "sonner";
import { notFound } from "next/navigation";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import "../globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-manrope",
});

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

  return (
    <html lang={locale} className="scroll-smooth">
      {/* Body is now transparent/base to allow child backgrounds to fill the screen */}
      <body className={`${manrope.className} min-h-screen w-full text-[#0A1128] antialiased selection:bg-[#125740]/20`}>
        <NextIntlClientProvider>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:bg-white focus:text-[#125740] focus:px-3 focus:py-2 focus:rounded-xl z-50 border border-gray-100 shadow-xl"
          >
            {t("skipToContent")}
          </a>

          <main id="main" className="w-full min-h-screen">
            {children}
          </main>

          <Toaster position="top-center" richColors closeButton />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
