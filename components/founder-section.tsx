"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Image from "next/image"
import { motion, AnimatePresence, type Variants } from "framer-motion"
import { ChevronLeft, ChevronRight, Mail, MessageCircle, Plus, ShieldCheck, X } from "lucide-react"
import { manrope } from "@/lib/fonts";
import { useScrollLock } from "@/lib/use-scroll-lock";
import { useLocale, useTranslations } from "next-intl";
import { getIcon } from "@/lib/icons";
import type { PublicBoardMember } from "@/lib/board-members";


// Shared company contacts, used when a founder has no direct email yet.
const COMPANY_EMAIL = "Suraessenceltd@gmail.com";
const WHATSAPP_URL = "https://wa.me/250788564000";
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

type Founder = PublicBoardMember;

/**
 * Founders come from the admin portal (Admin → Board, stored in MongoDB) via
 * /api/board-members. Until that answers, and whenever it can't, the section
 * shows the founders in messages/en.json + messages/fr.json (namespace "Founder"),
 * which are also what the database is first filled with.
 */
function useFounders(fallback: Founder[]) {
  const locale = useLocale();
  const [live, setLive] = useState<Founder[] | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    fetch(`/api/board-members?locale=${locale === "fr" ? "fr" : "en"}`, { signal: controller.signal })
      .then((res) => (res.ok ? (res.json() as Promise<{ items: Founder[] }>) : null))
      .then((data) => {
        if (data && Array.isArray(data.items)) setLive(data.items);
      })
      .catch(() => undefined) // keep the built-in founders
      .finally(() => clearTimeout(timer));
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [locale]);

  return live ?? fallback;
}

/** Local /public files go through Next's optimizer; uploaded photos (/api/…) and outside links are used as they are. */
const isOptimizable = (src: string) => src.startsWith("/") && !src.startsWith("/api/");

function Portrait({ founder, sizes, quality }: { founder: Founder; sizes: string; quality?: number }) {
  const t = useTranslations("Founder");
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  if (!founder.photo || failedSrc === founder.photo) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#125740] to-[#0A1128] text-white">
        <span className="text-5xl font-black tracking-tighter">{founder.initials}</span>
      </div>
    );
  }
  return (
    <Image
      src={founder.photo}
      alt={t("portraitAlt", { name: founder.name })}
      fill
      sizes={sizes}
      quality={quality}
      unoptimized={!isOptimizable(founder.photo)}
      className="object-cover"
      onError={() => setFailedSrc(founder.photo)}
    />
  );
}

const panelContent: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.18 } },
};
const rise: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE } },
};

