"use client"

import { Download, Plane, CreditCard, Info, Zap } from "lucide-react"
import { motion } from "framer-motion"
import { useTranslations } from "next-intl";
import { getIcon } from "@/lib/icons";

// Checklist items come from messages/en.json + messages/fr.json (namespace "LeadMagnet").
type ChecklistItem = { id: string; icon: string; title: string; description: string };

export function LeadMagnet() {
  const t = useTranslations("LeadMagnet");
  const checklist = t.raw("checklist") as ChecklistItem[];

  // Always follows a cream section (Home founders, Tours listings), so it adds no top padding of its own.
  return (
    <section className={`pt-0 pb-24 md:pb-32 bg-background text-foreground relative overflow-hidden`}>
      
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

      <div className="max-w-[1400px] mx-auto px-6 md:px-10 relative z-10">
        
        <div className="grid lg:grid-cols-12 gap-16 items-start">
          
          {/* 2. LEFT CONTENT: Editorial/Vlog Style */}
          <div className="lg:col-span-7 flex flex-col items-start gap-4">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 py-1.5 px-3.5 bg-primary/10 border border-primary/20 rounded-2xl"
            >
              <Zap className="w-3.5 h-3.5 text-primary fill-primary" />
              <span className="text-primary text-xs font-extrabold uppercase tracking-widest">{t("badge")}</span>
            </motion.div>
            
            <motion.h3 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="text-5xl md:text-7xl font-extrabold text-foreground tracking-tighter leading-[0.95] uppercase"
            >
              {t("title")} <br />
              <span className="text-primary">{t("titleHighlight")}</span>
            </motion.h3>
            
            <motion.div 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col gap-6 text-muted-foreground max-w-xl mb-8"
            >
              <p className="text-lg font-bold leading-relaxed uppercase tracking-tight">
                {t("intro")}
              </p>
              
              <div className="bg-muted/40 border-l-4 border-primary p-5 rounded-2xl">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="w-4 h-4 text-primary" />
                  <span className="text-foreground text-xs font-extrabold uppercase tracking-widest">{t("tipTitle")}</span>
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
                className="inline-flex h-16 px-10 bg-primary hover:bg-primary-hover text-white rounded-2xl items-center gap-3 transition-all font-extrabold uppercase tracking-widest text-sm shadow-xl"
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
              className="bg-card rounded-2xl ring-1 ring-black/5 p-6 md:p-10 shadow-2xl shadow-black/10 relative z-10 flex flex-col gap-8"
            >
              <div className="flex items-center justify-between pb-4 border-b border-border">
                <span className="text-xs font-extrabold text-muted-foreground uppercase tracking-widest">{t("checklistLabel")}</span>
                <div className="flex gap-2">
                   <div className="w-2 h-2 bg-success" />
                   <div className="w-2 h-2 bg-muted/70" />
                   <div className="w-2 h-2 bg-muted/70" />
                </div>
              </div>

              <div className="flex flex-col gap-8">
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
                    <div className="w-10 h-10 bg-muted/40 rounded-2xl ring-1 ring-black/5 flex items-center justify-center shrink-0 group-hover:border-primary/30 transition-colors">
                       <Icon className="w-5 h-5 text-primary" strokeWidth={2} />
                    </div>
                    <div>
                      <p className="text-foreground text-sm font-extrabold uppercase tracking-tight mb-1">{item.title}</p>
                      <p className="text-muted-foreground text-xs leading-relaxed font-bold uppercase tracking-tighter">{item.description}</p>
                    </div>
                  </motion.div>
                  );
                })}
              </div>

              <div className="pt-6 border-t border-border text-center">
                 <p className="text-xs text-muted-foreground uppercase tracking-widest font-extrabold italic">{t("verified")}</p>
              </div>
            </motion.div>
            
            <div className="hidden md:block absolute -bottom-6 -right-6 w-full h-full rounded-2xl ring-1 ring-black/5 -z-10 bg-muted/40" />
          </div>

        </div>
      </div>
    </section>
  )
}