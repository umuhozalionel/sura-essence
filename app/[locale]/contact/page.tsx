"use client";

import { useState, useEffect } from "react";
import { Manrope } from "next/font/google";
import { motion } from "framer-motion";
import {
  MessageCircle,
  MapPin,
  Clock,
  ChevronRight,
  Check,
  User,
  Smartphone,
  FileText,
  AlertCircle,
  ExternalLink,
  AtSign,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { getIcon } from "@/lib/icons";

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "700", "800"],
  variable: "--font-manrope",
});

/* ─────────────────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────────────────── */
const WA_NUMBER  = "250788564000";
const WA_LINK    = `https://wa.me/${WA_NUMBER}`;
const PHONE_DISPLAY = "+250 788 564 000";
const EMAIL      = "hello@sura.rw";

/**
 * Text, services, opening hours, channels and stats live in
 * messages/en.json + messages/fr.json (namespace "Contact").
 * Add a service or an opening-hours row by editing those two files.
 */

/* ─────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────── */
interface FormState {
  name:    string;
  email:   string;
  phone:   string;
  service: string;
  message: string;
}

interface FieldErrors {
  name?:    string;
  email?:   string;
  service?: string;
  message?: string;
}

interface Channel {
  id: string;
  icon: string;
  label: string;
  detail: string;
  cta: string;
}

interface ServiceOption {
  id: string;
  label: string;
}

interface HourRow {
  id: string;
  days: string;
  time: string;
}

interface SocialLink {
  id: string;
  icon: string;
  label: string;
}

interface Stat {
  id: string;
  value: string;
  label: string;
}

/** WhatsApp / phone / email targets, keyed by the channel id used in the messages. */
const CHANNEL_HREF: Record<string, string> = {
  whatsapp: WA_LINK,
  phone: `tel:${WA_NUMBER}`,
  email: `mailto:${EMAIL}`,
};

const CHANNEL_VALUE: Record<string, string> = {
  whatsapp: PHONE_DISPLAY,
  phone: PHONE_DISPLAY,
  email: EMAIL,
};

const CHANNEL_STYLE: Record<
  string,
  { accent: string; bg: string; border: string; featured: boolean }
> = {
  whatsapp: { accent: "#125740", bg: "bg-[#125740]", border: "", featured: true },
  phone:    { accent: "#125740", bg: "bg-white", border: "border border-gray-200", featured: false },
  email:    { accent: "#125740", bg: "bg-white", border: "border border-gray-200", featured: false },
};

const SOCIAL_HREF: Record<string, string> = {
  instagram: "https://instagram.com/sura.rw",
  whatsapp: WA_LINK,
  email: `mailto:${EMAIL}`,
};

const SOCIAL_COLOR: Record<string, string> = {
  instagram: "#125740",
  whatsapp: "#EAB308",
  email: "#125740",
};

/* These sit on a light strip, so all three use the green ink.
   Gold is reserved for fills and for accents on dark surfaces. */
const STAT_COLOR: Record<string, string> = {
  response: "#125740",
  support: "#125740",
  confirmation: "#0E4231",
};

