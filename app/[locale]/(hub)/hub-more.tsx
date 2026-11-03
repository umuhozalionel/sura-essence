"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { LeadMagnet } from "@/components/lead-magnet";
import { SeamlessStaySection } from "@/components/seamless-stay-section";
import { Testimonials } from "@/components/testimonials";
import { useMoreZoom } from "@/lib/use-more-zoom";

// PICTURE, for Lionel to place: the photo behind every section here. File lives in public/.
const BACKDROP_IMAGE = "/backgrounds/nyungwe_sky.jpg";

// What each section is about. Words: MoreSections.categories.<id>.
const CATEGORIES = [
  { id: "stay", Section: SeamlessStaySection },
  { id: "arrival", Section: LeadMagnet },
  { id: "stories", Section: Testimonials },
] as const;

/**
 * What the chooser's More button reveals: the sections, grouped by what they do,
 * zooming in as they scroll into view (lib/use-more-zoom.ts). They stay in the page
 * while closed, so search engines can still read them. .hub-aura (app/globals.css)
 * gives them the landing's look over one still photo.
 */
export function HubMore({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useTranslations("MoreSections");
  const root = useRef<HTMLDivElement>(null);
  useMoreZoom(root, open);

  useEffect(() => {
    if (open) root.current?.scrollIntoView({ behavior: "smooth" });
  }, [open]);

  const jumpTo = (id: string) => document.getElementById(`more-${id}`)?.scrollIntoView({ behavior: "smooth" });

  const close = () => {
    onClose();
    window.scrollTo({ top: 0 });
  };

  return (
    <div ref={root} id="hub-more" hidden={!open} className="hub-aura relative bg-foreground">
      <div aria-hidden="true" className="sticky top-0 -mb-[100svh] h-svh overflow-hidden">
        <Image src={BACKDROP_IMAGE} alt="" fill sizes="100vw" className="object-cover" />
        <div className="absolute inset-0 bg-black/60" />
      </div>

      <nav aria-label={t("more")} className="relative flex flex-wrap justify-center gap-3 px-6 pt-[calc(var(--header-h)+2rem)] pb-10">
        {CATEGORIES.map(({ id }) => (
          <button
            key={id}
            type="button"
            onClick={() => jumpTo(id)}
            className="min-h-11 rounded-full border border-white/30 bg-black/35 px-5 text-sm font-semibold backdrop-blur-md transition-colors hover:bg-black/55"
          >
            {t(`categories.${id}`)}
          </button>
        ))}
      </nav>

      {CATEGORIES.map(({ id, Section }) => (
        <div key={id} id={`more-${id}`} className="more-zoom relative mb-6 bg-black/45 pt-16">
          <p className="mx-auto mb-10 max-w-[1400px] px-6 text-center text-sm font-semibold text-secondary md:px-10">{t(`categories.${id}`)}</p>
          <Section />
        </div>
      ))}

      <div className="relative flex justify-center pb-12">
        <button
          type="button"
          onClick={close}
          className="min-h-11 rounded-full border border-white/30 bg-black/35 px-6 text-sm font-semibold backdrop-blur-md transition-colors hover:bg-black/55"
        >
          {t("less")}
        </button>
      </div>
    </div>
  );
}
