"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";


interface Media { id: string; type: "image" | "video"; src: string; caption: string }
interface Trip { id: string; shortTitle: string; preview: Media[] }
export type HomeTrip = Trip;

const MAX_TILES = 4;

// Photos come from the Gallery namespace (the trips shown on /gallery).
/** `trips` come from the CMS; without them, Gallery.trips from messages/*.json. */
export function GallerySection({ trips: fromCms }: { trips?: Trip[] } = {}) {
  const t = useTranslations("HomeGallery");
  const tGallery = useTranslations("Gallery");
  const trips = fromCms ?? (tGallery.raw("trips") as Trip[]);

  // Take photos from each trip in turn so no single trip fills the row.
  const perTrip = trips.map((trip) =>
    trip.preview.filter((m) => m.type === "image").map((m) => ({ ...m, trip: trip.shortTitle }))
  );
  const tiles: (Media & { trip: string })[] = [];
  for (let i = 0; tiles.length < MAX_TILES && perTrip.some((list) => i < list.length); i++) {
    for (const list of perTrip) if (list[i] && tiles.length < MAX_TILES) tiles.push(list[i]);
  }

  return (
    <section id="gallery" className="py-12 md:py-16 bg-foreground text-white">
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 flex flex-col gap-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl flex flex-col gap-2">
            <span className="text-secondary text-xs font-extrabold uppercase tracking-widest">{t("badge")}</span>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight leading-tight">
              {t("title")} {t("titleHighlight")}
            </h2>
            <p className="text-white/70 text-sm md:text-base leading-relaxed">{t("subtitle")}</p>
          </div>
          <Link
            href="/iwacu/experiences/gallery"
            className="group inline-flex min-h-12 items-center gap-2 self-start md:self-auto text-sm font-extrabold text-secondary"
          >
            {t("cta")} <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {tiles.map((m, i) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
            >
              <Link
                href="/iwacu/experiences/gallery"
                className="group relative block aspect-[4/3] rounded-2xl overflow-hidden bg-white/5 ring-1 ring-white/10"
              >
                <Image
                  src={m.src}
                  alt={m.caption}
                  fill
                  sizes="(min-width: 1024px) 25vw, 50vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all">
                  <p className="text-xs font-extrabold uppercase tracking-widest text-secondary">{m.trip}</p>
                  <p className="text-sm font-bold">{m.caption}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