/* ─────────────────────────────────────────────────────────
   CONTACT FORM
───────────────────────────────────────────────────────── */
function ContactForm() {
  const t = useTranslations("Contact.form");
  const te = useTranslations("Contact.form.errors");
  const services = t.raw("services") as ServiceOption[];

  const [form, setForm] = useState<FormState>({
    name:    "",
    email:   "",
    phone:   "",
    service: "",
    message: "",
  });
  const [errors, setErrors]   = useState<FieldErrors>({});
  const [sent, setSent]       = useState(false);
  const [focused, setFocused] = useState<string | null>(null);

  const set = (field: keyof FormState) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    if (errors[field as keyof FieldErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validate = (): boolean => {
    const e: FieldErrors = {};
    if (!form.name.trim())    e.name    = te("name");
    if (!form.email.trim())   e.email   = te("email");
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = te("emailInvalid");
    if (!form.service)        e.service = te("service");
    if (!form.message.trim()) e.message = te("message");
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    const text = encodeURIComponent(
      `${t("waGreeting")}\n\n` +
      `*${t("waName")}:* ${form.name}\n` +
      `*${t("waEmail")}:* ${form.email}\n` +
      (form.phone ? `*${t("waPhone")}:* ${form.phone}\n` : "") +
      `*${t("waService")}:* ${form.service}\n\n` +
      `*${t("waMessage")}:*\n${form.message}`
    );
    window.open(`${WA_LINK}?text=${text}`, "_blank");
    setSent(true);
  };

  if (sent) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="h-full flex flex-col items-center justify-center text-center py-20 px-8"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.15, type: "spring", stiffness: 260, damping: 22 }}
          className="w-20 h-20 rounded-full bg-[#EAB308] flex items-center justify-center mb-8 shadow-lg"
        >
          <Check size={32} className="text-white" strokeWidth={3} />
        </motion.div>
        <h3 className="text-2xl font-black text-[#0A1128] tracking-tight mb-3">
          {t("sentTitle")}
        </h3>
        <p className="text-sm text-gray-500 font-medium leading-relaxed max-w-xs mb-8">
          {t("sentText")}
        </p>
        <button
          onClick={() => { setSent(false); setForm({ name: "", email: "", phone: "", service: "", message: "" }); }}
          className="text-[11px] font-bold uppercase tracking-widest text-gray-400 hover:text-[#0A1128] transition-colors"
        >
          {t("sendAnother")}
        </button>
      </motion.div>
    );
  }

  const fieldBase =
    "w-full px-4 py-3 text-sm font-bold text-[#0A1128] bg-white border rounded-sm outline-none placeholder:text-gray-300 placeholder:font-medium transition-all duration-200";
  const fieldIdle    = "border-gray-200 hover:border-gray-300";
  const fieldFocused = "border-[#125740] ring-1 ring-[#125740]/20";
  const fieldError   = "border-red-400 ring-1 ring-red-200";

  const cls = (name: string, err?: string) =>
    `${fieldBase} ${err ? fieldError : focused === name ? fieldFocused : fieldIdle}`;

  return (
    <div className="space-y-5">
      {/* Name + Email */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">
            {t("nameLabel")} <span className="text-[#125740]">*</span>
          </label>
          <div className="relative">
            <User size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
            <input
              type="text"
              placeholder={t("namePlaceholder")}
              value={form.name}
              onChange={set("name")}
              onFocus={() => setFocused("name")}
              onBlur={() => setFocused(null)}
              className={`${cls("name", errors.name)} pl-9`}
            />
          </div>
          {errors.name && (
            <p className="mt-1 text-[10px] font-bold text-red-500 flex items-center gap-1">
              <AlertCircle size={10} /> {errors.name}
            </p>
          )}
        </div>

        <div>
          <label className="block text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">
            {t("emailLabel")} <span className="text-[#125740]">*</span>
          </label>
          <div className="relative">
            <AtSign size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
            <input
              type="email"
              placeholder={t("emailPlaceholder")}
              value={form.email}
              onChange={set("email")}
              onFocus={() => setFocused("email")}
              onBlur={() => setFocused(null)}
              className={`${cls("email", errors.email)} pl-9`}
            />
          </div>
          {errors.email && (
            <p className="mt-1 text-[10px] font-bold text-red-500 flex items-center gap-1">
              <AlertCircle size={10} /> {errors.email}
            </p>
          )}
        </div>
      </div>

      {/* Phone + Service */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">
            {t("phoneLabel")}{" "}
            <span className="text-gray-300 normal-case tracking-normal font-medium">
              {t("optional")}
            </span>
          </label>
          <div className="relative">
            <Smartphone size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
            <input
              type="tel"
              placeholder={t("phonePlaceholder")}
              value={form.phone}
              onChange={set("phone")}
              onFocus={() => setFocused("phone")}
              onBlur={() => setFocused(null)}
              className={`${cls("phone")} pl-9`}
            />
          </div>
        </div>

        <div>
          <label className="block text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">
            {t("serviceLabel")} <span className="text-[#125740]">*</span>
          </label>
          <div className="relative">
            <FileText size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
            <select
              value={form.service}
              onChange={set("service")}
              onFocus={() => setFocused("service")}
              onBlur={() => setFocused(null)}
              className={`${cls("service", errors.service)} pl-9 appearance-none`}
            >
              <option value="" disabled>
                {t("servicePlaceholder")}
              </option>
              {services.map((service) => (
                <option key={service.id} value={service.label}>
                  {service.label}
                </option>
              ))}
            </select>
            <ChevronRight
              size={13}
              className="absolute right-3 top-1/2 -translate-y-1/2 rotate-90 text-gray-300 pointer-events-none"
            />
          </div>
          {errors.service && (
            <p className="mt-1 text-[10px] font-bold text-red-500 flex items-center gap-1">
              <AlertCircle size={10} /> {errors.service}
            </p>
          )}
        </div>
      </div>

      {/* Message */}
      <div>
        <label className="block text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">
          {t("messageLabel")} <span className="text-[#125740]">*</span>
        </label>
        <textarea
          rows={5}
          placeholder={t("messagePlaceholder")}
          value={form.message}
          onChange={set("message")}
          onFocus={() => setFocused("message")}
          onBlur={() => setFocused(null)}
          className={`${cls("message", errors.message)} resize-none`}
        />
        {errors.message && (
          <p className="mt-1 text-[10px] font-bold text-red-500 flex items-center gap-1">
            <AlertCircle size={10} /> {errors.message}
          </p>
        )}
      </div>

      {/* Submit */}
      <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onClick={handleSubmit}
        className="w-full h-14 bg-[#125740] hover:bg-[#0E4231] text-white flex items-center justify-center gap-3 text-[11px] font-black uppercase tracking-widest rounded-sm shadow-lg transition-colors"
      >
        <MessageCircle size={16} />
        {t("submit")}
      </motion.button>

      <p className="text-center text-[10px] text-gray-400 font-medium">
        {t("disclaimer")}
      </p>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   PAGE
───────────────────────────────────────────────────────── */
export default function ContactPage() {
  const t = useTranslations("Contact");
  const tf = useTranslations("Contact.form");
  const tl = useTranslations("Contact.location");
  const th = useTranslations("Contact.hours");

  const channels = t.raw("channels") as Channel[];
  const socials = t.raw("social") as SocialLink[];
  const stats = t.raw("stats") as Stat[];
  const hours = th.raw("items") as HourRow[];

  /* Kigali clock + open/closed state. Computed on the client only, so the
     server-rendered markup and the first client render always agree. */
  const [clock, setClock] = useState<{ time: string; isOpen: boolean } | null>(null);

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const time = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Africa/Kigali",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).format(now);
      const hour = Number(time.split(":")[0]);
      const weekday = now.toLocaleDateString("en-GB", {
        timeZone: "Africa/Kigali",
        weekday: "long",
      });
      const isOpen =
        weekday === "Sunday" ? hour >= 7 && hour < 21 : hour >= 6 && hour < 22;
      setClock({ time, isOpen });
    };
    update();
    const id = setInterval(update, 60_000);
    return () => clearInterval(id);
  }, []);

  const kigaliTime = clock?.time ?? "";
  const isOpen = clock?.isOpen ?? false;

  return (
    <main className={`${manrope.variable} font-[family-name:var(--font-manrope)] min-h-screen bg-white`}>
      <Header />

      {/* ━━━━━━━━━━━━━━━━ HERO ━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="relative pt-[110px] pb-20 bg-[#0A1128] overflow-hidden">
        {/* ambient glows */}
        <div className="pointer-events-none absolute -top-20 left-1/3 w-[500px] h-[500px] rounded-full bg-[#125740]/10 blur-[120px]" />
        <div className="pointer-events-none absolute bottom-0 right-1/4 w-[300px] h-[300px] rounded-full bg-[#125740]/8 blur-[90px]" />
        <div className="pointer-events-none absolute inset-0 bg-[url('/backgrounds/grid.png')] opacity-[0.04]" />

        <div className="max-w-[1400px] mx-auto px-6 md:px-10 relative z-10">
          <div className="grid lg:grid-cols-[1fr_auto] gap-12 items-end">

            {/* Copy */}
            <div>
              <span className="inline-flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.35em] text-[#EAB308] mb-6 px-3 py-1.5 border border-[#125740]/30 rounded-sm">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${isOpen ? "bg-[#EAB308]" : "bg-gray-500"}`}
                  style={isOpen ? { boxShadow: "0 0 6px #EAB308" } : {}}
                />
                {isOpen ? t("availableNow") : t("currentlyClosed")}
              </span>

              <h1 className="text-6xl md:text-[88px] font-black text-white leading-[0.88] tracking-[-0.02em] mb-6">
                {t("title")}
                <br />
                <span className="text-[#EAB308]">{t("titleHighlight")}</span>
              </h1>
              <p className="text-sm text-white/40 font-medium leading-relaxed max-w-md">
                {t("subtitle")}
              </p>
            </div>

            {/* Live time pill */}
            {kigaliTime && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="hidden lg:flex flex-col items-end gap-1 self-end pb-1"
              >
                <span className="text-[9px] font-bold uppercase tracking-widest text-white/25">
                  {t("localTime")}
                </span>
                <span className="text-5xl font-black text-white/80 tabular-nums tracking-tight leading-none">
                  {kigaliTime}
                </span>
                <span className="text-[9px] font-bold uppercase tracking-widest text-[#EAB308]">
                  {t("timezone")}
                </span>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━ CHANNEL CARDS ━━━━━━━━━━━━━━━━ */}
      <section className="bg-gray-50 border-b border-gray-100">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-10">
          <div className="grid md:grid-cols-3 gap-4">
            {channels.map((channel, i) => {
              const style = CHANNEL_STYLE[channel.id];
              const Icon = getIcon(channel.icon);

              return (
                <motion.a
                  key={channel.id}
                  href={CHANNEL_HREF[channel.id]}
                  target={style.featured ? "_blank" : undefined}
                  rel={style.featured ? "noopener noreferrer" : undefined}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                  whileHover={{ y: -3 }}
                  whileTap={{ scale: 0.99 }}
                  className={`group relative flex flex-col p-7 rounded-sm transition-all duration-300 hover:shadow-xl ${style.bg} ${style.border} ${style.featured ? "shadow-lg" : ""}`}
                >
                  {style.featured && (
                    <span className="absolute top-4 right-4 text-[8px] font-black uppercase tracking-widest text-white/60 border border-white/20 px-2 py-0.5 rounded-sm">
                      {t("recommended")}
                    </span>
                  )}

                  <div
                    className="w-11 h-11 rounded-sm flex items-center justify-center mb-5"
                    style={{
                      backgroundColor: style.featured
                        ? "rgba(255,255,255,0.15)"
                        : `${style.accent}15`,
                    }}
                  >
                    <Icon size={20} style={{ color: style.featured ? "white" : style.accent }} />
                  </div>

                  <span
                    className="text-[9px] font-bold uppercase tracking-widest mb-1.5"
                    style={{ color: style.featured ? "rgba(255,255,255,0.6)" : "#9ca3af" }}
                  >
                    {channel.label}
                  </span>
                  <span
                    className={`text-base font-black leading-tight mb-1 ${style.featured ? "text-white" : "text-[#0A1128]"}`}
                  >
                    {CHANNEL_VALUE[channel.id]}
                  </span>
                  <span
                    className={`text-xs font-medium mb-6 ${style.featured ? "text-white/55" : "text-gray-400"}`}
                  >
                    {channel.detail}
                  </span>

                  <div
                    className="mt-auto flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest group-hover:gap-3 transition-all"
                    style={{ color: style.featured ? "white" : style.accent }}
                  >
                    {channel.cta}
                    <ChevronRight size={13} />
                  </div>
                </motion.a>
              );
            })}
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━ FORM + INFO ━━━━━━━━━━━━━━━━━━ */}
      <section className="py-20 bg-white">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10">
          <div className="grid lg:grid-cols-[1fr_400px] xl:grid-cols-[1fr_440px] gap-14 xl:gap-20">

            {/* ── Form ──────────────────────────────── */}
            <div>
              <div className="mb-10">
                <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-[#125740] mb-3 block">
                  {tf("eyebrow")}
                </span>
                <h2 className="text-3xl md:text-4xl font-black text-[#0A1128] tracking-tight leading-tight whitespace-pre-line">
                  {tf("title")}
                </h2>
              </div>
              <ContactForm />
            </div>

            {/* ── Info sidebar ──────────────────────── */}
            <div className="flex flex-col gap-6">

              {/* Office location */}
              <div className="bg-[#0A1128] rounded-sm p-7 relative overflow-hidden">
                <div className="absolute bottom-0 right-0 w-32 h-32 bg-[#125740]/10 rounded-full blur-3xl pointer-events-none" />
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-9 h-9 rounded-sm bg-white/5 flex items-center justify-center">
                      <MapPin size={16} className="text-[#125740]" />
                    </div>
                    <span className="text-[9px] font-bold uppercase tracking-widest text-white/40">
                      {tl("eyebrow")}
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-white mb-1 tracking-tight">
                    {tl("city")}
                  </h3>
                  <p className="text-sm text-white/40 font-medium leading-relaxed mb-6 whitespace-pre-line">
                    {tl("address")}
                  </p>
                  <a
                    href="https://maps.google.com/?q=Kigali+Convention+Center+Rwanda"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-[#EAB308] hover:text-[#EAB308] transition-colors"
                  >
                    {tl("maps")}
                    <ExternalLink size={11} />
                  </a>
                </div>
              </div>

              {/* Map embed */}
              <div className="relative overflow-hidden rounded-sm border border-gray-100" style={{ height: 200 }}>
                <iframe
                  title={tl("mapTitle")}
                  src="https://www.openstreetmap.org/export/embed.html?bbox=30.0300%2C-1.9800%2C30.1200%2C-1.9000&layer=mapnik&marker=-1.9441%2C30.0619"
                  className="w-full h-full border-0"
                  loading="lazy"
                />
              </div>

              {/* Operating hours */}
              <div className="border border-gray-100 rounded-sm p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-9 h-9 rounded-sm bg-gray-50 flex items-center justify-center">
                    <Clock size={16} className="text-[#125740]" />
                  </div>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">
                    {th("eyebrow")}
                  </span>
                </div>
                <div className="space-y-3">
                  {hours.map((row) => (
                    <div
                      key={row.id}
                      className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0"
                    >
                      <span className="text-xs font-bold text-gray-600">{row.days}</span>
                      <span className="text-xs font-black text-[#0A1128] tabular-nums">
                        {row.time}
                      </span>
                    </div>
                  ))}
                </div>

                {/* live status badge */}
                <div className={`mt-5 flex items-center gap-2.5 px-3 py-2 rounded-sm ${isOpen ? "bg-[#EAB308]/8" : "bg-gray-50"}`}>
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${isOpen ? "bg-[#EAB308]" : "bg-gray-300"}`}
                    style={isOpen ? { boxShadow: "0 0 8px #EAB308" } : {}}
                  />
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${isOpen ? "text-[#125740]" : "text-gray-400"}`}>
                    {isOpen ? th("openNow") : th("closedNext")}
                  </span>
                </div>
              </div>

              {/* Social links */}
              <div className="flex gap-3">
                {socials.map((social) => {
                  const Icon = getIcon(social.icon);

                  return (
                    <motion.a
                      key={social.id}
                      href={SOCIAL_HREF[social.id]}
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.96 }}
                      className="flex-1 flex flex-col items-center gap-2 py-4 border border-gray-100 rounded-sm hover:border-gray-300 transition-all bg-white"
                      title={social.label}
                    >
                      <Icon size={18} style={{ color: SOCIAL_COLOR[social.id] }} />
                      <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">
                        {social.label}
                      </span>
                    </motion.a>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━ REASSURANCE STRIP ━━━━━━━━━━━━ */}
      <section className="border-t border-gray-100 bg-gray-50 py-12">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10">
          <div className="grid sm:grid-cols-3 gap-8 text-center">
            {stats.map((stat) => (
              <div key={stat.id} className="flex flex-col items-center gap-2">
                <span className="text-3xl font-black" style={{ color: STAT_COLOR[stat.id] }}>
                  {stat.value}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}