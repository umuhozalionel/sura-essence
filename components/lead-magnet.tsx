"use client"

import { Download, Plane, CreditCard, Info, Zap } from "lucide-react"
import { motion } from "framer-motion"
import { Manrope } from "next/font/google";
import { useTranslations } from "next-intl";
import { getIcon } from "@/lib/icons";

const manrope = Manrope({ 
  subsets: ["latin"], 
  weight: ["400", "500", "700", "800"],
  variable: "--font-manrope"
});

// Checklist items come from messages/en.json + messages/fr.json (namespace "LeadMagnet").
type ChecklistItem = { id: string; icon: string; title: string; description: string };

export function LeadMagnet() {
  const t = useTranslations("LeadMagnet");
  const checklist = t.raw("checklist") as ChecklistItem[];

  return (
    <section className={`py-28 md:py-32 bg-[#F9F8F6] text-[#0A1128] relative overflow-hidden ${manrope.className}`}>
      
      {/* 1. BACKGROUND DECOR: GRIDS + SIDE DOTS */}
      <div className="absolute inset-0 z-0">
         {/* Industrial Grid */}
         
         {/* Side Dots */}
      </div>
      
      {/* Animated Styled Icons */}
      <motion.div 
        initial={{ opacity: 0, x: -100, rotate: -15 }}
        whileInView={{ opacity: 0.04, x: 0, rotate: -12 }}
        transition={{ duration: 2, ease: "easeOut" }}
        className="absolute top-20 -left-20 pointer-events-none"
      >
        <Plane size={400} strokeWidth={0.5} />
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, x: 100, rotate: 15 }}
        whileInView={{ opacity: 0.04, x: 0, rotate: 12 }}
        transition={{ duration: 2, ease: "easeOut" }}
        className="absolute bottom-10 -right-20 pointer-events-none"
      >
        <CreditCard size={450} strokeWidth={0.5} />
      </motion.div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        
        <div className="grid lg:grid-cols-12 gap-16 items-start">
          
          {/* 2. LEFT CONTENT: Editorial/Vlog Style */}
          <div className="lg:col-span-7">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 py-1.5 px-3.5 bg-[#125740]/10 border border-[#125740]/20 mb-8 rounded-2xl"
            >
              <Zap className="w-3.5 h-3.5 text-[#125740] fill-[#125740]" />
              <span className="text-[#125740] text-[10px] font-black uppercase tracking-[0.3em]">{t("badge")}</span>
            </motion.div>
            
            <motion.h3 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="text-5xl md:text-7xl font-black text-[#0A1128] mb-8 tracking-tighter leading-[0.95] uppercase"
            >
              {t("title")} <br />
              <span className="text-[#125740]">{t("titleHighlight")}</span>
            </motion.h3>
            
            <motion.div 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="space-y-6 text-gray-500 mb-12 max-w-xl"
            >
              <p className="text-lg font-bold leading-relaxed uppercase tracking-tight">
                {t("intro")}
              </p>
              
              <div className="bg-gray-50 border-l-4 border-[#125740] p-5 rounded-2xl">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="w-4 h-4 text-[#125740]" />
                  <span className="text-[#0A1128] text-xs font-black uppercase tracking-widest">{t("tipTitle")}</span>
                </div>
                <p className="text-sm italic font-medium">
                  {t("quote", { text: t("tip") })}
                </p>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <a 
                href={t("guideHref")} 
                download
                className="inline-flex h-16 px-10 bg-[#125740] hover:bg-[#0E4231] text-white rounded-2xl items-center gap-3 transition-all font-black uppercase tracking-widest text-sm shadow-xl"
              >
                <Download className="w-5 h-5" />
                <span>{t("cta")}</span>
              </a>
            </motion.div>
          </div>

          {/* 3. RIGHT CONTENT: Animated Visual Checklist */}
          <div className="lg:col-span-5 relative">
            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="bg-white rounded-2xl ring-1 ring-black/5 rounded-2xl p-10 shadow-2xl shadow-black/10 relative z-10"
            >
              <div className="flex items-center justify-between mb-10 pb-4 border-b border-gray-50">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">{t("checklistLabel")}</span>
                <div className="flex gap-2">
                   <div className="w-2 h-2 bg-green-500" />
                   <div className="w-2 h-2 bg-gray-100" />
                   <div className="w-2 h-2 bg-gray-100" />
                </div>
              </div>

              <div className="space-y-8">
                {checklist.map((item, i) => {
                  const Icon = getIcon(item.icon);
                  return (
                  <motion.div 
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + (i * 0.1) }}
                    className="flex items-start gap-5 group"
                  >
                    <div className="w-10 h-10 bg-gray-50 rounded-2xl ring-1 ring-black/5 flex items-center justify-center shrink-0 group-hover:border-[#125740]/30 transition-colors rounded-2xl">
                       <Icon className="w-5 h-5 text-[#125740]" strokeWidth={2} />
                    </div>
                    <div>
                      <p className="text-[#0A1128] text-sm font-black uppercase tracking-tight mb-1">{item.title}</p>
                      <p className="text-gray-400 text-[11px] leading-relaxed font-bold uppercase tracking-tighter">{item.description}</p>
                    </div>
                  </motion.div>
                  );
                })}
              </div>

              <div className="mt-10 pt-6 border-t border-gray-50 text-center">
                 <p className="text-[9px] text-gray-400 uppercase tracking-[0.4em] font-black italic">{t("verified")}</p>
              </div>
            </motion.div>
            
            <div className="absolute -bottom-6 -right-6 w-full h-full rounded-2xl ring-1 ring-black/5 rounded-2xl -z-10 bg-gray-50/50" />
          </div>

        </div>
      </div>
    </section>
  )
}