"use client"

import { useState } from "react"
import Image from "next/image"
import { motion } from "framer-motion"
import { Quote, ShieldCheck } from "lucide-react"
import { Manrope } from "next/font/google";
import { useTranslations } from "next-intl";

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "700", "800"],
  variable: "--font-manrope"
});

const PORTRAIT_SRC = "/images/team/founder-placeholder.jpg";

// Copy comes from messages/en.json + messages/fr.json (namespace "Founder").
export function FounderSection() {
  const t = useTranslations("Founder");
  const paragraphs = t.raw("paragraphs") as string[];
  // Until the portrait file is added, show a branded panel instead of a broken image.
  const [portraitMissing, setPortraitMissing] = useState(false);

  return (
    <section className={`py-28 md:py-32 bg-[#F9F8F6] text-[#0A1128] relative overflow-hidden ${manrope.className}`}>
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">

          {/* PORTRAIT */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="lg:col-span-5 relative"
          >
            <div className="relative aspect-[4/5] w-full max-w-md mx-auto overflow-hidden rounded-2xl ring-1 ring-black/5 shadow-2xl shadow-black/10 bg-[#125740]">
              {portraitMissing ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-[#125740] to-[#0A1128] text-white">
                  <span className="text-6xl font-black tracking-tighter">L &amp; C</span>
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/60">{t("portraitAlt")}</span>
                </div>
              ) : (
                <Image
                  src={PORTRAIT_SRC}
                  alt={t("portraitAlt")}
                  fill
                  sizes="(min-width: 1024px) 28rem, 100vw"
                  className="object-cover"
                  onError={() => setPortraitMissing(true)}
                />
              )}
            </div>
            <div className="absolute -bottom-6 -right-2 lg:right-6 w-full max-w-md h-full rounded-2xl ring-1 ring-black/5 -z-10 bg-gray-50/50" />
          </motion.div>

          {/* MESSAGE */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.15 }}
            className="lg:col-span-7"
          >
            <div className="inline-flex items-center gap-2 py-1.5 px-3.5 bg-[#125740]/10 border border-[#125740]/20 mb-8 rounded-2xl">
              <ShieldCheck className="w-3.5 h-3.5 text-[#125740]" />
              <span className="text-[#125740] text-[10px] font-black uppercase tracking-[0.3em]">{t("badge")}</span>
            </div>

            <h2 className="text-4xl md:text-6xl font-black text-[#0A1128] mb-8 tracking-tighter leading-[0.95] uppercase">
              {t("title")} <br />
              <span className="text-[#125740]">{t("titleHighlight")}</span>
            </h2>

            <div className="bg-white rounded-2xl ring-1 ring-black/5 shadow-xl shadow-black/5 p-8 md:p-10 relative">
              <Quote className="absolute top-6 right-6 w-10 h-10 text-[#125740]/10" />
              <div className="space-y-5 text-gray-600 text-base md:text-lg leading-relaxed">
                {paragraphs.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>

              <div className="mt-8 pt-6 border-t border-gray-100">
                <p className="text-[#0A1128] text-lg font-black tracking-tight">{t("signature")}</p>
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.3em] mt-1">{t("signatureRole")}</p>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  )
}
