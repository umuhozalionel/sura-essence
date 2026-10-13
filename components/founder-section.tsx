"use client"

import { useState } from "react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { Mail, MessageCircle, Plus, ShieldCheck, X } from "lucide-react"
import { Manrope } from "next/font/google";
import { useTranslations } from "next-intl";
import { getIcon } from "@/lib/icons";

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "700", "800"],
  variable: "--font-manrope"
});

// Shared company contacts, used when a founder has no direct email yet.
const COMPANY_EMAIL = "Suraessenceltd@gmail.com";
const WHATSAPP_URL = "https://wa.me/250788564000";

interface Founder {
  id: string;
  name: string;
  initials: string;
  /** Path under /public. Until the file exists the card shows the initials. */
  photo: string;
  role: string;
  tagline: string;
  bio: string[];
  email: string;
  socials: { id: string; icon: string; label: string; href: string }[];
}

function Portrait({ founder, sizes }: { founder: Founder; sizes: string }) {
  const t = useTranslations("Founder");
  const [missing, setMissing] = useState(!founder.photo);

  if (missing) {
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
      className="object-cover"
      onError={() => setMissing(true)}
    />
  );
}

// Copy and founder details come from messages/en.json + messages/fr.json (namespace "Founder").
export function FounderSection() {
  const t = useTranslations("Founder");
  const intro = t.raw("intro") as string[];
  const founders = t.raw("founders") as Founder[];
  const [activeId, setActiveId] = useState<string | null>(null);
  const active = founders.find((f) => f.id === activeId) ?? null;

  return (
    <section id="founders" className={`py-28 md:py-32 bg-[#F9F8F6] text-[#0A1128] relative overflow-hidden ${manrope.className}`}>
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-start">

          {/* SHARED STORY */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="lg:col-span-5 lg:sticky lg:top-32"
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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
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
                    whileHover={{ y: -4 }}
                    onClick={() => setActiveId(selected ? null : f.id)}
                    aria-expanded={selected}
                    aria-controls="founder-bio"
                    className={`group text-left bg-white rounded-2xl overflow-hidden ring-1 transition-shadow duration-300 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#125740]/30 ${
                      selected
                        ? "ring-[#125740] shadow-2xl shadow-[#125740]/15"
                        : "ring-black/5 shadow-xl shadow-black/5 hover:shadow-2xl"
                    }`}
                  >
                    <div className="relative aspect-[4/5] w-full bg-[#125740]">
                      <Portrait founder={f} sizes="(min-width: 1024px) 15rem, (min-width: 640px) 33vw, 100vw" />
                      <span
                        className={`absolute bottom-3 right-3 w-9 h-9 rounded-full flex items-center justify-center shadow-lg transition-colors ${
                          selected ? "bg-[#125740] text-white" : "bg-white text-[#125740]"
                        }`}
                      >
                        <motion.span animate={{ rotate: selected ? 45 : 0 }} transition={{ duration: 0.3 }} className="flex">
                          <Plus className="w-4 h-4" strokeWidth={2.5} />
                        </motion.span>
                      </span>
                    </div>
                    <div className="p-5">
                      <p className="text-lg font-black tracking-tight leading-tight">{f.name}</p>
                      <p className="text-[10px] text-[#125740] font-black uppercase tracking-[0.25em] mt-1.5">{f.role}</p>
                      <p className="text-sm text-gray-500 mt-3 leading-snug">{f.tagline}</p>
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {/* BIO REVEAL */}
            <AnimatePresence mode="wait" initial={false}>
              {active && (
                <motion.div
                  key={active.id}
                  id="founder-bio"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <div className="mt-6 bg-white rounded-2xl ring-1 ring-black/5 shadow-xl shadow-black/5 p-8 md:p-10 relative">
                    <button
                      type="button"
                      onClick={() => setActiveId(null)}
                      aria-label={t("close")}
                      className="absolute top-5 right-5 w-9 h-9 rounded-full bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>

                    <p className="text-2xl font-black tracking-tight pr-12">{active.name}</p>
                    <p className="text-[10px] text-[#125740] font-black uppercase tracking-[0.3em] mt-1">{active.role}</p>

                    <div className="mt-6 space-y-4 text-gray-600 leading-relaxed">
                      {active.bio.map((p, i) => (
                        <motion.p
                          key={i}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4, delay: 0.15 + i * 0.08 }}
                        >
                          {p}
                        </motion.p>
                      ))}
                    </div>

                    <div className="mt-8 pt-6 border-t border-gray-100 flex flex-wrap items-center gap-3">
                      <span className="text-[10px] text-gray-400 font-black uppercase tracking-[0.3em] mr-2">{t("contactTitle")}</span>
                      <a
                        href={`mailto:${active.email || COMPANY_EMAIL}`}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-50 ring-1 ring-black/5 text-xs font-bold text-[#0A1128] hover:bg-[#125740]/5 transition-colors"
                      >
                        <Mail className="w-4 h-4 text-[#125740]" /> {t("emailLabel")}
                      </a>
                      <a
                        href={WHATSAPP_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#125740] text-xs font-bold text-white hover:bg-[#0E4231] transition-colors"
                      >
                        <MessageCircle className="w-4 h-4" /> {t("whatsappLabel")}
                      </a>
                      {active.socials.map((s) => {
                        const Icon = getIcon(s.icon);
                        return (
                          <a
                            key={s.id}
                            href={s.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`${t("followLabel")} ${active.name} · ${s.label}`}
                            className="w-10 h-10 rounded-xl bg-gray-50 ring-1 ring-black/5 flex items-center justify-center text-[#0A1128] hover:text-[#125740] transition-colors"
                          >
                            <Icon className="w-4 h-4" />
                          </a>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>
      </div>
    </section>
  )
}
