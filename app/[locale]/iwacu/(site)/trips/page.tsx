import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { TripsBrowser, type TripsView } from "@/components/trips/trips-browser";
import { Link } from "@/i18n/navigation";
import { pageMetadata } from "@/lib/brands/metadata";
import { getSiteTrips } from "@/lib/cms/trips-server";
import { TRIP_CATEGORIES } from "@/lib/trips";

export const generateMetadata = pageMetadata("Brands.iwacu.meta", "trips");

/** /iwacu/trips: every place, or one category. From Admin → Trips. Trips open for booking can be built and reserved; the rest hold their place. */
export default async function TripsPage({ params, searchParams }: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Trips");
  const { category } = await searchParams;
  const trips = await getSiteTrips(locale);
  // Everything, unless the address asks for one category.
  const initial: TripsView = TRIP_CATEGORIES.find((c) => c.id === category)?.id ?? "all";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <section className="relative h-[40vh] min-h-[300px] pt-[var(--header-h)] flex items-center justify-center overflow-hidden bg-foreground">
        <Image src="/backgrounds/winding-road.jpg" alt="" fill priority sizes="100vw" className="object-cover" />
        <span aria-hidden="true" className="absolute inset-0 bg-black/45" />
        <div className="relative z-10 text-center px-6 md:px-10 max-w-5xl mx-auto flex flex-col items-center gap-3">
          <h1 className="text-4xl md:text-6xl font-extrabold text-white uppercase tracking-tighter leading-[0.95]">{t("list.title")}</h1>
          <p className="text-white font-medium text-sm md:text-base max-w-2xl leading-relaxed">{t("list.intro")}</p>
        </div>
      </section>

      <TripsBrowser initial={initial} trips={trips} />

      <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-10 md:py-12">
        <section className="rounded-2xl bg-foreground p-6 md:p-8 text-white flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl">
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight leading-tight">{t("list.customTitle")}</h2>
            <p className="mt-2 text-sm text-white/75 leading-relaxed">{t("list.customText")}</p>
          </div>
          <Link href="/iwacu/reserve?tab=custom" className="shrink-0 h-12 px-6 rounded-xl bg-primary hover:bg-primary-hover text-white font-extrabold uppercase tracking-widest text-xs inline-flex items-center justify-center gap-2 transition-colors">
            {t("list.customCta")} <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </section>
      </div>
    </div>
  );
}
