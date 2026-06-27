"use client";

import { useState, useEffect } from "react";
import { Manrope } from "next/font/google";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle,
  Phone,
  Mail,
  MapPin,
  Clock,
  ChevronRight,
  Check,
  User,
  Smartphone,
  FileText,
  AlertCircle,
  Instagram,
  ExternalLink,
  AtSign,
} from "lucide-react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

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

const SERVICES = [
  "City Ride (Kigali)",
  "Inter-City Transfer",
  "Driver Hire",
  "Tourism Package",
  "Group Booking (10+ pax)",
  "General Inquiry",
];

const HOURS = [
  { days: "Monday – Friday", time: "06:00 – 22:00" },
  { days: "Saturday",        time: "06:00 – 22:00" },
  { days: "Sunday",          time: "07:00 – 21:00" },
  { days: "Public Holidays", time: "On Request"     },
];

const CHANNELS = [
  {
    icon: MessageCircle,
    label: "WhatsApp",
    value: PHONE_DISPLAY,
    detail: "Fastest response · Usually within 5 min",
    href: WA_LINK,
    cta: "Open WhatsApp",
    accent: "#C97C2F",
    bg: "bg-[#C97C2F]",
    text: "text-white",
    border: "",
    featured: true,
  },
  {
    icon: Phone,
    label: "Call Us",
    value: PHONE_DISPLAY,
    detail: "Direct line · 06:00 – 22:00 CAT",
    href: `tel:${WA_NUMBER}`,
    cta: "Call Now",
    accent: "#006cb7",
    bg: "bg-white",
    text: "text-[#0a0e1a]",
    border: "border border-gray-200",
    featured: false,
  },
  {
    icon: Mail,
    label: "Email",
    value: EMAIL,
    detail: "For bookings, invoices & enquiries",
    href: `mailto:${EMAIL}`,
    cta: "Send Email",
    accent: "#84BD00",
    bg: "bg-white",
    text: "text-[#0a0e1a]",
    border: "border border-gray-200",
    featured: false,
  },
];

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

