"use client";

import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Layers, MessageCircle } from "lucide-react";
import { manrope } from "@/lib/fonts";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { getIcon } from "@/lib/icons";


const WHATSAPP_NUMBER = "250788564000";

interface Step { id: string; icon: string; title: string; desc: string }

// Copy lives in messages/*.json under "SeamlessStay".
export function SeamlessStaySection() {
  const t = useTranslations("SeamlessStay");
  const steps = t.raw("steps") as Step[];
  const highlights = t.raw("highlights") as string[];
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(t("whatsappText"))}`;

  return (
    <section id="seamless-stay" className={`py-28 md:py-32 bg-white text-[#0A1128] overflow-hidden ${manrope.className}`}>
      <div className="max-w-[1400px] mx-auto px-6 md:px-10">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-16 items-end mb-16">
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-2 py-1.5 px-3.5 bg-[#125740]/10 border border-[#125740]/20 mb-8 rounded-2xl">
              <Layers className="w-3.5 h-3.5 text-[#125740]" />
              <span className="text-[#125740] text-[10px] font-black uppercase tracking-[0.3em]">{t("badge")}</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter leading-[0.95] uppercase">
              {t("title")} <br />
              <span className="text-[#125740]">{t("titleHighlight")}</span>
            </h2>
          </div>
          <div className="lg:col-span-5">
            <p className="text-gray-500 text-base md:text-lg leading-relaxed">{t("subtitle")}</p>
            <ul className="mt-6 flex flex-wrap gap-2">
              {highlights.map((h) => (
                <li key={h} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F9F8F6] ring-1 ring-black/5 text-xs font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#125740]" /> {h}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* JOURNEY: a horizontal line of stops on desktop, a vertical one on mobile */}
        <div className="relative">
        <div aria-hidden="true" className="hidden lg:block absolute top-10 left-[10%] right-[10%] h-px bg-gradient-to-r from-[#125740]/10 via-[#125740]/40 to-[#125740]/10" />
        <div aria-hidden="true" className="lg:hidden absolute top-6 bottom-6 left-10 w-px bg-[#125740]/20" />
        <ol className="relative grid grid-cols-1 lg:grid-cols-5 gap-4 lg:gap-5">
          {steps.map((s, i) => {
            const Icon = getIcon(s.icon);
            return (
              <motion.li
                key={s.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="relative flex lg:flex-col items-start lg:items-center gap-5 lg:gap-0 lg:text-center"
              >
                <div className="relative z-10 shrink-0 w-20 h-20 rounded-2xl bg-white ring-1 ring-black/5 shadow-xl shadow-black/5 flex items-center justify-center">
                  <Icon className="w-7 h-7 text-[#125740]" strokeWidth={1.75} />
                  <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#0A1128] text-white text-[10px] font-black flex items-center justify-center">
                    {i + 1}
                  </span>
                </div>
                <div className="lg:mt-6 flex-1 rounded-2xl bg-[#F9F8F6] ring-1 ring-black/5 p-5 lg:min-h-[10rem] w-full">
                  <p className="font-black tracking-tight">{s.title}</p>
                  <p className="mt-2 text-sm text-gray-500 leading-relaxed">{s.desc}</p>
                </div>
              </motion.li>
            );
          })}
        </ol>
        </div>

        <div className="mt-14 flex flex-wrap gap-3">
          <Link
            href="/book"
            className="group inline-flex items-center gap-2 px-7 py-4 rounded-xl bg-[#125740] text-white text-[11px] font-black uppercase tracking-wide shadow-lg shadow-[#125740]/20 hover:bg-[#0E4231] transition-colors"
          >
            {t("cta")} <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-7 py-4 rounded-xl bg-white ring-1 ring-black/10 text-[#0A1128] text-[11px] font-black uppercase tracking-wide hover:bg-gray-50 transition-colors"
          >
            <MessageCircle className="w-4 h-4 text-[#125740]" /> {t("whatsapp")}
          </a>
        </div>
      </div>
    </section>
  );
}
