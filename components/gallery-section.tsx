"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight, Images } from "lucide-react";
import { Manrope } from "next/font/google";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "700", "800"],
  variable: "--font-manrope",
});

interface Media { id: string; type: "image" | "video"; src: string; caption: string }
interface Trip { id: string; shortTitle: string; preview: Media[] }

// Each tile gets a fixed ratio, so the masonry columns never reflow as photos load.
const RATIOS = ["aspect-[4/5]", "aspect-[4/3]", "aspect-square", "aspect-[3/4]", "aspect-[16/10]"];
const MAX_TILES = 8;

// Photos come from the Gallery namespace (the trips shown on /gallery).
export function GallerySection() {
  const t = useTranslations("HomeGallery");
  const trips = useTranslations("Gallery").raw("trips") as Trip[];

  // Take photos from each trip in turn so no single trip fills the grid.
  const perTrip = trips.map((trip) =>
    trip.preview.filter((m) => m.type === "image").map((m) => ({ ...m, trip: trip.shortTitle }))
  );
  const tiles: (Media & { trip: string })[] = [];
  for (let i = 0; tiles.length < MAX_TILES && perTrip.some((list) => i < list.length); i++) {
    for (const list of perTrip) if (list[i] && tiles.length < MAX_TILES) tiles.push(list[i]);
  }

  return (
    <section id="gallery" className={`py-28 md:py-32 bg-[#0A1128] text-white ${manrope.className}`}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 mb-16">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 py-1.5 px-3.5 bg-white/10 border border-white/15 mb-8 rounded-2xl">
              <Images className="w-3.5 h-3.5 text-[#EAB308]" />
              <span className="text-white text-[10px] font-black uppercase tracking-[0.3em]">{t("badge")}</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter leading-[0.95] uppercase">
              {t("title")} <span className="text-[#EAB308]">{t("titleHighlight")}</span>
            </h2>
            <p className="mt-6 text-white/60 text-base md:text-lg leading-relaxed">{t("subtitle")}</p>
          </div>
          <Link
            href="/gallery"
            className="group inline-flex items-center gap-3 self-start lg:self-auto px-6 py-4 rounded-xl bg-white text-[#0A1128] text-[11px] font-black uppercase tracking-wide hover:bg-[#EAB308] transition-colors"
          >
            {t("cta")} <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        <div className="columns-2 md:columns-3 lg:columns-4 gap-4 [&>*]:mb-4">
          {tiles.map((m, i) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: (i % 4) * 0.08 }}
              className="break-inside-avoid"
            >
              <Link
                href="/gallery"
                className={`group relative block ${RATIOS[i % RATIOS.length]} rounded-2xl overflow-hidden bg-white/5 ring-1 ring-white/10`}
              >
                <Image
                  src={m.src}
                  alt={m.caption}
                  fill
                  sizes="(min-width: 1024px) 18rem, (min-width: 768px) 33vw, 50vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#EAB308]">{m.trip}</p>
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