/* ─────────────────────────────────────────────────────────
   CONTACT FORM
───────────────────────────────────────────────────────── */
function ContactForm() {
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
    if (!form.name.trim())    e.name    = "Your name is required.";
    if (!form.email.trim())   e.email   = "An email address is required.";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Please enter a valid email.";
    if (!form.service)        e.service = "Please select a service.";
    if (!form.message.trim()) e.message = "A message is required.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    const text = encodeURIComponent(
      `Hello SURA! 👋\n\n` +
      `*Name:* ${form.name}\n` +
      `*Email:* ${form.email}\n` +
      (form.phone ? `*Phone:* ${form.phone}\n` : "") +
      `*Service:* ${form.service}\n\n` +
      `*Message:*\n${form.message}`
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
          className="w-20 h-20 rounded-full bg-[#84BD00] flex items-center justify-center mb-8 shadow-lg shadow-[#84BD00]/20"
        >
          <Check size={32} className="text-white" strokeWidth={3} />
        </motion.div>
        <h3 className="text-2xl font-black text-[#0a0e1a] tracking-tight mb-3">
          WhatsApp Opened
        </h3>
        <p className="text-sm text-gray-500 font-medium leading-relaxed max-w-xs mb-8">
          Your message has been pre-filled. Just tap Send in WhatsApp and our
          team will get back to you — usually within 5 minutes.
        </p>
        <button
          onClick={() => { setSent(false); setForm({ name: "", email: "", phone: "", service: "", message: "" }); }}
          className="text-[11px] font-bold uppercase tracking-widest text-gray-400 hover:text-[#0a0e1a] transition-colors"
        >
          Send Another Message
        </button>
      </motion.div>
    );
  }

  const fieldBase =
    "w-full px-4 py-3 text-sm font-bold text-[#0a0e1a] bg-white border rounded-sm outline-none placeholder:text-gray-300 placeholder:font-medium transition-all duration-200";
  const fieldIdle    = "border-gray-200 hover:border-gray-300";
  const fieldFocused = "border-[#006cb7] ring-1 ring-[#006cb7]/20";
  const fieldError   = "border-red-400 ring-1 ring-red-200";

  const cls = (name: string, err?: string) =>
    `${fieldBase} ${err ? fieldError : focused === name ? fieldFocused : fieldIdle}`;

  return (
    <div className="space-y-5">
      {/* Name + Email */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">
            Full Name <span className="text-[#C97C2F]">*</span>
          </label>
          <div className="relative">
            <User size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
            <input
              type="text"
              placeholder="Jane Uwase"
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
            Email <span className="text-[#C97C2F]">*</span>
          </label>
          <div className="relative">
            <AtSign size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
            <input
              type="email"
              placeholder="jane@example.com"
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
            Phone <span className="text-gray-300 normal-case tracking-normal font-medium">(optional)</span>
          </label>
          <div className="relative">
            <Smartphone size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
            <input
              type="tel"
              placeholder="+250 7XX XXX XXX"
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
            Service <span className="text-[#C97C2F]">*</span>
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
              <option value="" disabled>Select a service…</option>
              {SERVICES.map((s) => (
                <option key={s} value={s}>{s}</option>
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
          Message <span className="text-[#C97C2F]">*</span>
        </label>
        <textarea
          rows={5}
          placeholder="Tell us about your trip — dates, number of passengers, destination, or any special requirements…"
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
        className="w-full h-14 bg-[#C97C2F] hover:bg-[#b56d28] text-white flex items-center justify-center gap-3 text-[11px] font-black uppercase tracking-widest rounded-sm shadow-lg shadow-[#C97C2F]/20 transition-colors"
      >
        <MessageCircle size={16} />
        Send via WhatsApp
      </motion.button>

      <p className="text-center text-[10px] text-gray-400 font-medium">
        This opens WhatsApp with your message pre-filled — no data is stored.
      </p>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   PAGE
───────────────────────────────────────────────────────── */
export default function ContactPage() {
  const [kigaliTime, setKigaliTime] = useState("");

  useEffect(() => {
    const update = () =>
      setKigaliTime(
        new Intl.DateTimeFormat("en-GB", {
          timeZone: "Africa/Kigali",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }).format(new Date())
      );
    update();
    const t = setInterval(update, 60_000);
    return () => clearInterval(t);
  }, []);

  // Is it currently within business hours in Kigali?
  const isOpen = (() => {
    const now = new Date().toLocaleTimeString("en-GB", {
      timeZone: "Africa/Kigali",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    const [h] = now.split(":").map(Number);
    const day = new Date().toLocaleDateString("en-GB", {
      timeZone: "Africa/Kigali",
      weekday: "long",
    });
    if (day === "Sunday") return h >= 7 && h < 21;
    return h >= 6 && h < 22;
  })();

  return (
    <main className={`${manrope.variable} font-[family-name:var(--font-manrope)] min-h-screen bg-white`}>
      <Header />

      {/* ━━━━━━━━━━━━━━━━ HERO ━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="relative pt-[110px] pb-20 bg-[#0a0e1a] overflow-hidden">
        {/* ambient glows */}
        <div className="pointer-events-none absolute -top-20 left-1/3 w-[500px] h-[500px] rounded-full bg-[#006cb7]/10 blur-[120px]" />
        <div className="pointer-events-none absolute bottom-0 right-1/4 w-[300px] h-[300px] rounded-full bg-[#C97C2F]/8 blur-[90px]" />
        <div className="pointer-events-none absolute inset-0 bg-[url('/backrounds/grid.png')] opacity-[0.04]" />

        <div className="max-w-[1400px] mx-auto px-6 md:px-10 relative z-10">
          <div className="grid lg:grid-cols-[1fr_auto] gap-12 items-end">

            {/* Copy */}
            <div>
              <span className="inline-flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.35em] text-[#C97C2F] mb-6 px-3 py-1.5 border border-[#C97C2F]/30 rounded-sm">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${isOpen ? "bg-[#84BD00]" : "bg-gray-500"}`}
                  style={isOpen ? { boxShadow: "0 0 6px #84BD00" } : {}}
                />
                {isOpen ? "We're Available Now" : "Currently Closed"}
              </span>

              <h1 className="text-6xl md:text-[88px] font-black text-white leading-[0.88] tracking-[-0.02em] mb-6">
                LET'S
                <br />
                <span className="text-[#006cb7]">TALK.</span>
              </h1>
              <p className="text-sm text-white/40 font-medium leading-relaxed max-w-md">
                Premium support for every journey — city rides, inter-city
                transfers, tourism packages, and more. We respond fast,
                especially on WhatsApp.
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
                  Kigali local time
                </span>
                <span className="text-5xl font-black text-white/80 tabular-nums tracking-tight leading-none">
                  {kigaliTime}
                </span>
                <span className="text-[9px] font-bold uppercase tracking-widest text-[#C97C2F]">
                  CAT · UTC+2
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
            {CHANNELS.map((ch, i) => (
              <motion.a
                key={ch.label}
                href={ch.href}
                target={ch.featured ? "_blank" : undefined}
                rel={ch.featured ? "noopener noreferrer" : undefined}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -3 }}
                whileTap={{ scale: 0.99 }}
                className={`group relative flex flex-col p-7 rounded-sm transition-all duration-300 hover:shadow-xl ${ch.bg} ${ch.border} ${ch.featured ? "shadow-lg shadow-[#C97C2F]/15" : ""}`}
              >
                {ch.featured && (
                  <span className="absolute top-4 right-4 text-[8px] font-black uppercase tracking-widest text-white/60 border border-white/20 px-2 py-0.5 rounded-sm">
                    Recommended
                  </span>
                )}

                <div
                  className="w-11 h-11 rounded-sm flex items-center justify-center mb-5"
                  style={{
                    backgroundColor: ch.featured ? "rgba(255,255,255,0.15)" : `${ch.accent}15`,
                  }}
                >
                  <ch.icon
                    size={20}
                    style={{ color: ch.featured ? "white" : ch.accent }}
                  />
                </div>

                <span
                  className="text-[9px] font-bold uppercase tracking-widest mb-1.5"
                  style={{ color: ch.featured ? "rgba(255,255,255,0.6)" : "#9ca3af" }}
                >
                  {ch.label}
                </span>
                <span
                  className={`text-base font-black leading-tight mb-1 ${ch.featured ? "text-white" : "text-[#0a0e1a]"}`}
                >
                  {ch.value}
                </span>
                <span
                  className={`text-xs font-medium mb-6 ${ch.featured ? "text-white/55" : "text-gray-400"}`}
                >
                  {ch.detail}
                </span>

                <div className="mt-auto flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest group-hover:gap-3 transition-all"
                  style={{ color: ch.featured ? "white" : ch.accent }}
                >
                  {ch.cta}
                  <ChevronRight size={13} />
                </div>
              </motion.a>
            ))}
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
                <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-[#C97C2F] mb-3 block">
                  Send a Message
                </span>
                <h2 className="text-3xl md:text-4xl font-black text-[#0a0e1a] tracking-tight leading-tight">
                  Tell us about<br />your trip.
                </h2>
              </div>
              <ContactForm />
            </div>

            {/* ── Info sidebar ──────────────────────── */}
            <div className="flex flex-col gap-6">

              {/* Office location */}
              <div className="bg-[#0a0e1a] rounded-sm p-7 relative overflow-hidden">
                <div className="absolute bottom-0 right-0 w-32 h-32 bg-[#006cb7]/10 rounded-full blur-3xl pointer-events-none" />
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-9 h-9 rounded-sm bg-white/5 flex items-center justify-center">
                      <MapPin size={16} className="text-[#C97C2F]" />
                    </div>
                    <span className="text-[9px] font-bold uppercase tracking-widest text-white/40">
                      Based in
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-white mb-1 tracking-tight">
                    Kigali, Rwanda
                  </h3>
                  <p className="text-sm text-white/40 font-medium leading-relaxed mb-6">
                    CHIC – Convention Centre Area<br />
                    KG 2 Roundabout, Kigali
                  </p>
                  <a
                    href="https://maps.google.com/?q=Kigali+Convention+Center+Rwanda"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-[#006cb7] hover:text-[#C97C2F] transition-colors"
                  >
                    Open in Google Maps
                    <ExternalLink size={11} />
                  </a>
                </div>
              </div>

              {/* Map embed */}
              <div className="relative overflow-hidden rounded-sm border border-gray-100" style={{ height: 200 }}>
                <iframe
                  title="Kigali Map"
                  src="https://www.openstreetmap.org/export/embed.html?bbox=30.0300%2C-1.9800%2C30.1200%2C-1.9000&layer=mapnik&marker=-1.9441%2C30.0619"
                  className="w-full h-full border-0"
                  loading="lazy"
                />
              </div>

              {/* Operating hours */}
              <div className="border border-gray-100 rounded-sm p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-9 h-9 rounded-sm bg-gray-50 flex items-center justify-center">
                    <Clock size={16} className="text-[#006cb7]" />
                  </div>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">
                    Operating Hours
                  </span>
                </div>
                <div className="space-y-3">
                  {HOURS.map(({ days, time }) => {
                    const isToday = new Date().toLocaleDateString("en-GB", {
                      timeZone: "Africa/Kigali",
                      weekday: "long",
                    }) === days.split("–")[0].trim() || days.includes("–");

                    return (
                      <div
                        key={days}
                        className={`flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0 ${
                          days === "Monday – Friday" || days.toLowerCase().includes(
                            new Date().toLocaleDateString("en-GB", {
                              timeZone: "Africa/Kigali",
                              weekday: "long",
                            }).toLowerCase()
                          )
                            ? ""
                            : ""
                        }`}
                      >
                        <span className="text-xs font-bold text-gray-600">{days}</span>
                        <span className="text-xs font-black text-[#0a0e1a] tabular-nums">{time}</span>
                      </div>
                    );
                  })}
                </div>

                {/* live status badge */}
                <div className={`mt-5 flex items-center gap-2.5 px-3 py-2 rounded-sm ${isOpen ? "bg-[#84BD00]/8" : "bg-gray-50"}`}>
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${isOpen ? "bg-[#84BD00]" : "bg-gray-300"}`}
                    style={isOpen ? { boxShadow: "0 0 8px #84BD00" } : {}}
                  />
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${isOpen ? "text-[#84BD00]" : "text-gray-400"}`}>
                    {isOpen ? "Open Now" : "Closed · Opens tomorrow at 06:00"}
                  </span>
                </div>
              </div>

              {/* Social links */}
              <div className="flex gap-3">
                {[
                  {
                    label: "Instagram",
                    icon: Instagram,
                    href: "https://instagram.com/sura.rw",
                    color: "#C97C2F",
                  },
                  {
                    label: "WhatsApp",
                    icon: MessageCircle,
                    href: WA_LINK,
                    color: "#84BD00",
                  },
                  {
                    label: "Email",
                    icon: AtSign,
                    href: `mailto:${EMAIL}`,
                    color: "#006cb7",
                  },
                ].map(({ label, icon: Icon, href, color }) => (
                  <motion.a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.96 }}
                    className="flex-1 flex flex-col items-center gap-2 py-4 border border-gray-100 rounded-sm hover:border-gray-300 transition-all bg-white"
                    title={label}
                  >
                    <Icon size={18} style={{ color }} />
                    <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">
                      {label}
                    </span>
                  </motion.a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━ REASSURANCE STRIP ━━━━━━━━━━━━ */}
      <section className="border-t border-gray-100 bg-gray-50 py-12">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10">
          <div className="grid sm:grid-cols-3 gap-8 text-center">
            {[
              {
                value: "< 5 min",
                label: "Avg. WhatsApp response",
                color: "#C97C2F",
              },
              {
                value: "24/7",
                label: "Trip support on the road",
                color: "#006cb7",
              },
              {
                value: "100%",
                label: "Confirmation before departure",
                color: "#84BD00",
              },
            ].map(({ value, label, color }) => (
              <div key={label} className="flex flex-col items-center gap-2">
                <span className="text-3xl font-black" style={{ color }}>
                  {value}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  {label}
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