export function FounderSection() {
  const t = useTranslations("Founder");
  const intro = t.raw("intro") as string[];
  const founders = useFounders(t.raw("founders") as Founder[]);
  const [activeId, setActiveId] = useState<string | null>(null);
  // The card that was clicked: its photo flies into the profile and back. Stepping to
  // another founder inside the profile cross-fades instead.
  const [originId, setOriginId] = useState<string | null>(null);
  const activeIndex = founders.findIndex((f) => f.id === activeId);
  const active = activeIndex >= 0 ? founders[activeIndex] : null;

  // The admin can hide every member; then the section steps aside entirely.
  if (founders.length === 0) return null;

  return (
    <section id="founders" className={`py-28 md:py-32 bg-[#F9F8F6] text-[#0A1128] relative overflow-hidden ${manrope.className}`}>
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 relative z-10">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-start">

          {/* SHARED STORY */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="lg:col-span-5 lg:sticky lg:top-[calc(var(--header-h)+1.25rem)]"
          >
            <div className="inline-flex items-center gap-2 py-1.5 px-3.5 bg-[#125740]/10 border border-[#125740]/20 mb-8 rounded-2xl">
              <ShieldCheck className="w-3.5 h-3.5 text-[#125740]" />
              <span className="text-[#125740] text-[10px] font-black uppercase tracking-[0.3em]">{t("badge")}</span>
            </div>

            <h2 className="text-4xl md:text-6xl font-black text-[#0A1128] mb-8 tracking-tighter leading-[0.95] uppercase">
              {t("title")} <br />
              <span className="text-[#125740]">{t("titleHighlight")}</span>
            </h2>

            <div className="space-y-5 text-gray-600 text-base md:text-lg leading-relaxed">
              {intro.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>

            <p className="mt-8 text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">{t("tapHint")}</p>
          </motion.div>

          {/* FOUNDERS */}
          <div className="lg:col-span-7">
            <div className={`grid grid-cols-1 gap-5 ${founders.length === 2 ? "sm:grid-cols-2" : "sm:grid-cols-3"}`}>
              {founders.map((f, i) => {
                const selected = f.id === activeId;
                return (
                  <motion.button
                    key={f.id}
                    type="button"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.1 * i }}
                    whileHover={{ y: -6 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setOriginId(f.id);
                      setActiveId(f.id);
                    }}
                    aria-haspopup="dialog"
                    aria-expanded={selected}
                    className="group text-left bg-white rounded-2xl overflow-hidden ring-1 ring-black/5 shadow-xl shadow-black/5 hover:shadow-2xl hover:shadow-[#125740]/10 transition-shadow duration-300 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#125740]/30"
                  >
                    <motion.div layoutId={`founder-photo-${f.id}`} className="relative aspect-[4/5] w-full bg-[#125740] overflow-hidden">
                      <div className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-[1.04]">
                        <Portrait founder={f} sizes="(min-width: 1024px) 15rem, (min-width: 640px) 33vw, 100vw" />
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0A1128]/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <span className="absolute bottom-3 right-3 w-9 h-9 rounded-full flex items-center justify-center shadow-lg bg-white text-[#125740] transition-all duration-300 group-hover:bg-[#125740] group-hover:text-white group-hover:rotate-90">
                        <Plus className="w-4 h-4" strokeWidth={2.5} />
                      </span>
                    </motion.div>
                    <div className="p-5">
                      <p className="text-lg font-black tracking-tight leading-tight">{f.name}</p>
                      <p className="text-[10px] text-[#125740] font-black uppercase tracking-[0.25em] mt-1.5">{f.role}</p>
                      {f.tagline && <p className="text-sm text-gray-500 mt-3 leading-snug">{f.tagline}</p>}
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>

        </div>
      </div>

      <AnimatePresence>
        {active && (
          <FounderProfile
            key="profile"
            founder={active}
            sharedPhoto={active.id === originId}
            index={activeIndex}
            total={founders.length}
            onClose={() => setActiveId(null)}
            onStep={(delta) => setActiveId(founders[(activeIndex + delta + founders.length) % founders.length].id)}
          />
        )}
      </AnimatePresence>
    </section>
  )
}

/** The opened card: large portrait, full bio, title, contact and social links. */
function FounderProfile({
  founder,
  sharedPhoto,
  index,
  total,
  onClose,
  onStep,
}: {
  founder: Founder;
  sharedPhoto: boolean;
  index: number;
  total: number;
  onClose: () => void;
  onStep: (delta: 1 | -1) => void;
}) {
  const t = useTranslations("Founder");
  const closeRef = useRef<HTMLButtonElement>(null);
  const titleId = `founder-name-${founder.id}`;

  // Focus moves into the dialog and back to the card afterwards; the page behind doesn't scroll.
  useScrollLock(true);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    closeRef.current?.focus({ preventScroll: true });
    return () => {
      previous?.focus?.({ preventScroll: true });
    };
  }, []);

  const onKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (total > 1 && e.key === "ArrowRight") onStep(1);
      else if (total > 1 && e.key === "ArrowLeft") onStep(-1);
    },
    [onClose, onStep, total],
  );
  useEffect(() => {
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onKey]);

  const email = founder.email || COMPANY_EMAIL;

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-6">
      <motion.div
        className="absolute inset-0 bg-[#0A1128]/60 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        onClick={onClose}
        aria-hidden
      />

      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        initial={{ opacity: 0, y: 40, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.98 }}
        transition={{ duration: 0.45, ease: EASE }}
        className={`relative w-full max-w-4xl max-h-[92dvh] overflow-y-auto bg-white text-[#0A1128] rounded-t-3xl sm:rounded-3xl shadow-2xl ${manrope.className}`}
      >
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label={t("close")}
          className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-white/90 backdrop-blur ring-1 ring-black/5 hover:bg-white hover:rotate-90 flex items-center justify-center text-[#0A1128] shadow-lg transition-all duration-300 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#125740]/30"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="grid md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
          {/* Large portrait, flown in from the card */}
          <motion.div
            layoutId={sharedPhoto ? `founder-photo-${founder.id}` : undefined}
            transition={{ duration: 0.5, ease: EASE }}
            className="relative aspect-[4/5] md:aspect-auto md:min-h-[560px] w-full bg-[#125740] overflow-hidden"
          >
            <AnimatePresence initial={false} mode="popLayout">
              <motion.div
                key={founder.id}
                className="absolute inset-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35 }}
              >
                <Portrait founder={founder} sizes="(min-width: 768px) 24rem, 100vw" quality={90} />
              </motion.div>
            </AnimatePresence>
            <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#0A1128]/50 to-transparent md:hidden" />
          </motion.div>

          {/* Story and contacts */}
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={founder.id}
              variants={panelContent}
              initial="hidden"
              animate="show"
              exit={{ opacity: 0, transition: { duration: 0.15 } }}
              className="p-7 sm:p-10 flex flex-col"
            >
              <motion.p variants={rise} className="text-[10px] text-[#125740] font-black uppercase tracking-[0.3em]">
                {founder.role}
              </motion.p>
              <motion.h3 variants={rise} id={titleId} className="mt-2 text-3xl md:text-4xl font-black tracking-tighter leading-none pr-10">
                {founder.name}
              </motion.h3>
              {founder.tagline && (
                <motion.p variants={rise} className="mt-4 text-lg font-bold text-[#0A1128]/80 leading-snug">
                  {founder.tagline}
                </motion.p>
              )}

              <div className="mt-6 space-y-4 text-gray-600 leading-relaxed">
                {founder.bio.map((p, i) => (
                  <motion.p key={i} variants={rise}>{p}</motion.p>
                ))}
              </div>

              <motion.div variants={rise} className="mt-8 pt-6 border-t border-gray-100">
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.3em] mb-4">{t("contactTitle")}</p>
                <div className="flex flex-wrap items-center gap-3">
                  <motion.a
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    href={`mailto:${email}`}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-50 ring-1 ring-black/5 text-xs font-bold text-[#0A1128] hover:bg-[#125740]/5 transition-colors"
                  >
                    <Mail className="w-4 h-4 text-[#125740]" /> {t("emailLabel")}
                  </motion.a>
                  <motion.a
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    href={WHATSAPP_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#125740] text-xs font-bold text-white hover:bg-[#0E4231] transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" /> {t("whatsappLabel")}
                  </motion.a>
                  {founder.socials.map((s) => {
                    const Icon = getIcon(s.icon);
                    return (
                      <motion.a
                        key={s.id}
                        whileHover={{ y: -3, rotate: -4 }}
                        whileTap={{ scale: 0.92 }}
                        href={s.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`${t("followLabel")} ${founder.name} · ${s.label}`}
                        title={s.label}
                        className="w-10 h-10 rounded-xl bg-gray-50 ring-1 ring-black/5 flex items-center justify-center text-[#0A1128] hover:text-[#125740] hover:bg-[#125740]/5 transition-colors"
                      >
                        <Icon className="w-4 h-4" />
                      </motion.a>
                    );
                  })}
                </div>
              </motion.div>

              {total > 1 && (
                <motion.div variants={rise} className="mt-auto pt-8 flex items-center justify-between gap-4">
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 tabular-nums">
                    {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => onStep(-1)}
                      aria-label={t("previous")}
                      className="w-10 h-10 rounded-full ring-1 ring-black/10 flex items-center justify-center text-[#0A1128] hover:bg-[#125740] hover:text-white hover:ring-[#125740] transition-colors focus:outline-none focus-visible:ring-4 focus-visible:ring-[#125740]/30"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onStep(1)}
                      aria-label={t("next")}
                      className="w-10 h-10 rounded-full ring-1 ring-black/10 flex items-center justify-center text-[#0A1128] hover:bg-[#125740] hover:text-white hover:ring-[#125740] transition-colors focus:outline-none focus-visible:ring-4 focus-visible:ring-[#125740]/30"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
