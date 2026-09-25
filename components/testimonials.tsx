"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion, type PanInfo } from "framer-motion";
import {
  AlertCircle, ArrowLeft, ArrowRight, Clock, MessageCircle, PenLine, Quote, Send, Sparkles, Star, Zap,
} from "lucide-react";
import { Manrope } from "next/font/google";
import { useLocale, useTranslations } from "next-intl";
import { TestimonialForm } from "./testimonial-form";
import {
  fetchApproved, forgetApproved, liveEnabled, loadMine, rememberMine, submitTestimonial,
  type Locale, type Testimonial,
} from "@/lib/testimonials";

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "700", "800"],
  variable: "--font-manrope",
});

const CONTACT_EMAIL = "Suraessenceltd@gmail.com";

// In `next dev` the "Share your experience" button and a setup hint show even
// before MONGODB_URI is set. In production they only appear once it is.
const IS_DEV = process.env.NODE_ENV !== "production";

// How often an open page re-checks for newly approved testimonials.
const REFRESH_MS = 60_000;
// If the first load hasn't answered by then (offline, database down), say so.
const LOAD_TIMEOUT_MS = 12_000;

// Sample reviews live in messages/en.json + messages/fr.json ("Testimonials.reviews").
// They show only while MONGODB_URI isn't set; once it is, the feed is live.
type Review = { id: string; name: string; occupation: string; country: string; text: string };

type CardData = {
  id: string;
  name: string;
  role: string;
  meta?: string;
  text: string;
  photoUrl: string | null;
  note?: string;
  pending?: boolean;
};

