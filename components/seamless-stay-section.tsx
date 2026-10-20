"use client";

import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Layers, MessageCircle } from "lucide-react";
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
    <section id="seamless-stay" className={`pt-0 pb-24 md:pb-32 bg-background text-foreground overflow-hidden`}>
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 flex flex-col gap-12 md:gap-16">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-16 items-end">
          <div className="lg:col-span-7 flex flex-col items-start gap-4">
            <div className="inline-flex items-center gap-2 py-1.5 px-3.5 bg-primary/10 border border-primary/20 rounded-2xl">
              <Layers className="w-3.5 h-3.5 text-primary" />
              <span className="text-primary text-xs font-extrabold uppercase tracking-widest">{t("badge")}</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-extrabold tracking-tighter leading-[0.95] uppercase">
              {t("title")} <br />
              <span className="text-primary">{t("titleHighlight")}</span>
            </h2>
          </div>
          <div className="lg:col-span-5 flex flex-col gap-6">
            <p className="text-muted-foreground text-base md:text-lg leading-relaxed">{t("subtitle")}</p>
            <ul className="flex flex-wrap gap-2">
              {highlights.map((h) => (
                <li key={h} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-background ring-1 ring-black/5 text-xs font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-primary" /> {h}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* JOURNEY: a horizontal line of stops on desktop, a vertical one on mobile */}
        <div className="relative">
        <div aria-hidden="true" className="hidden lg:block absolute top-10 left-[10%] right-[10%] h-px bg-gradient-to-r from-primary/10 via-primary/40 to-primary/10" />
        <div aria-hidden="true" className="lg:hidden absolute top-6 bottom-6 left-10 w-px bg-primary/20" />
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
                <div className="relative z-10 shrink-0 w-20 h-20 rounded-2xl bg-card ring-1 ring-black/5 shadow-xl shadow-black/5 flex items-center justify-center">
                  <Icon className="w-7 h-7 text-primary" strokeWidth={1.75} />
                  <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-foreground text-white text-xs font-extrabold flex items-center justify-center">
                    {i + 1}
                  </span>
                </div>
                <div className="lg:mt-6 flex-1 rounded-2xl bg-background ring-1 ring-black/5 p-5 lg:min-h-[10rem] w-full">
                  <p className="font-extrabold tracking-tight">{s.title}</p>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                </div>
              </motion.li>
            );
          })}
        </ol>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/contact"
            className="group inline-flex items-center gap-2 px-7 py-4 rounded-xl bg-primary text-white text-xs font-extrabold uppercase tracking-wide shadow-lg shadow-primary/20 hover:bg-primary-hover transition-colors"
          >
            {t("cta")} <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-7 py-4 rounded-xl bg-card ring-1 ring-black/10 text-foreground text-xs font-extrabold uppercase tracking-wide hover:bg-muted/40 transition-colors"
          >
            <MessageCircle className="w-4 h-4 text-primary" /> {t("whatsapp")}
          </a>
        </div>
      </div>
    </section>
  );
}
