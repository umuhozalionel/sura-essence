"use client";

import Image from "next/image";
import { ArrowRight, Check, Landmark, Mountain, Trees, Waves, Building2, type LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { IwacuHero } from "@/components/iwacu-hero";
import { ActivitiesSection, type HomeEvent } from "@/components/activities-section";
import { GallerySection, type HomeTrip } from "@/components/gallery-section";
import { SeamlessStaySection } from "@/components/seamless-stay-section";
import { Testimonials } from "@/components/testimonials";
import type { IwacuSpotlight } from "@/lib/cms/site-data";
import type { SiteCollection } from "@/lib/cms/site-shapes";
import { TRIP_CATEGORIES, type TripCategoryId } from "@/lib/trips";

/** Just what the teaser reads from a tour collection (CMS or Tours.collections). */
type TeaserCollection = Pick<SiteCollection, "id" | "category"> & {
  intro: Pick<SiteCollection["intro"], "image" | "headline">;
  venues: unknown[];
};

const CATEGORY_ICONS: Record<TripCategoryId, LucideIcon> = {
  parks: Trees,
  memorials: Landmark,
  lakes: Waves,
  mountains: Mountain,
  culture: Building2,
};

/** Akagera, the trip open today, beside the five categories on /iwacu/trips. */
function TripsTeaser({ counts }: { counts: Record<string, number> }) {
  const t = useTranslations("Brands.iwacu.home.trips");
  const tTrips = useTranslations("Trips");

  return (
    <section id="trips" className="py-12 md:py-16 bg-background text-foreground">
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 flex flex-col gap-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl flex flex-col gap-2">
            <span className="text-primary text-xs font-extrabold uppercase tracking-widest">{t("eyebrow")}</span>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight leading-tight">{t("title")}</h2>
            <p className="text-muted-foreground text-sm md:text-base leading-relaxed">{t("intro")}</p>
          </div>
          <Link href="/iwacu/trips" className="group inline-flex min-h-12 items-center gap-2 self-start md:self-auto text-sm font-extrabold text-primary">
            {t("all")} <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
          </Link>
        </div>

        <div className="grid gap-5 lg:grid-cols-12">
          <Link href="/iwacu/trips/akagera" className="group relative flex min-h-80 flex-col justify-end overflow-hidden rounded-2xl bg-foreground p-6 md:p-8 text-white shadow-lg shadow-black/5 lg:col-span-7">
            <Image src="/backgrounds/akagera.jpg" alt="" fill sizes="(min-width: 1024px) 58vw, 100vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />
            <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-foreground/90 via-foreground/30 to-transparent" />
            <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-xs font-extrabold text-white">
              <Check className="h-3.5 w-3.5" aria-hidden="true" /> {tTrips("list.open")}
            </span>
            <span className="relative text-2xl md:text-3xl font-extrabold tracking-tight leading-tight">{tTrips("akagera.name")}</span>
            <span className="relative mt-2 max-w-xl text-sm md:text-base text-white/85">{tTrips("akagera.summary")}</span>
            <span className="relative mt-4 inline-flex items-center gap-2 text-sm font-extrabold text-secondary">
              {tTrips("list.build")} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </span>
          </Link>

          <nav aria-label={t("categoriesLabel")} className="lg:col-span-5">
            <ul className="flex h-full flex-col gap-2">
              {TRIP_CATEGORIES.map(({ id }) => {
                const Icon = CATEGORY_ICONS[id];
                return (
                  <li key={id} className="flex-1">
                    <Link href={`/iwacu/trips?category=${id}`} className="group flex h-full min-h-14 items-center gap-4 rounded-2xl bg-card px-4 py-3 ring-1 ring-black/5 transition-shadow hover:shadow-lg hover:ring-primary/40">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm md:text-base font-extrabold leading-snug text-foreground">{tTrips(`categories.${id}`)}</span>
                        <span className="block text-xs text-muted-foreground">{t("placeCount", { count: counts[id] ?? 0 })}</span>
                      </span>
                      <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" aria-hidden="true" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </div>
    </section>
  );
}

/** One card per Kigali tour collection, each opening the tours page on that collection. */
function KigaliToursTeaser({ collections: fromCms }: { collections?: TeaserCollection[] }) {
  const t = useTranslations("Brands.iwacu.home.tours");
  const tTours = useTranslations("Tours");
  const collections = fromCms ?? (tTours.raw("collections") as TeaserCollection[]);

  return (
    <section id="kigali-tours" className="py-12 md:py-16 bg-background text-foreground">
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 flex flex-col gap-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl flex flex-col gap-2">
            <span className="text-primary text-xs font-extrabold uppercase tracking-widest">{t("eyebrow")}</span>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight leading-tight">{t("title")}</h2>
            <p className="text-muted-foreground text-sm md:text-base leading-relaxed">{t("intro")}</p>
          </div>
          <Link href="/iwacu/kigali-tours" className="group inline-flex min-h-12 items-center gap-2 self-start md:self-auto text-sm font-extrabold text-primary">
            {t("all")} <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
          </Link>
        </div>

        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {collections.map((c) => (
            <li key={c.id}>
              <Link
                href={`/iwacu/kigali-tours?category=${c.id}`}
                className="group relative flex aspect-[5/4] flex-col justify-end overflow-hidden rounded-2xl bg-foreground p-5 text-white"
              >
                <Image
                  src={c.intro.image}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105 motion-reduce:transition-none"
                />
                <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-foreground/90 via-foreground/30 to-transparent" />
                <span className="relative text-xs font-extrabold text-secondary">{t("placeCount", { count: c.venues.length })}</span>
                <span className="relative mt-1 text-xl font-extrabold tracking-tight leading-tight">{c.category}</span>
                <span className="relative mt-1 text-sm text-white/80 line-clamp-2">{c.intro.headline}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/**
 * The SURA Iwacu home, in the menu's order. `promoted`/`next` lead the hero; `upcoming`,
 * `past`, `trips` and `collections` come from the CMS, and without them each section
 * reads messages/*.json.
 */
export function IwacuHomeView({ promoted, next, upcoming, past, trips, collections, tripCounts }: {
  tripCounts: Record<string, number>;
  promoted: IwacuSpotlight | null;
  next: IwacuSpotlight | null;
  upcoming?: HomeEvent[];
  past?: HomeEvent[];
  trips?: HomeTrip[];
  collections?: TeaserCollection[];
}) {
  return (
    <>
      <IwacuHero promoted={promoted} next={next} />
      <TripsTeaser counts={tripCounts} />
      <ActivitiesSection upcoming={upcoming} past={past} />
      <KigaliToursTeaser collections={collections} />
      <SeamlessStaySection />
      <Testimonials />
      <GallerySection trips={trips} />
    </>
  );
}
