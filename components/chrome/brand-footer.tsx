"use client";

import { ArrowRight, MapPin, Mail, Phone, type LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { getIcon } from "@/lib/icons";
import { BRAVONET_URL, getBrand, type BrandId } from "@/lib/brands";
import { BrandLogo } from "./brand-logo";
import { useSiteContact } from "@/components/site-settings-provider";
import { telHref, whatsAppHref } from "@/lib/cms/site-settings";

// Each brand's description and link columns come from its footer namespace in
// messages/*.json (BrandConfig.footerMessages: "Footer" for SURA Essence,
// "Brands.<id>.footer" for the others). Legal and social links are shared, from
// the Footer namespace; phone, email and WhatsApp come from site settings.
type FooterLink = { id: string; label: string; href: string };
type FooterColumn = { id: string; title: string; links: FooterLink[] };
type SocialLink = { id: string; icon: string; label: string; href: string };

export function BrandFooter({ brand }: { brand: BrandId }) {
  const config = getBrand(brand);
  const t = useTranslations("Footer");
  const tBrand = useTranslations(config.footerMessages);
  const tBrands = useTranslations("Brands");
  const columns = tBrand.raw("columns") as FooterColumn[];
  const legal = t.raw("legal") as FooterLink[];
  const social = t.raw("social") as SocialLink[];
  const contact = useSiteContact();
  const sibling = config.sibling ? getBrand(config.sibling) : null;

  return (
    <footer data-brand={brand} className="bg-foreground text-white pt-24 pb-10 relative overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 relative z-10 flex flex-col gap-20">

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-16">

          <div className="lg:col-span-2 flex flex-col items-start gap-8">
            <Link href={config.homeHref} aria-label={config.name} className="inline-block">
              <BrandLogo brand={brand} tone="light" size="footer" />
            </Link>
            <p className="text-white/60 text-xs font-bold uppercase tracking-widest leading-relaxed max-w-sm">
              {tBrand("description")}
            </p>
            {brand !== "sura" && (
              <Link
                href={getBrand("sura").homeHref}
                className="inline-flex min-h-12 items-center text-xs font-extrabold uppercase tracking-widest text-secondary hover:text-white transition-colors"
              >
                {tBrands("partOf")}
              </Link>
            )}
            <div className="flex gap-3">
              {social.map((item) => (
                <SocialIcon key={item.id} icon={getIcon(item.icon)} label={item.label} href={item.href} />
              ))}
            </div>
          </div>

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

          <div className="flex flex-col gap-8">
            <h2 className="font-extrabold text-xs uppercase tracking-widest text-secondary">{t("contactTitle")}</h2>
            <ul className="flex flex-col gap-4 text-xs font-extrabold uppercase tracking-widest text-white/60">
              <li className="flex items-center gap-3">
                <Phone size={14} className="text-primary-on-dark" />
                <a href={telHref(contact.phone)} className="hover:text-white transition-colors">{contact.phone}</a>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={14} className="shrink-0 text-primary-on-dark" />
                <a href={`mailto:${contact.email}`} className="min-w-0 break-all hover:text-white transition-colors">{contact.email}</a>
              </li>
              <li className="flex items-center gap-3">
                <MapPin size={14} className="text-primary-on-dark" />
                <span>{t("location")}</span>
              </li>
            </ul>

            <a
              href={whatsAppHref(contact.whatsapp)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-12 items-center justify-center gap-3 w-full bg-primary-on-dark hover:bg-card hover:text-foreground text-primary-on-dark-foreground font-extrabold py-4 px-6 rounded-2xl transition-all text-xs uppercase tracking-widest"
            >
              {t("whatsapp")} <ArrowRight size={14} />
            </a>
          </div>

        </div>

        {/* The other sub-brand, one tap away. */}
        {sibling && (
          <Link
            href={sibling.homeHref}
            className="group flex min-h-12 flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-6 py-5 hover:bg-white/10 transition-colors"
          >
            <span className="flex flex-col gap-1">
              <span className="text-xs font-extrabold uppercase tracking-widest text-secondary">{sibling.name}</span>
              <span className="text-sm font-semibold text-white/80">{tBrands(`${config.id}.sibling`)}</span>
            </span>
            <ArrowRight size={16} className="text-white/60 transition-transform group-hover:translate-x-1" aria-hidden="true" />
          </Link>
        )}

        <div className="pt-10 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-xs font-extrabold uppercase tracking-widest text-white/60">
            {t("copyright", { year: new Date().getFullYear() })}
          </p>

          <div className="flex items-center gap-8 text-xs font-extrabold uppercase tracking-widest text-white/60">
            {legal.map((link) => (
              <FooterLinkItem key={link.id} {...link} />
            ))}
          </div>

          <div className="flex items-center gap-2 bg-white/5 px-4 py-2 border border-white/10 rounded-2xl">
            <span className="text-xs font-extrabold uppercase tracking-widest text-white/60">{t("poweredBy")}</span>
            <a href={BRAVONET_URL} target="_blank" rel="noopener noreferrer" className="text-xs font-extrabold text-white tracking-widest uppercase hover:underline underline-offset-2">BRAVONET TECHNOLOGIES</a>
          </div>
        </div>

      </div>
    </footer>
  );
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
      className="w-12 h-12 bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:bg-primary-on-dark hover:text-primary-on-dark-foreground transition-all rounded-2xl"
    >
      <Icon size={16} aria-hidden="true" />
    </a>
  );
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
