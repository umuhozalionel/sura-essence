"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, ArrowRight, Clock, PenLine, Quote } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { liveEnabled, submitTestimonial, type Testimonial } from "@/lib/testimonials";
import { TestimonialForm } from "./testimonial-form";
import { EmptyState, Tile, showTestimonialCta, useTestimonialCards, type CardData } from "./testimonials";

// PICTURE, for Lionel to place: the photo at the top of this page. File lives in public/.
const HERO_IMAGE = "/backgrounds/sura-experience1.jpg";

const SHARE = "group inline-flex min-h-14 items-center justify-center gap-3 rounded-full bg-secondary px-8 text-sm font-extrabold text-foreground shadow-xl shadow-black/20 transition-colors hover:bg-secondary-hover focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30";

const CLOSING_LINKS = [
  { id: "ride", href: "/movana/book", look: "bg-secondary text-foreground hover:bg-secondary-hover" },
  { id: "trip", href: "/iwacu/trips", look: "bg-white text-foreground hover:bg-white/85" },
  { id: "contact", href: "/contact", look: "border border-white/40 text-white hover:bg-white/10" },
] as const;

function StoryCard({ card, pending, hint, glowing }: { card: CardData; pending: string; hint: string; glowing: boolean }) {
  return (
    <motion.figure
      id={`story-${card.id}`}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5 }}
      className={`mb-6 flex break-inside-avoid scroll-mt-32 flex-col gap-5 rounded-2xl bg-card p-6 shadow-lg shadow-black/5 transition-shadow duration-700 md:p-7 ${glowing ? "ring-2 ring-secondary" : "ring-1 ring-black/5"}`}
    >
      <Quote className="h-6 w-6 fill-secondary text-secondary" aria-hidden="true" />
      <blockquote className="whitespace-pre-line text-base leading-relaxed text-foreground/85 [overflow-wrap:anywhere] md:text-lg">{card.text}</blockquote>
      {card.note && <p className="text-xs font-semibold text-muted-foreground">{card.note}</p>}
      {card.pending && (
        <p className="flex items-start gap-2 text-xs font-medium text-muted-foreground">
          <Clock className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
          <span><strong className="font-extrabold text-foreground">{pending}.</strong> {hint}</span>
        </p>
      )}
      <figcaption className="mt-auto flex items-center gap-3 border-t border-border pt-5">
        <span className="h-12 w-12 shrink-0"><Tile card={card} small /></span>
        <span className="min-w-0">
          <span className="block truncate font-extrabold tracking-tight text-foreground">{card.name}</span>
          <span className="block truncate text-sm font-semibold text-primary">
            {card.role}{card.meta ? <span className="text-muted-foreground"> · {card.meta}</span> : null}
          </span>
        </span>
      </figcaption>
    </motion.figure>
  );
}

