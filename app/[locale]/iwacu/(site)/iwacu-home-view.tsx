"use client";

import { useTranslations } from "next-intl";
import { ActivitiesSection, type HomeEvent } from "@/components/activities-section";
import { DestinationsHistorySection } from "@/components/destinations-history-section";
import { GallerySection, type HomeTrip } from "@/components/gallery-section";

/** TEMPORARY (see page.tsx): a short intro, then three of the homepage's sections. */
export function IwacuHomeView({ upcoming, past, trips }: { upcoming?: HomeEvent[]; past?: HomeEvent[]; trips?: HomeTrip[] }) {
  const t = useTranslations("Brands.iwacu");

  return (
    <>
      {/* Dark top, so the transparent header reads over it like it does over a photo. */}
      <section className="bg-foreground text-white pt-[calc(var(--header-h)+4rem)] pb-16 md:pb-24">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 flex flex-col gap-6">
          <span className="text-xs font-extrabold uppercase tracking-widest text-secondary">{t("home.eyebrow")}</span>
          <h1 className="font-display text-4xl md:text-6xl font-extrabold tracking-tight leading-[1.05] max-w-4xl">{t("home.title")}</h1>
          <p className="text-base md:text-lg text-white/70 max-w-2xl">{t("home.intro")}</p>
        </div>
      </section>
      <ActivitiesSection upcoming={upcoming} past={past} />
      <DestinationsHistorySection />
      <GallerySection trips={trips} />
    </>
  );
}
