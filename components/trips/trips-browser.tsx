"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { MotionConfig, motion } from "framer-motion";
import { ArrowRight, Check, Clock, Landmark, Wrench, type LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { PublicTrip } from "@/lib/cms/trips";
import { TRIP_CATEGORIES, type TripCategoryId, type TripStatus } from "@/lib/trips";

/** Each kind of place's tag and button. Words: Trips.list.<tag> and Trips.list.<cta>. */
const KINDS: Record<TripStatus, { tag: string; icon: LucideIcon; cta: string }> = {
  live: { tag: "open", icon: Check, cta: "build" },
  tour: { tag: "tour", icon: Landmark, cta: "viewTour" },
  maintenance: { tag: "maintenance", icon: Wrench, cta: "view" },
  soon: { tag: "soon", icon: Clock, cta: "view" },
};

function PlaceCard({ place }: { place: PublicTrip }) {
  const t = useTranslations("Trips");
  const { tag, icon: Icon, cta } = KINDS[place.status];
  const body = (
    <>
      <div className="relative aspect-[16/10] overflow-hidden bg-muted/70">
        <Image src={place.image ?? ""} alt="" fill unoptimized={place.image?.startsWith("https://")} sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className={`object-cover transition-transform duration-700 ${place.href ? "group-hover:scale-105" : ""}`} />
        <span className={`absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-extrabold ${place.status === "live" ? "bg-primary text-white" : "bg-white/95 text-foreground"}`}>
          <Icon className="h-3.5 w-3.5" aria-hidden="true" /> {t(`list.${tag}`)}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-lg font-extrabold tracking-tight leading-snug text-foreground">{place.name}</h3>
        {place.summary && <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{place.summary}</p>}
        {place.href && (
          <p className={`mt-auto pt-4 inline-flex items-center gap-2 text-sm font-extrabold ${place.status === "live" ? "text-primary" : "text-foreground"}`}>
            {t(`list.${cta}`)} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
          </p>
        )}
      </div>
    </>
  );
  const cls = "group flex flex-col overflow-hidden rounded-2xl bg-card ring-1 ring-black/5 shadow-lg shadow-black/5";
  return place.href ? (
    <Link href={place.href} className={`${cls} hover:shadow-xl hover:ring-primary/40 transition-shadow duration-300`}>{body}</Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

/** One category's places: photo cards first, then the places still to come as a short list. */
function Places({ places, heading }: { places: PublicTrip[]; heading?: string }) {
  const t = useTranslations("Trips");
  const withPhoto = places.filter((p) => p.image);
  const withoutPhoto = places.filter((p) => !p.image);
  if (!places.length) return null;
  return (
    <div className={heading ? "mt-10 first:mt-6" : undefined}>
      {heading && <h3 className="text-lg md:text-xl font-extrabold tracking-tight text-foreground">{heading}</h3>}
      {withPhoto.length > 0 && (
        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {withPhoto.map((place) => <PlaceCard key={place.id} place={place} />)}
        </div>
      )}

      {withoutPhoto.length > 0 && (
        <div className="mt-8">
          <h4 className="flex items-center gap-2 text-sm font-extrabold text-muted-foreground">
            <Clock className="h-4 w-4" aria-hidden="true" /> {t("list.soon")}
          </h4>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {withoutPhoto.map((place) => (
              <li key={place.id} className="rounded-2xl border border-dashed border-border p-4">
                <p className="text-sm font-extrabold leading-snug text-foreground">{place.name}</p>
                {place.summary && <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{place.summary}</p>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/** "all", or one category. */
export type TripsView = TripCategoryId | "all";

/**
 * The categories on /iwacu/trips: "All" shows every place, grouped by category; any other
 * shows only its places. The address keeps the choice, so it can be shared.
 */
export function TripsBrowser({ initial, trips }: { initial: TripsView; trips: PublicTrip[] }) {
  const t = useTranslations("Trips");
  const [selected, setSelected] = useState<TripsView>(initial);
  const listTop = useRef<HTMLDivElement>(null);
  const nav = useRef<HTMLElement>(null);
  const views: TripsView[] = ["all", ...TRIP_CATEGORIES.map((c) => c.id)];

  const select = (id: TripsView) => {
    setSelected(id);
    window.history.replaceState(null, "", `${window.location.pathname}?category=${id}`);
    // Bring the new places into view when the visitor has scrolled past the top of the list.
    const top = listTop.current?.getBoundingClientRect().top ?? 0;
    const header = document.querySelector("header")?.getBoundingClientRect().bottom ?? 0;
    if (top < header) window.scrollTo({ top: window.scrollY + top - header, behavior: "smooth" });
  };

  // The row slides sideways where the categories don't all fit: keep the selected one in view.
  useEffect(() => {
    const row = nav.current;
    const on = row?.querySelector<HTMLElement>('[aria-pressed="true"]');
    if (row && on) row.scrollLeft = on.offsetLeft - (row.clientWidth - on.offsetWidth) / 2;
  }, [selected]);

  return (
    <MotionConfig reducedMotion="user">
      <div ref={listTop} />
      <div className="sticky top-[var(--header-h)] z-20 border-b border-border bg-background/95 backdrop-blur-sm">
        <nav ref={nav} aria-label={t("list.browse")} className="relative max-w-[1400px] mx-auto flex gap-2 overflow-x-auto px-6 md:px-10 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [mask-image:linear-gradient(to_right,transparent,black_1.5rem,black_calc(100%-1.5rem),transparent)]">
          {views.map((id) => {
            const on = id === selected;
            return (
              <button key={id} type="button" aria-pressed={on} onClick={() => select(id)}
                className={`relative shrink-0 min-h-11 rounded-full px-4 text-sm font-bold transition-colors ${on ? "text-white" : "bg-muted/50 text-foreground hover:bg-muted"}`}>
                {on && <motion.span layoutId="trip-category" transition={{ duration: 0.25 }} className="absolute inset-0 rounded-full bg-primary" />}
                <span className="relative">{id === "all" ? t("list.all") : t(`categories.${id}`)}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <motion.section key={selected} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} aria-labelledby="trip-category-heading"
        className="max-w-[1400px] mx-auto px-6 md:px-10 pt-8 md:pt-10">
        <h2 id="trip-category-heading" className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">{selected === "all" ? t("list.allTitle") : t(`categories.${selected}`)}</h2>

        {selected === "all"
          ? TRIP_CATEGORIES.map(({ id }) => <Places key={id} heading={t(`categories.${id}`)} places={trips.filter((trip) => trip.category === id)} />)
          : <Places places={trips.filter((trip) => trip.category === selected)} />}
      </motion.section>
    </MotionConfig>
  );
}
