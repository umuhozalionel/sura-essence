"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion, type PanInfo } from "framer-motion";
import {
  AlertCircle, ArrowLeft, ArrowRight, Clock, MessageCircle, PenLine, Quote, Send, Sparkles, Zap,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { TestimonialForm } from "./testimonial-form";
import {
  fetchApproved, forgetApproved, liveEnabled, loadMine, rememberMine, submitTestimonial,
  type Locale, type Testimonial,
} from "@/lib/testimonials";


const CONTACT_EMAIL = "Suraessenceltd@gmail.com";

// In `next dev` the "Share your experience" button and a setup hint show even
// before MONGODB_URI is set. In production they only appear once it is.
const IS_DEV = process.env.NODE_ENV !== "production";

// How often an open page re-checks for newly approved testimonials.
const REFRESH_MS = 60_000;
// If the first load hasn't answered by then (offline, database down), say so.
const LOAD_TIMEOUT_MS = 12_000;

// Sample reviews live in messages/en.json + messages/fr.json ("Testimonials.reviews").
// They show only in `next dev` while MONGODB_URI isn't set; once it is, the feed is live.
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
  // Sample reviews are a development aid only: live visitors never see them.
  const cards: CardData[] = liveEnabled
    ? [...mine, ...(approved ?? [])].map(fromLive)
    : !IS_DEV
    ? []
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
      className={`relative overflow-hidden bg-card py-24 md:py-32 text-foreground`}
    >
      {/* Soft brand light behind the glass — kept well inside the section so no edge shows */}
      <div aria-hidden className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute left-[10%] top-[30%] h-[26rem] w-[26rem] rounded-full bg-primary/10 blur-[110px]" />
        <div className="absolute right-[8%] top-[38%] h-[22rem] w-[22rem] rounded-full bg-secondary/15 blur-[110px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-[1400px] px-6 md:px-10">
        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="mx-auto mb-12 flex max-w-3xl flex-col items-center gap-4 text-center md:mb-16"
        >
          <div className="inline-flex items-center gap-3 rounded-full bg-foreground px-5 py-2 text-white shadow-xl">
            <Zap className="h-4 w-4 text-secondary" aria-hidden />
            <span className="text-xs font-extrabold uppercase tracking-widest">{t("badge")}</span>
          </div>
          <h2 className="text-4xl font-extrabold uppercase leading-[0.95] tracking-tighter text-foreground md:text-6xl">
            {t("title")} <br />
            <span className="text-primary">{t("titleHighlight")}</span>
          </h2>
          <p className="max-w-2xl text-lg font-medium leading-relaxed text-foreground/60 md:text-xl">
            {t("subtitle")}
          </p>
        </motion.div>

        {/* ── Status lines ── */}
        <div className="mx-auto flex max-w-4xl flex-col items-center">
          {!liveEnabled && IS_DEV && (
            <p className="mb-8 inline-flex items-center gap-2 rounded-full border border-dashed border-foreground/20 bg-background px-4 py-2 text-xs font-semibold text-foreground/60">
              <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden />
              {t("sampleNotice")}
            </p>
          )}
          {liveError && (
            <p role="alert" className="mb-8 flex w-full items-center gap-3 rounded-2xl bg-foreground/[0.04] px-5 py-4 text-sm font-semibold text-foreground/70 ring-1 ring-foreground/10">
              <AlertCircle className="h-4 w-4 shrink-0 text-primary" aria-hidden />
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
            <p className="text-sm font-medium text-foreground/60">{t("ctaHint")}</p>
            <button
              type="button"
              onClick={() => setFormOpen(true)}
              className="group inline-flex h-14 items-center justify-center gap-3 rounded-full bg-secondary px-8 text-sm font-extrabold text-foreground shadow-xl shadow-secondary/25 transition-all hover:bg-secondary-hover focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30 active:scale-[0.98]"
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
          <div className="relative overflow-hidden rounded-2xl bg-white/75 p-6 shadow-2xl shadow-foreground/10 ring-1 ring-foreground/5 backdrop-blur-xl md:p-14">
            <div className="relative z-10 grid gap-12 md:grid-cols-2 md:gap-16">
              <div className="flex flex-col items-start gap-10">
                <div className="flex flex-col items-start gap-4">
                <div className="inline-flex items-center gap-3 rounded-full bg-foreground px-5 py-2 text-white shadow-xl">
                  <MessageCircle className="h-4 w-4 text-secondary" aria-hidden />
                  <span className="text-xs font-extrabold uppercase tracking-widest">{ti("badge")}</span>
                </div>
                <h3 className="text-4xl font-extrabold uppercase leading-none tracking-tighter text-foreground md:text-5xl">
                  {ti("title")}
                </h3>
                <p className="text-base font-medium leading-relaxed text-foreground/60">{ti("text")}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <Sparkles className="h-4 w-4 text-primary" aria-hidden />
                  </div>
                  <span className="text-xs font-extrabold uppercase tracking-widest text-foreground">{ti("support")}</span>
                </div>
              </div>

              <form onSubmit={handleInquiry} className="flex flex-col gap-4">
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
                  className="flex h-14 w-full items-center justify-center gap-3 rounded-full bg-foreground text-xs font-extrabold uppercase tracking-widest text-white shadow-xl transition-all hover:bg-primary active:scale-[0.98]"
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
  "w-full min-h-12 rounded-2xl border-none bg-background px-5 py-4 text-xs font-bold tracking-widest text-foreground outline-none ring-1 ring-foreground/5 transition-all placeholder:text-foreground/60 focus:bg-card focus:ring-2 focus:ring-primary";

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
          ? "ring-2 ring-secondary shadow-[0_0_0_8px_rgba(234,179,8,0.14),0_30px_80px_-40px_rgba(10,17,40,0.35)]"
          : "ring-1 ring-foreground/[0.06] shadow-[0_30px_80px_-40px_rgba(10,17,40,0.35)]",
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
                  className="absolute left-1/2 top-[5.5rem] -ml-16 -mt-16 h-32 w-32 rounded-2xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/40"
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
                        className="absolute -bottom-2 -right-2 flex h-9 w-9 items-center justify-center rounded-full bg-foreground text-secondary shadow-lg ring-4 ring-white"
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

        <div className="border-t border-foreground/[0.06] pt-7">
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
                <p className="text-xl font-extrabold tracking-tight text-foreground md:text-2xl">{active.name}</p>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-sm font-semibold">
                  <span className="text-primary">{active.role}</span>
                  {active.meta && (
                    <>
                      <span aria-hidden className="text-foreground/30">•</span>
                      <span className="text-foreground/60">{active.meta}</span>
                    </>
                  )}
                </p>
                {active.pending && (
                  <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-foreground">
                    <Clock className="h-3 w-3" aria-hidden />
                    {labels.pending}
                  </span>
                )}
              </motion.div>
            </AnimatePresence>

            {n > 1 && (
              <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                <span className="mr-1 hidden text-xs font-bold tabular-nums text-foreground/60 sm:inline">
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
                <blockquote className="whitespace-pre-line text-lg font-medium leading-relaxed text-foreground/85 [overflow-wrap:anywhere] md:text-[22px] md:leading-[1.6]">
                  {labels.quote(active.text)}
                </blockquote>
                {active.note && (
                  <p className="mt-4 text-xs font-semibold uppercase tracking-widest text-foreground/60">{active.note}</p>
                )}
                {active.pending && (
                  <p className="mt-4 text-xs font-medium text-foreground/60">{labels.pendingHint}</p>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {n > 1 && (
            <p className="mt-6 text-xs font-bold tabular-nums text-foreground/60 sm:hidden">
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
      className="flex h-12 w-12 items-center justify-center rounded-full bg-card text-foreground shadow-sm ring-1 ring-foreground/10 transition hover:bg-foreground hover:text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/40 active:scale-95"
    >
      {children}
    </button>
  );
}

// Initials tiles get one of the brand tones, picked from the name so a person
// always gets the same colour.
const TILE_TONES = [
  "bg-primary text-white",
  "bg-foreground text-white",
  "bg-secondary text-foreground",
  "bg-primary-hover text-white",
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
        <span aria-hidden className={`flex h-full w-full items-center justify-center text-4xl font-extrabold tracking-tight ${tone}`}>
          {initials}
        </span>
      )}
    </span>
  );
}

function SpotlightSkeleton() {
  return (
    <div aria-hidden className="mx-auto max-w-4xl animate-pulse rounded-2xl bg-white/60 px-5 pb-10 pt-8 ring-1 ring-foreground/[0.06] backdrop-blur-xl sm:px-10 md:px-14">
      <div className="flex h-52 items-center justify-center gap-6">
        <div className="h-24 w-24 rounded-2xl bg-foreground/[0.05]" />
        <div className="h-32 w-32 rounded-2xl bg-foreground/[0.08]" />
        <div className="h-24 w-24 rounded-2xl bg-foreground/[0.05]" />
      </div>
      <div className="border-t border-foreground/[0.06] pt-7">
        <div className="h-5 w-48 rounded-full bg-foreground/[0.08]" />
        <div className="mt-2 h-3.5 w-32 rounded-full bg-foreground/[0.06]" />
        <div className="mt-8 space-y-3">
          <div className="h-4 w-full rounded-full bg-foreground/[0.06]" />
          <div className="h-4 w-11/12 rounded-full bg-foreground/[0.06]" />
          <div className="h-4 w-3/5 rounded-full bg-foreground/[0.06]" />
        </div>
      </div>
    </div>
  );
}

function EmptyState({ title, text, cta, onCta }: { title: string; text: string; cta: string; onCta: () => void }) {
  return (
    <div className="flex justify-center">
      <div className="flex max-w-xl flex-col items-center rounded-2xl bg-white/70 px-8 py-14 text-center shadow-[0_24px_60px_-28px_rgba(10,17,40,0.28)] ring-1 ring-foreground/[0.06] backdrop-blur-xl md:px-14">
        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-foreground">
          <Sparkles className="h-6 w-6 text-secondary" aria-hidden />
        </div>
        <h3 className="mb-3 text-2xl font-extrabold tracking-tight text-foreground">{title}</h3>
        <p className="mb-8 text-base font-medium leading-relaxed text-foreground/60">{text}</p>
        <button
          type="button"
          onClick={onCta}
          className="inline-flex h-12 items-center gap-2 rounded-full bg-secondary px-7 text-sm font-extrabold text-foreground shadow-lg shadow-secondary/25 transition-all hover:bg-secondary-hover active:scale-[0.98]"
        >
          <PenLine className="h-4 w-4" aria-hidden />
          {cta}
        </button>
      </div>
    </div>
  );
}
