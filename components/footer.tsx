"use client";

import Image from "next/image";
import { ArrowRight, MapPin, Mail, Phone, type LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { getIcon } from "@/lib/icons";

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
    <footer className={`bg-foreground text-white pt-24 pb-10 relative overflow-hidden`}>
      
      {/* 1. CONTINUOUS INFRASTRUCTURE DOTS - STANDING OUT ON DARK */}
      <div className="absolute inset-0 z-0 pointer-events-none">
      </div>

      <div className="max-w-[1400px] mx-auto px-6 md:px-10 relative z-10 flex flex-col gap-20">
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-16">
          
          {/* COL 1: BRAND SYSTEM */}
          <div className="lg:col-span-2 flex flex-col items-start gap-8">
            <Link href="/" className="inline-block">
               <div className="relative h-12 w-40">
                 <Image 
                    src="/brand/sura-logo.png" 
                    alt="SURA Essence" 
                    fill
                    sizes="160px"
                    className="object-contain brightness-0 invert"
                 />
               </div>
            </Link>
            <p className="text-white/60 text-xs font-bold uppercase tracking-widest leading-relaxed max-w-sm">
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
            <div key={column.id} className="flex flex-col gap-8">
              <h2 className="font-extrabold text-xs uppercase tracking-widest text-secondary">{column.title}</h2>
              <ul className="flex flex-col gap-4 text-xs font-extrabold uppercase tracking-widest text-white/60">
                {column.links.map((link) => (
                  <li key={link.id}><FooterLinkItem {...link} /></li>
                ))}
              </ul>
            </div>
          ))}

          {/* CONTACT */}
          <div className="flex flex-col gap-8">
             <h2 className="font-extrabold text-xs uppercase tracking-widest text-secondary">{t("contactTitle")}</h2>
             <ul className="flex flex-col gap-4 text-xs font-extrabold uppercase tracking-widest text-white/60">
                <li className="flex items-center gap-3">
                   <Phone size={14} className="text-primary" />
                   <a href={`tel:${PHONE.replace(/\s/g, "")}`} className="hover:text-white transition-colors">{PHONE}</a>
                </li>
                <li className="flex items-center gap-3">
                   <Mail size={14} className="text-primary" />
                   <a href={`mailto:${EMAIL}`} className="hover:text-white transition-colors">{EMAIL}</a>
                </li>
                <li className="flex items-center gap-3">
                   <MapPin size={14} className="text-primary" />
                   <span>{t("location")}</span>
                </li>
             </ul>
             
             {/* SHARP RECTANGULAR BUTTON */}
             <a 
               href={WHATSAPP_URL} 
               target="_blank"
               rel="noopener noreferrer"
               className="flex items-center justify-center gap-3 w-full bg-primary hover:bg-card hover:text-foreground text-white font-extrabold py-4 px-6 rounded-2xl transition-all text-xs uppercase tracking-widest"
             >
               {t("whatsapp")} <ArrowRight size={14} />
             </a>
          </div>

        </div>

        {/* FOOTER BOTTOM */}
        <div className="pt-10 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-xs font-extrabold uppercase tracking-widest text-white/60">
            {t("copyright", { year: new Date().getFullYear() })}
          </p>
          
          <div className="flex items-center gap-8 text-xs font-extrabold uppercase tracking-widest text-white/60">
             {legal.map((link) => (
               <FooterLinkItem key={link.id} {...link} />
             ))}
          </div>

          {/* UPDATED CREDIT: BRAVONET TECHNOLOGIES */}
          <div className="flex items-center gap-2 bg-white/5 px-4 py-2 border border-white/10 rounded-2xl">
            <span className="text-xs font-extrabold uppercase tracking-widest text-white/60">{t("poweredBy")}</span>
            <span className="text-xs font-extrabold text-white tracking-widest uppercase">BRAVONET TECHNOLOGIES</span>
          </div>
        </div>

      </div>
    </footer>
  )
}

// A link still set to "#" in messages/*.json has no page yet: it shows as plain
// text (or a plain icon) instead of a link that jumps back to the top.
function SocialIcon({ icon: Icon, label, href }: { icon: LucideIcon; label: string; href: string }) {
   if (href === "#") {
      return (
         <span role="img" aria-label={label} title={label} className="w-12 h-12 bg-white/5 border border-white/10 flex items-center justify-center text-white/60 rounded-2xl">
            <Icon size={16} aria-hidden="true" />
         </span>
      );
   }
   return (
      <a
        href={href}
        aria-label={label}
        title={label}
        {...(href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        className="w-12 h-12 bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:bg-primary hover:text-white transition-all rounded-2xl"
      >
         <Icon size={16} aria-hidden="true" />
      </a>
   )
}

/** Internal pages keep the current language; external addresses open in a new tab. */
function FooterLinkItem({ label, href }: FooterLink) {
   const className = "hover:text-white transition-colors";
   if (href === "#") return <span>{label}</span>;
   if (href.startsWith("/")) {
      return <Link href={href} className={className}>{label}</Link>;
   }
   return (
      <a href={href} className={className} {...(href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
         {label}
      </a>
   );
}