/** The page at /testimonials: the stories as a wall, so all of them can be read at once rather than one at a time. */
export function TestimonialsWall() {
  const t = useTranslations("Testimonials");
  const tPage = useTranslations("TestimonialsPage");
  const root = useRef<HTMLDivElement>(null);
  const { cards, loading, empty, liveError, addMine } = useTestimonialCards(root);
  const [formOpen, setFormOpen] = useState(false);
  const [highlightId, setHighlightId] = useState<string | null>(null);

  const handleSubmitted = useCallback((item: Testimonial) => {
    addMine(item);
    setHighlightId(item.id);
  }, [addMine]);

  // Once the form closes, glide to the new story and let the glow fade.
  useEffect(() => {
    if (formOpen || !highlightId) return;
    const scroll = window.setTimeout(() => document.getElementById(`story-${highlightId}`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 250);
    const fade = window.setTimeout(() => setHighlightId(null), 4500);
    return () => {
      window.clearTimeout(scroll);
      window.clearTimeout(fade);
    };
  }, [formOpen, highlightId]);

  return (
    <div ref={root} className="bg-background text-foreground">
      <section className="relative isolate flex min-h-[70svh] items-center overflow-hidden bg-foreground pt-[var(--header-h)]">
        <Image src={HERO_IMAGE} alt="" fill priority sizes="100vw" className="-z-10 object-cover object-[center_75%]" />
        <span aria-hidden="true" className="absolute inset-0 -z-10 bg-black/55 md:bg-transparent md:bg-gradient-to-r md:from-black/75 md:via-black/50 md:to-black/25" />
        <div className="mx-auto flex w-full max-w-[1400px] flex-col items-start gap-6 px-6 py-16 md:px-10">
          <span className="text-xs font-extrabold uppercase tracking-widest text-secondary">{t("badge")}</span>
          <h1 className="text-5xl font-extrabold leading-[0.95] tracking-tighter text-white md:text-7xl">
            {t("title")}<br />
            <span className="text-secondary">{t("titleHighlight")}</span>
          </h1>
          <p className="max-w-xl text-base leading-relaxed text-white/85 md:text-lg">{t("subtitle")}</p>
          <div className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-4">
            {showTestimonialCta && !empty && (
              <button type="button" onClick={() => setFormOpen(true)} className={SHARE}>
                <PenLine className="h-4 w-4 transition-transform group-hover:-rotate-12" aria-hidden="true" />
                {t("cta")}
              </button>
            )}
            {cards.length > 0 && (
              <div className="flex items-center gap-3">
                <span aria-hidden="true" className="flex -space-x-3">
                  {cards.slice(0, 4).map((card) => (
                    <span key={card.id} className="h-10 w-10 rounded-2xl ring-2 ring-white/80"><Tile card={card} small /></span>
                  ))}
                </span>
                <span className="text-sm font-semibold text-white">{tPage("count", { count: cards.length })}</span>
              </div>
            )}
          </div>
        </div>
      </section>

      <section aria-label={t("carousel")} className="mx-auto max-w-[1400px] px-6 py-16 md:px-10 md:py-24">
        {!liveEnabled && showTestimonialCta && <p className="mb-8 text-center text-xs font-semibold text-muted-foreground">{t("sampleNotice")}</p>}
        {liveError && (
          <p role="alert" className="mx-auto mb-8 flex max-w-2xl items-center gap-3 rounded-2xl bg-card px-5 py-4 text-sm font-semibold text-muted-foreground ring-1 ring-black/5">
            <AlertCircle className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            {t("liveError")}
          </p>
        )}
        {loading && (
          <>
            <p className="sr-only" role="status">{t("loading")}</p>
            <div aria-hidden="true" className="grid animate-pulse gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2].map((i) => <div key={i} className="h-64 rounded-2xl bg-card ring-1 ring-black/5" />)}
            </div>
          </>
        )}
        {empty ? (
          <EmptyState title={t("empty.title")} text={t("empty.text")} cta={t("cta")} onCta={() => setFormOpen(true)} />
        ) : (
          <div className="gap-6 md:columns-2 lg:columns-3">
            {cards.map((card) => (
              <StoryCard key={card.id} card={card} pending={t("pending")} hint={t("pendingHint")} glowing={card.id === highlightId} />
            ))}
          </div>
        )}
      </section>

      <section className="bg-foreground text-white">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-8 px-6 py-16 md:flex-row md:items-center md:justify-between md:px-10 md:py-20">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-extrabold leading-tight tracking-tight md:text-5xl">{tPage("closingTitle")}</h2>
            <p className="mt-3 text-base leading-relaxed text-white/75">{tPage("closingText")}</p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-3">
            {CLOSING_LINKS.map(({ id, href, look }) => (
              <Link key={id} href={href} className={`group inline-flex min-h-12 items-center gap-2 rounded-full px-6 text-sm font-extrabold transition-colors ${look}`}>
                {tPage(id)}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <AnimatePresence>
        {formOpen && (
          <TestimonialForm key="testimonial-form" enabled={liveEnabled} submit={submitTestimonial} onSubmitted={handleSubmitted} onClose={() => setFormOpen(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