export function Testimonials() {
  const t = useTranslations("Testimonials");
  const ti = useTranslations("Testimonials.inquiry");
  const locale = useLocale() as Locale;

  const sectionRef = useRef<HTMLElement>(null);

  const [approved, setApproved] = useState<Testimonial[] | null>(null); // null = not loaded yet
  const [mine, setMine] = useState<Testimonial[]>([]);
  const [liveError, setLiveError] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [formState, setFormState] = useState({ name: "", email: "", message: "" });

  /* ── live feed: load when the section nears the viewport, then re-check every minute ── */
  useEffect(() => {
    if (!liveEnabled) return;
    const el = sectionRef.current;
    if (!el) return;

    let cancelled = false;
    let started = false;
    let loaded = false;
    let timer: number | undefined;
    let current: AbortController | null = null;

    const refresh = async () => {
      if (document.visibilityState === "hidden") return; // don't poll from background tabs
      current?.abort();
      const request = (current = new AbortController());
      const timeout = window.setTimeout(() => request.abort(), LOAD_TIMEOUT_MS);
      try {
        const items = await fetchApproved(request.signal);
        if (cancelled) return;
        loaded = true;
        // Anything of ours that's now approved is in the live list — drop the local copy.
        const ids = new Set(items.map((i) => i.id));
        forgetApproved(ids);
        setMine((m) => m.filter((x) => !ids.has(x.id)));
        setApproved(items);
        setLiveError(false);
      } catch {
        // A failed background refresh keeps what's on screen; only a failed first load is reported.
        if (!cancelled && !loaded && current === request) setLiveError(true);
      } finally {
        window.clearTimeout(timeout);
      }
    };

    const start = () => {
      started = true;
      setMine(loadMine());
      void refresh();
      timer = window.setInterval(refresh, REFRESH_MS);
    };

    const onVisible = () => {
      if (started && document.visibilityState === "visible") void refresh();
    };

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          io.disconnect();
          start();
        }
      },
      { rootMargin: "800px 0px" },
    );
    io.observe(el);
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      io.disconnect();
      window.clearInterval(timer);
      current?.abort();
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  /* ── submission → appears in the feed immediately ── */
  const handleSubmitted = useCallback((item: Testimonial) => {
    rememberMine(item);
    setMine((m) => [item, ...m.filter((x) => x.id !== item.id)]);
    setHighlightId(item.id);
  }, []);

  // Once the modal closes, glide to the stories (now showing the new one) and let the glow fade.
  useEffect(() => {
    if (formOpen || !highlightId) return;
    const scroll = window.setTimeout(() => {
      document.getElementById("testimonials-spotlight")?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 250);
    const fade = window.setTimeout(() => setHighlightId(null), 4500);
    return () => {
      window.clearTimeout(scroll);
      window.clearTimeout(fade);
    };
  }, [formOpen, highlightId]);

  /* ── inquiry form (unchanged behaviour: opens the visitor's mail app) ── */
  const handleInquiry = (e: React.FormEvent) => {
    e.preventDefault();
    const subject = encodeURIComponent(ti("emailSubject"));
    const body = encodeURIComponent(
      ti("emailBody", { name: formState.name, email: formState.email, message: formState.message })
    );
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
    setFormState({ name: "", email: "", message: "" });
  };

  /* ── what to show ── */
  const fromLive = (x: Testimonial): CardData => ({
    id: x.id,
    name: x.name,
    role: x.profession,
    text: x.comment,
    photoUrl: x.photoUrl,
    note: x.locale === locale ? undefined : x.locale === "fr" ? t("writtenIn.fr") : t("writtenIn.en"),
    pending: x.status === "pending",
  });

  const translatedNote = t("translatedNote");
  const cards: CardData[] = liveEnabled
    ? [...mine, ...(approved ?? [])].map(fromLive)
    : (t.raw("reviews") as Review[]).map((r) => ({
        id: r.id,
        name: r.name,
        role: r.occupation,
        meta: r.country,
        text: r.text,
        photoUrl: null,
        note: translatedNote || undefined,
      }));

  const loading = liveEnabled && approved === null && !liveError;
  const empty = liveEnabled && approved !== null && cards.length === 0;
  const showCta = liveEnabled || IS_DEV;

  return (
    <section
      ref={sectionRef}
      id="testimonials"
      className={`relative overflow-hidden bg-white py-28 md:py-32 text-[#0A1128] ${manrope.className}`}
    >
      {/* Soft brand light behind the glass — kept well inside the section so no edge shows */}
      <div aria-hidden className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute left-[10%] top-[30%] h-[26rem] w-[26rem] rounded-full bg-[#125740]/10 blur-[110px]" />
        <div className="absolute right-[8%] top-[38%] h-[22rem] w-[22rem] rounded-full bg-[#EAB308]/15 blur-[110px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-[1600px] px-6 md:px-10">
        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="mx-auto mb-14 flex max-w-3xl flex-col items-center text-center md:mb-16"
        >
          <div className="mb-8 inline-flex items-center gap-3 rounded-full bg-[#0A1128] px-5 py-2 text-white shadow-xl">
            <Zap className="h-4 w-4 text-[#EAB308]" aria-hidden />
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">{t("badge")}</span>
          </div>
          <h2 className="mb-6 text-5xl font-black uppercase leading-[0.9] tracking-tighter text-[#0A1128] md:text-7xl">
            {t("title")} <br />
            <span className="text-[#125740]">{t("titleHighlight")}</span>
          </h2>
          <p className="mb-8 max-w-2xl text-lg font-medium leading-relaxed text-[#0A1128]/60 md:text-xl">
            {t("subtitle")}
          </p>
          <div className="inline-flex items-center gap-3 rounded-full bg-white/80 py-2 pl-2 pr-5 shadow-lg shadow-[#0A1128]/5 ring-1 ring-[#0A1128]/[0.06] backdrop-blur-xl">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0A1128]">
              <Star className="h-4 w-4 fill-[#EAB308] text-[#EAB308]" stroke="none" aria-hidden />
            </span>
            <span className="flex gap-0.5" aria-hidden>
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={12} fill="#EAB308" className="text-[#EAB308]" stroke="none" />
              ))}
            </span>
            <span className="text-[11px] font-black uppercase tracking-widest text-[#0A1128]">{t("rating")}</span>
          </div>
        </motion.div>

        {/* ── Status lines ── */}
        <div className="mx-auto flex max-w-4xl flex-col items-center">
          {!liveEnabled && IS_DEV && (
            <p className="mb-8 inline-flex items-center gap-2 rounded-full border border-dashed border-[#0A1128]/20 bg-[#F9F8F6] px-4 py-2 text-xs font-semibold text-[#0A1128]/60">
              <Sparkles className="h-3.5 w-3.5 text-[#125740]" aria-hidden />
              {t("sampleNotice")}
            </p>
          )}
          {liveError && (
            <p role="alert" className="mb-8 flex w-full items-center gap-3 rounded-2xl bg-[#0A1128]/[0.04] px-5 py-4 text-sm font-semibold text-[#0A1128]/70 ring-1 ring-[#0A1128]/10">
              <AlertCircle className="h-4 w-4 shrink-0 text-[#125740]" aria-hidden />
              {t("liveError")}
            </p>
          )}
          {loading && <p className="sr-only" role="status">{t("loading")}</p>}
        </div>

        {/* ── Stories ── */}
        {empty ? (
          <EmptyState
            title={t("empty.title")}
            text={t("empty.text")}
            cta={t("cta")}
            onCta={() => setFormOpen(true)}
          />
        ) : cards.length > 0 ? (
          <Spotlight
            cards={cards}
            focusId={highlightId}
            highlightId={highlightId}
            labels={{
              region: t("carousel"),
              prev: t("prev"),
              next: t("next"),
              counter: (current, total) => t("counter", { current, total }),
              show: (name) => t("show", { name }),
              quote: (text) => t("quote", { text }),
              pending: t("pending"),
              pendingHint: t("pendingHint"),
            }}
          />
        ) : loading ? (
          <SpotlightSkeleton />
        ) : null}

        {/* ── Share yours ── */}
        {showCta && !empty && (
          <div className="mx-auto mt-10 flex max-w-4xl flex-col items-center gap-3 text-center">
            <p className="text-sm font-medium text-[#0A1128]/60">{t("ctaHint")}</p>
            <button
              type="button"
              onClick={() => setFormOpen(true)}
              className="group inline-flex h-14 items-center justify-center gap-3 rounded-full bg-[#EAB308] px-8 text-sm font-extrabold text-[#0A1128] shadow-xl shadow-[#EAB308]/25 transition-all hover:bg-[#CA9A04] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#125740]/30 active:scale-[0.98]"
            >
              <PenLine className="h-4 w-4 transition-transform group-hover:-rotate-12" aria-hidden />
              {t("cta")}
            </button>
          </div>
        )}

        {/* ── Inquiry ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="mx-auto mt-24 max-w-5xl"
        >
          <div className="relative overflow-hidden rounded-2xl bg-white/75 p-8 shadow-2xl shadow-[#0A1128]/10 ring-1 ring-[#0A1128]/5 backdrop-blur-xl md:p-14">
            <div className="relative z-10 grid gap-12 md:grid-cols-2 md:gap-16">
              <div>
                <div className="mb-8 inline-flex items-center gap-3 rounded-full bg-[#0A1128] px-5 py-2 text-white shadow-xl">
                  <MessageCircle className="h-4 w-4 text-[#EAB308]" aria-hidden />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">{ti("badge")}</span>
                </div>
                <h3 className="mb-6 text-4xl font-black uppercase leading-none tracking-tighter text-[#0A1128] md:text-5xl">
                  {ti("title")}
                </h3>
                <p className="mb-10 text-base font-medium leading-relaxed text-[#0A1128]/60">{ti("text")}</p>
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#125740]/10">
                    <Sparkles className="h-4 w-4 text-[#125740]" aria-hidden />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#0A1128]">{ti("support")}</span>
                </div>
              </div>

              <form onSubmit={handleInquiry} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <input
                    type="text"
                    aria-label={ti("namePlaceholder")}
                    placeholder={ti("namePlaceholder")}
                    required
                    value={formState.name}
                    onChange={(e) => setFormState({ ...formState, name: e.target.value.toUpperCase() })}
                    className={inquiryInput}
                  />
                  <input
                    type="email"
                    aria-label={ti("emailPlaceholder")}
                    placeholder={ti("emailPlaceholder")}
                    required
                    value={formState.email}
                    onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                    className={inquiryInput}
                  />
                </div>
                <textarea
                  aria-label={ti("messagePlaceholder")}
                  placeholder={ti("messagePlaceholder")}
                  required
                  rows={4}
                  value={formState.message}
                  onChange={(e) => setFormState({ ...formState, message: e.target.value })}
                  className={`${inquiryInput} resize-none`}
                />
                <button
                  type="submit"
                  className="flex h-14 w-full items-center justify-center gap-3 rounded-full bg-[#0A1128] text-xs font-black uppercase tracking-[0.3em] text-white shadow-xl transition-all hover:bg-[#125740] active:scale-[0.98]"
                >
                  <Send className="h-4 w-4" aria-hidden />
                  <span>{ti("submit")}</span>
                </button>
              </form>
            </div>
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {formOpen && (
          <TestimonialForm
            key="testimonial-form"
            enabled={liveEnabled}
            submit={submitTestimonial}
            onSubmitted={handleSubmitted}
            onClose={() => setFormOpen(false)}
          />
        )}
      </AnimatePresence>
    </section>
  );
}

const inquiryInput =
  "w-full rounded-2xl border-none bg-[#F9F8F6] px-5 py-4 text-xs font-bold tracking-widest text-[#0A1128] outline-none ring-1 ring-[#0A1128]/5 transition-all placeholder:text-[#0A1128]/60 focus:bg-white focus:ring-2 focus:ring-[#125740]";

/* ─── spotlight carousel ─────────────────────────────────────────────── */

type SpotlightLabels = {
  region: string;
  prev: string;
  next: string;
  counter: (current: number, total: number) => string;
  show: (name: string) => string;
  quote: (text: string) => string;
  pending: string;
  pendingHint: string;
};

// Where each tile sits relative to the active one (0). Order matters: with
// fewer than five stories, only the first N positions are used, so nobody
// appears twice.
const POSITIONS = [0, 1, -1, 2, -2];
const TILE_X = [0, 150, 262];
const TILE_SCALE = [1, 0.72, 0.54];
const TILE_OPACITY = [1, 0.8, 0.45];
const TILE_FILTER = ["blur(0px) grayscale(0)", "blur(0px) grayscale(0.35)", "blur(2px) grayscale(0.6)"];
const SWIPE_PX = 60;

const tileVariants = {
  enter: (dir: number) => ({ x: dir * 380, scale: 0.4, opacity: 0 }),
  exit: (dir: number) => ({ x: -dir * 380, scale: 0.4, opacity: 0 }),
};

const textVariants = {
  enter: (dir: number) => ({ x: dir * 28, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: -dir * 28, opacity: 0 }),
};

function Spotlight({
  cards, focusId, highlightId, labels,
}: {
  cards: CardData[];
  /** When this changes to a story id (a fresh submission), jump to it. */
  focusId: string | null;
  highlightId: string | null;
  labels: SpotlightLabels;
}) {
  const reduceMotion = useReducedMotion();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [direction, setDirection] = useState<1 | -1>(1);

  // Adjust during render (not in an effect) so the jump happens in the same paint.
  const [seenFocus, setSeenFocus] = useState(focusId);
  if (focusId !== seenFocus) {
    setSeenFocus(focusId);
    if (focusId) {
      setDirection(-1);
      setActiveId(focusId);
    }
  }

  const n = cards.length;
  const found = activeId ? cards.findIndex((c) => c.id === activeId) : -1;
  const index = found >= 0 ? found : 0;
  const active = cards[index];

  const go = (step: 1 | -1) => {
    if (n < 2) return;
    setDirection(step);
    setActiveId(cards[(index + step + n) % n].id);
  };

  const tiles = POSITIONS.slice(0, Math.min(n, POSITIONS.length)).map((offset) => ({
    offset,
    card: cards[(((index + offset) % n) + n) % n],
  }));

  const spring = reduceMotion ? { duration: 0 } : { type: "spring" as const, stiffness: 260, damping: 30 };
  const fade = reduceMotion ? { duration: 0 } : { duration: 0.3, ease: [0.22, 1, 0.36, 1] as const };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      go(1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      go(-1);
    }
  };

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -SWIPE_PX) go(1);
    else if (info.offset.x > SWIPE_PX) go(-1);
  };

  const highlighted = active.id === highlightId;

  return (
    <motion.div
      id="testimonials-spotlight"
      role="region"
      aria-roledescription="carousel"
      aria-label={labels.region}
      onKeyDown={onKeyDown}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7 }}
      className={[
        "relative mx-auto max-w-4xl scroll-mt-32 rounded-2xl bg-white/70 px-5 pb-9 pt-6 backdrop-blur-xl sm:px-10 md:px-14 md:pb-11 md:pt-8",
        "transition-shadow duration-700",
        highlighted
          ? "ring-2 ring-[#EAB308] shadow-[0_0_0_8px_rgba(234,179,8,0.14),0_30px_80px_-40px_rgba(10,17,40,0.35)]"
          : "ring-1 ring-[#0A1128]/[0.06] shadow-[0_30px_80px_-40px_rgba(10,17,40,0.35)]",
      ].join(" ")}
    >
      <motion.div
        drag={n > 1 ? "x" : false}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.18}
        dragSnapToOrigin
        onDragEnd={onDragEnd}
        className="cursor-grab active:cursor-grabbing"
      >
        {/* Avatar strip — active in the middle, neighbours smaller and softer */}
        {/* Tall enough that the tiles' shadows fade out before the clipping edge. */}
        <div className="relative mx-auto h-52 w-full max-w-2xl overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_16%,black_84%,transparent)]">
          <AnimatePresence initial={false} custom={direction}>
            {tiles.map(({ offset, card }) => {
              const d = Math.abs(offset);
              return (
                <motion.button
                  key={card.id}
                  type="button"
                  custom={direction}
                  variants={tileVariants}
                  initial="enter"
                  exit="exit"
                  animate={{
                    x: Math.sign(offset) * TILE_X[d],
                    scale: TILE_SCALE[d],
                    opacity: TILE_OPACITY[d],
                    filter: TILE_FILTER[d],
                  }}
                  transition={spring}
                  style={{ zIndex: 30 - d * 10 }}
                  onClick={() => {
                    if (offset === 0) return;
                    setDirection(offset > 0 ? 1 : -1);
                    setActiveId(card.id);
                  }}
                  aria-label={labels.show(card.name)}
                  aria-current={offset === 0 ? "true" : undefined}
                  className="absolute left-1/2 top-[5.5rem] -ml-16 -mt-16 h-32 w-32 rounded-2xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#125740]/40"
                >
                  <Tile card={card} />
                  <AnimatePresence>
                    {offset === 0 && (
                      <motion.span
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={fade}
                        aria-hidden
                        className="absolute -bottom-2 -right-2 flex h-9 w-9 items-center justify-center rounded-full bg-[#0A1128] text-[#EAB308] shadow-lg ring-4 ring-white"
                      >
                        {card.pending ? <Clock className="h-4 w-4" /> : <Quote className="h-4 w-4 fill-current" />}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
              );
            })}
          </AnimatePresence>
        </div>

        <div className="border-t border-[#0A1128]/[0.06] pt-7">
          {/* Name + controls */}
          <div className="flex items-start justify-between gap-4">
            <AnimatePresence mode="wait" initial={false} custom={direction}>
              <motion.div
                key={active.id}
                custom={direction}
                variants={textVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={fade}
                className="min-w-0"
              >
                <p className="text-xl font-extrabold tracking-tight text-[#0A1128] md:text-2xl">{active.name}</p>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-sm font-semibold">
                  <span className="text-[#125740]">{active.role}</span>
                  {active.meta && (
                    <>
                      <span aria-hidden className="text-[#0A1128]/30">•</span>
                      <span className="text-[#0A1128]/60">{active.meta}</span>
                    </>
                  )}
                </p>
                {active.pending && (
                  <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#EAB308] px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-[#0A1128]">
                    <Clock className="h-3 w-3" aria-hidden />
                    {labels.pending}
                  </span>
                )}
              </motion.div>
            </AnimatePresence>

            {n > 1 && (
              <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                <span className="mr-1 hidden text-xs font-bold tabular-nums text-[#0A1128]/60 sm:inline">
                  {labels.counter(index + 1, n)}
                </span>
                <ArrowButton label={labels.prev} onClick={() => go(-1)}>
                  <ArrowLeft className="h-4 w-4" aria-hidden />
                </ArrowButton>
                <ArrowButton label={labels.next} onClick={() => go(1)}>
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </ArrowButton>
              </div>
            )}
          </div>

          {/* The story itself */}
          <div aria-live="polite" className="mt-6 min-h-[7.5rem] md:min-h-[6.5rem]">
            <AnimatePresence mode="wait" initial={false} custom={direction}>
              <motion.div
                key={active.id}
                custom={direction}
                variants={textVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={fade}
              >
                <blockquote className="whitespace-pre-line text-lg font-medium leading-relaxed text-[#0A1128]/85 [overflow-wrap:anywhere] md:text-[22px] md:leading-[1.6]">
                  {labels.quote(active.text)}
                </blockquote>
                {active.note && (
                  <p className="mt-4 text-[11px] font-semibold uppercase tracking-widest text-[#0A1128]/60">{active.note}</p>
                )}
                {active.pending && (
                  <p className="mt-4 text-xs font-medium text-[#0A1128]/60">{labels.pendingHint}</p>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {n > 1 && (
            <p className="mt-6 text-xs font-bold tabular-nums text-[#0A1128]/60 sm:hidden">
              {labels.counter(index + 1, n)}
            </p>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function ArrowButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#0A1128] shadow-sm ring-1 ring-[#0A1128]/10 transition hover:bg-[#0A1128] hover:text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#125740]/40 active:scale-95"
    >
      {children}
    </button>
  );
}

// Initials tiles get one of the brand tones, picked from the name so a person
// always gets the same colour.
const TILE_TONES = [
  "bg-[#125740] text-white",
  "bg-[#0A1128] text-white",
  "bg-[#EAB308] text-[#0A1128]",
  "bg-[#0E4231] text-white",
];

function Tile({ card }: { card: CardData }) {
  const [failed, setFailed] = useState(false);
  const initials = card.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => Array.from(part)[0]?.toUpperCase() ?? "")
    .join("");
  const tone = TILE_TONES[Array.from(card.name).reduce((h, ch) => (h * 31 + (ch.codePointAt(0) ?? 0)) >>> 0, 7) % TILE_TONES.length];

  return (
    <span className="block h-full w-full overflow-hidden rounded-2xl shadow-[0_18px_40px_-18px_rgba(10,17,40,0.45)] ring-1 ring-black/5">
      {card.photoUrl && !failed ? (
        // Plain <img>: avatars are already 320px WebP, so next/image would add nothing
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={card.photoUrl}
          alt=""
          width={128}
          height={128}
          draggable={false}
          decoding="async"
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <span aria-hidden className={`flex h-full w-full items-center justify-center text-4xl font-black tracking-tight ${tone}`}>
          {initials}
        </span>
      )}
    </span>
  );
}

function SpotlightSkeleton() {
  return (
    <div aria-hidden className="mx-auto max-w-4xl animate-pulse rounded-2xl bg-white/60 px-5 pb-10 pt-8 ring-1 ring-[#0A1128]/[0.06] backdrop-blur-xl sm:px-10 md:px-14">
      <div className="flex h-52 items-center justify-center gap-6">
        <div className="h-24 w-24 rounded-2xl bg-[#0A1128]/[0.05]" />
        <div className="h-32 w-32 rounded-2xl bg-[#0A1128]/[0.08]" />
        <div className="h-24 w-24 rounded-2xl bg-[#0A1128]/[0.05]" />
      </div>
      <div className="border-t border-[#0A1128]/[0.06] pt-7">
        <div className="h-5 w-48 rounded-full bg-[#0A1128]/[0.08]" />
        <div className="mt-2 h-3.5 w-32 rounded-full bg-[#0A1128]/[0.06]" />
        <div className="mt-8 space-y-3">
          <div className="h-4 w-full rounded-full bg-[#0A1128]/[0.06]" />
          <div className="h-4 w-11/12 rounded-full bg-[#0A1128]/[0.06]" />
          <div className="h-4 w-3/5 rounded-full bg-[#0A1128]/[0.06]" />
        </div>
      </div>
    </div>
  );
}

function EmptyState({ title, text, cta, onCta }: { title: string; text: string; cta: string; onCta: () => void }) {
  return (
    <div className="flex justify-center">
      <div className="flex max-w-xl flex-col items-center rounded-2xl bg-white/70 px-8 py-14 text-center shadow-[0_24px_60px_-28px_rgba(10,17,40,0.28)] ring-1 ring-[#0A1128]/[0.06] backdrop-blur-xl md:px-14">
        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0A1128]">
          <Sparkles className="h-6 w-6 text-[#EAB308]" aria-hidden />
        </div>
        <h3 className="mb-3 text-2xl font-extrabold tracking-tight text-[#0A1128]">{title}</h3>
        <p className="mb-8 text-base font-medium leading-relaxed text-[#0A1128]/60">{text}</p>
        <button
          type="button"
          onClick={onCta}
          className="inline-flex h-12 items-center gap-2 rounded-full bg-[#EAB308] px-7 text-sm font-extrabold text-[#0A1128] shadow-lg shadow-[#EAB308]/25 transition-all hover:bg-[#CA9A04] active:scale-[0.98]"
        >
          <PenLine className="h-4 w-4" aria-hidden />
          {cta}
        </button>
      </div>
    </div>
  );
}
