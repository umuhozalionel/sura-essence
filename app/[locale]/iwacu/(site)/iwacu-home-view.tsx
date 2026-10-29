"use client";

import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { IwacuHero } from "@/components/iwacu-hero";
import { ActivitiesSection, type HomeEvent } from "@/components/activities-section";
import { DestinationsHistorySection } from "@/components/destinations-history-section";
import { GallerySection, type HomeTrip } from "@/components/gallery-section";
import type { IwacuSpotlight } from "@/lib/cms/site-data";
import type { SiteCollection } from "@/lib/cms/site-shapes";

/** Just what the teaser reads from a tour collection (CMS or Tours.collections). */
type TeaserCollection = Pick<SiteCollection, "id" | "category"> & {
  intro: Pick<SiteCollection["intro"], "image" | "headline">;
  venues: unknown[];
};

/** One card per Kigali tour collection, each opening the tours page on that collection. */
function KigaliToursTeaser({ collections: fromCms }: { collections?: TeaserCollection[] }) {
  const t = useTranslations("Brands.iwacu.home.tours");
  const tTours = useTranslations("Tours");
  const collections = fromCms ?? (tTours.raw("collections") as TeaserCollection[]);

  return (
    <section id="kigali-tours" className="py-24 md:py-32 bg-background text-foreground">
      <div className="max-w-[1400px] mx-auto px-6 md:px-10">
        <div className="mb-12 md:mb-16 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl flex flex-col gap-4">
            <span className="text-primary text-xs font-extrabold uppercase tracking-widest">{t("eyebrow")}</span>
            <h2 className="text-4xl md:text-6xl font-extrabold tracking-tighter leading-[0.95]">{t("title")}</h2>
            <p className="text-muted-foreground text-base md:text-lg leading-relaxed">{t("intro")}</p>
          </div>
          <Link
            href="/iwacu/kigali-tours"
            className="group inline-flex min-h-12 items-center gap-2 self-start rounded-2xl text-xs font-extrabold uppercase tracking-widest text-primary md:self-auto"
          >
            {t("all")} <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
          </Link>
        </div>

        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {collections.map((c) => (
            <li key={c.id}>
              <Link
                href={`/iwacu/kigali-tours?category=${c.id}`}
                className="group relative flex aspect-[4/5] flex-col justify-end overflow-hidden rounded-2xl bg-foreground p-6 text-white"
              >
                <Image
                  src={c.intro.image}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105 motion-reduce:transition-none"
                />
                <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-foreground/90 via-foreground/30 to-transparent" />
                <span className="relative text-xs font-extrabold uppercase tracking-widest text-secondary">
                  {t("placeCount", { count: c.venues.length })}
                </span>
                <span className="relative mt-2 text-2xl font-extrabold tracking-tight">{c.category}</span>
                <span className="relative mt-1 text-sm text-white/80">{c.intro.headline}</span>
                <ArrowRight className="relative mt-4 w-5 h-5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/**
 * The SURA Iwacu home. `promoted`/`next` lead the hero; `upcoming`, `past`,
 * `trips` and `collections` come from the CMS, and without them each section
 * reads messages/*.json.
 */
export function IwacuHomeView({ promoted, next, upcoming, past, trips, collections }: {
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
      {/* Activities and Destinations start flush (pt-0), so they get the gap here. */}
      <div className="pt-24 md:pt-32">
        <ActivitiesSection upcoming={upcoming} past={past} />
        <DestinationsHistorySection />
      </div>
      <GallerySection trips={trips} />
      <KigaliToursTeaser collections={collections} />
    </>
  );
}
