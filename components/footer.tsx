"use client";

import Image from "next/image";
import { ArrowRight, MapPin, Mail, Phone, type LucideIcon } from "lucide-react";
import { Manrope } from "next/font/google";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { getIcon } from "@/lib/icons";

const manrope = Manrope({ 
  subsets: ["latin"], 
  weight: ["400", "500", "700", "800"],
  variable: "--font-manrope"
});

// Contact details (not translated — the same in every language)
const PHONE = "+250 788 845 062";
const EMAIL = "Suraessenceltd@gmail.com";
const WHATSAPP_URL = "https://wa.me/250788564000";

// Link columns, legal links and social links come from messages/en.json + messages/fr.json
// (namespace "Footer"). Add a link or a whole column by editing those two files only.
type FooterLink = { id: string; label: string; href: string };
type FooterColumn = { id: string; title: string; links: FooterLink[] };
type SocialLink = { id: string; icon: string; label: string; href: string };

export function Footer() {
  const t = useTranslations("Footer");
  const columns = t.raw("columns") as FooterColumn[];
  const legal = t.raw("legal") as FooterLink[];
  const social = t.raw("social") as SocialLink[];

  return (
    <footer className={`bg-[#111827] text-white pt-24 pb-10 relative overflow-hidden ${manrope.className}`}>
      
      {/* 1. CONTINUOUS INFRASTRUCTURE DOTS - STANDING OUT ON DARK */}
      <div className="absolute inset-0 z-0 pointer-events-none">
         <div className="absolute left-0 top-0 bottom-0 w-24 opacity-10"
              style={{ backgroundImage: 'radial-gradient(#F5F2EA 1.5px, transparent 1.5px)', backgroundSize: '12px 12px' }} />
         <div className="absolute right-0 top-0 bottom-0 w-24 opacity-10"
              style={{ backgroundImage: 'radial-gradient(#F5F2EA 1.5px, transparent 1.5px)', backgroundSize: '12px 12px' }} />
      </div>

      <div className="max-w-[1600px] mx-auto px-10 relative z-10">
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-16 mb-20">
          
          {/* COL 1: BRAND SYSTEM */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-block mb-8">
               <div className="relative h-12 w-40">
                 <Image 
                    src="/brand/sura-logo.png" 
                    alt="SURA Essence" 
                    fill
                    className="object-contain brightness-0 invert" 
                 />
               </div>
            </Link>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest leading-relaxed mb-10 max-w-sm">
              {t("description")}
            </p>
            <div className="flex gap-3">
              {social.map((item) => (
                <SocialIcon key={item.id} icon={getIcon(item.icon)} label={item.label} href={item.href} />
              ))}
            </div>
          </div>

          {/* LINK COLUMNS (from the message files) */}
          {columns.map((column) => (
            <div key={column.id}>
              <h4 className="font-black text-[10px] uppercase tracking-[0.4em] mb-8 text-[#C97C2F]">{column.title}</h4>
              <ul className="space-y-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                {column.links.map((link) => (
                  <li key={link.id}><FooterLinkItem {...link} /></li>
                ))}
              </ul>
            </div>
          ))}

          {/* CONTACT */}
          <div>
             <h4 className="font-black text-[10px] uppercase tracking-[0.4em] mb-8 text-[#C97C2F]">{t("contactTitle")}</h4>
             <ul className="space-y-4 text-[10px] font-black uppercase tracking-widest text-slate-400 mb-10">
                <li className="flex items-center gap-3">
                   <Phone size={14} className="text-[#C97C2F]" />
                   <a href={`tel:${PHONE.replace(/\s/g, "")}`} className="hover:text-white transition-colors">{PHONE}</a>
                </li>
                <li className="flex items-center gap-3">
                   <Mail size={14} className="text-[#C97C2F]" />
                   <a href={`mailto:${EMAIL}`} className="hover:text-white transition-colors">{EMAIL}</a>
                </li>
                <li className="flex items-center gap-3">
                   <MapPin size={14} className="text-[#C97C2F]" />
                   <span>{t("location")}</span>
                </li>
             </ul>
             
             {/* SHARP RECTANGULAR BUTTON */}
             <a 
               href={WHATSAPP_URL} 
               target="_blank"
               rel="noopener noreferrer"
               className="flex items-center justify-center gap-3 w-full bg-[#C97C2F] hover:bg-white hover:text-[#111827] text-white font-black py-4 px-6 rounded-none transition-all text-[10px] uppercase tracking-[0.3em]"
             >
               {t("whatsapp")} <ArrowRight size={14} />
             </a>
          </div>

        </div>

        {/* FOOTER BOTTOM */}
        <div className="pt-10 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">
            {t("copyright", { year: new Date().getFullYear() })}
          </p>
          
          <div className="flex items-center gap-8 text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">
             {legal.map((link) => (
               <FooterLinkItem key={link.id} {...link} />
             ))}
          </div>

          {/* UPDATED CREDIT: BRAVONET TECHNOLOGIES */}
          <div className="flex items-center gap-2 bg-slate-900 px-4 py-2 border border-slate-800 rounded-none">
            <span className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-500">{t("poweredBy")}</span>
            <span className="text-[9px] font-black text-white tracking-[0.4em] uppercase">BRAVONET TECHNOLOGIES</span>
          </div>
        </div>

      </div>
    </footer>
  )
}

function SocialIcon({ icon: Icon, label, href }: { icon: LucideIcon; label: string; href: string }) {
   return (
      <a
        href={href}
        aria-label={label}
        title={label}
        {...(href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        className="w-10 h-10 bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:bg-[#C97C2F] hover:text-white transition-all rounded-none"
      >
         <Icon size={16} />
      </a>
   )
}

/** Internal pages keep the current language; "#" and external addresses stay plain links. */
function FooterLinkItem({ label, href }: FooterLink) {
   const className = "hover:text-white transition-colors";
   if (href.startsWith("/")) {
      return <Link href={href} className={className}>{label}</Link>;
   }
   return (
      <a href={href} className={className} {...(href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
         {label}
      </a>
   );
}