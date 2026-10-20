"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Calendar,
  Users,
  ChevronUp,
  Leaf,
  Landmark,
  Crown,
  SlidersHorizontal,
  Clock,
  ArrowRight,
  History,
  X,
  CheckCircle2,
  MessageCircle,
  Mail,
  Phone,
  Download
} from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { optimizedBg, optimizedBgWithFallback } from "@/lib/optimized-bg";
import { getIcon } from "@/lib/icons";
import { useScrollLock } from "@/lib/use-scroll-lock";

// ─── Data ─────────────────────────────────────────────────────────────────────
// Events, categories, statuses and every piece of text come from messages/en.json +
// messages/fr.json (namespace "Events"). Add an event by adding an entry to "items"
// in those two files — "status" and "category" refer to the ids listed there.
//
// REMINDER: public/images/activities/bisoke-poster.jpg (Bisoke and Musanze Retreat,
// JSON path /images/activities/bisoke-poster.jpg) is a branded placeholder. Replace
// it with the real poster under the same name. The Akagera recap photo for the
// archive is public/activities/akagera-recap.jpg (see app/[locale]/events/past/page.tsx).
//
// The older "TBA" event on 15 November (evt-004) uses the neutral branded image
// /images/activities/generic-placeholder.jpg so it doesn't look like the Bisoke retreat.
//
// Status "dateTba": the month is known but not the day. The card shows the month
// from "date" with "TBA" under it, and "Notify Me" opens WhatsApp with "whatsappText".

type Category = { id: string; icon?: string; label: string };

type SuraEvent = {
  id: string;
  date: string;
  endDate?: string;
  image: string;
  price: number;
  currency: string;
  seats?: number;
  status: string;
  category: string;
  featured?: boolean;
  hasModal?: boolean;
  itineraryHref?: string;
  /** Pre-filled WhatsApp message for "Notify Me" (status "dateTba"). */
  whatsappText?: string;
  title: string;
  subtitle: string;
  location: string;
  country: string;
  duration: string;
};

const STATUS_STYLES: Record<string, string> = {
  limitedSeats: "bg-secondary text-foreground border-secondary",
  bookingOpen: "bg-primary text-primary-foreground border-primary",
  soldOut: "bg-destructive text-white border-destructive",
  comingSoon: "bg-muted-foreground text-white border-muted-foreground",
  dateTba: "bg-secondary text-foreground border-secondary",
};

const WHATSAPP_NUMBER = "250788564000";
const whatsappLink = (message: string) => `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

const CATEGORY_TONES: Record<string, string> = {
  nature: "text-primary",
  culture: "text-primary",
  exclusive: "text-primary",
};

export default function UpcomingEventsPage() {
  const t = useTranslations("Events");
  const tm = useTranslations("Events.modal");
  const format = useFormatter();

  const categories = t.raw("categories") as Category[];
  const events = t.raw("items") as SuraEvent[];

  const [filter, setFilter] = useState("all");
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);

  const filteredEvents = events.filter(
    (event) => filter === "all" || event.category === filter
  );

  // "AUG 22" in English, "22 AOÛT" in French
  const eventDay = (event: SuraEvent) => {
    const day = format.dateTime(new Date(event.date), { day: "numeric" });
    if (event.endDate && event.endDate !== event.date) {
      return `${day}-${format.dateTime(new Date(event.endDate), { day: "numeric" })}`;
    }
    return day;
  };
  const eventMonth = (event: SuraEvent) => format.dateTime(new Date(event.date), { month: "short" });

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 500);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useScrollLock(bookingModalOpen);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-secondary/30 selection:text-primary-foreground relative">

      <section className="relative h-[75vh] min-h-[550px] pt-[var(--header-h)] flex items-center justify-center overflow-hidden bg-foreground">
        <div
          className="absolute inset-0 z-0 bg-cover bg-center transition-transform duration-500 scale-100"
          style={{ backgroundImage: optimizedBg("/backgrounds/nyungwe_sky.jpg") }}
        />

        <div className="relative z-10 text-center px-6 md:px-10 max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="flex flex-col items-center gap-4"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 border border-white/20 bg-black/50 backdrop-blur-md rounded-2xl shadow-2xl">
              <span className="w-1.5 h-1.5 bg-secondary rounded-full animate-pulse" />
              <span className="text-xs font-bold text-white tracking-widest uppercase">
                {t("badge")}
              </span>
            </div>

            <h1 className="text-5xl md:text-7xl font-extrabold text-white uppercase tracking-tighter leading-[0.95] drop-shadow-[0_5px_15px_rgba(0,0,0,0.8)]">
              {t("title")} <br className="md:hidden" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary via-secondary to-secondary drop-shadow-[0_2px_2px_rgba(0,0,0,1)]">
                {t("titleHighlight")}
              </span>
            </h1>

            <p className="text-white font-medium text-base md:text-lg max-w-2xl mx-auto leading-relaxed drop-shadow-[0_5px_5px_rgba(0,0,0,0.9)] bg-black/30 p-4 rounded-2xl backdrop-blur-sm">
              {t("subtitle")}
            </p>
          </motion.div>
        </div>
      </section>

      <div className="sticky top-[var(--header-h)] z-40 bg-background/95 backdrop-blur-md border-b border-border shadow-sm">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-3 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 hide-scrollbar">
            <SlidersHorizontal size={14} className="text-muted-foreground mr-2 shrink-0" />
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setFilter(cat.id)}
                className={`min-h-12 px-4 py-2 text-xs font-bold uppercase tracking-widest whitespace-nowrap rounded-2xl transition-all duration-150 ${
                  filter === cat.id
                    ? "bg-secondary text-secondary-foreground shadow-md shadow-secondary/10"
                    : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <Link
            href="/events/past"
            className="group flex min-h-12 items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors shrink-0"
          >
            <History size={14} className="group-hover:-rotate-45 transition-transform duration-200" />
            {t("viewPast")}
          </Link>
        </div>
      </div>

      <section className="pt-12 md:pt-16 pb-16 md:pb-20 px-6 md:px-10 max-w-[1400px] mx-auto min-h-[45vh]">
        {filteredEvents.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-border rounded-2xl">
            <p className="text-muted-foreground text-sm uppercase tracking-wider">{t("emptyText")}</p>
            <button 
              onClick={() => setFilter("all")}
              className="mt-3 inline-flex min-h-12 items-center text-primary hover:text-primary-hover text-xs font-bold uppercase tracking-widest transition-colors"
            >
              {t("resetFilters")}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            <AnimatePresence mode="popLayout">
              {filteredEvents.map((event, index) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.35, delay: index * 0.04 }}
                  key={event.id}
                  className="group flex flex-col bg-card border border-border hover:border-secondary/40 rounded-2xl overflow-hidden transition-all duration-300 shadow-sm hover:shadow-xl"
                >
                  <div className="relative h-60 overflow-hidden bg-muted">
                    <div
                      className={`absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-102 ${event.status === "comingSoon" ? 'opacity-50 grayscale' : 'opacity-100'}`}
                      style={{ backgroundImage: optimizedBgWithFallback(event.image, 828) }}
                    />
                    
                    <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
                      <span className={`px-2.5 py-1 text-xs font-extrabold uppercase tracking-widest border shadow-lg rounded-2xl ${STATUS_STYLES[event.status] ?? STATUS_STYLES.comingSoon}`}>
                        {t(`statuses.${event.status}`)}
                      </span>
                      {event.featured && (
                        <span className="bg-primary text-primary-foreground px-2 py-1 text-xs font-bold uppercase tracking-widest rounded-2xl flex items-center gap-1 shadow-2xl">
                          <Crown size={10} /> {t("featured")}
                        </span>
                      )}
                    </div>

                    <div className="absolute bottom-4 left-4 flex flex-col">
                      <span className="text-3xl font-extrabold text-white leading-none tracking-tighter drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                        {event.status === "comingSoon" ? "--" : event.status === "dateTba" ? eventMonth(event) : eventDay(event)}
                      </span>
                      <span className="text-xs font-bold text-white/90 uppercase tracking-widest drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                        {event.status === "comingSoon" || event.status === "dateTba" ? t("tba") : eventMonth(event)}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col flex-1 p-6">
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        {(() => {
                          const category = categories.find((c) => c.id === event.category);
                          const CategoryIcon = getIcon(category?.icon);
                          return (
                            <>
                              <CategoryIcon size={12} className={CATEGORY_TONES[event.category] ?? "text-primary"} />
                              <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                {category?.label ?? event.category}
                              </span>
                            </>
                          );
                        })()}
                      </div>
                      <h3 className="text-xl md:text-2xl font-extrabold text-card-foreground uppercase tracking-tight leading-tight mb-2 group-hover:text-primary transition-colors">
                        {event.title}
                      </h3>
                      <p className="text-sm text-muted-foreground font-medium line-clamp-2">
                        {event.subtitle}
                      </p>
                    </div>

                    <div className="mt-auto space-y-3 pb-6 border-b border-border">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin size={14} className="text-primary" />
                        <span className="truncate">{event.location}, {event.country}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock size={14} className="text-primary" />
                        <span>{event.duration}</span>
                      </div>
                      {event.seats && event.status !== "comingSoon" && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Users size={14} className="text-primary" />
                          <span>{t("spots", { count: event.seats })}</span>
                        </div>
                      )}
                    </div>

                    <div className="pt-6 flex items-center justify-between mt-auto">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                          {event.status === "comingSoon" || event.status === "dateTba" ? t("pricingLabel") : t("startingFrom")}
                        </span>
                        <span className="text-lg font-extrabold text-card-foreground">
                          {event.price === 0 ? t("tba") : format.number(event.price)} <span className="text-sm text-primary">{event.price === 0 ? "" : event.currency}</span>
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {event.hasModal ? (
                           <>
                             {/* No itinerary file yet: an inert button, not a "#" link that jumps to the top. */}
                             {event.itineraryHref ? (
                               <a
                                 href={event.itineraryHref}
                                 download
                                 target="_blank"
                                 rel="noopener noreferrer"
                                 className="h-12 px-4 flex items-center justify-center text-xs font-bold uppercase tracking-widest rounded-2xl transition-colors bg-muted hover:bg-secondary text-foreground hover:text-secondary-foreground"
                               >
                                 <Download size={14} className="mr-1.5" />
                                 <span className="hidden sm:inline">{t("itinerary")}</span>
                               </a>
                             ) : (
                               <button
                                 type="button"
                                 disabled
                                 className="h-12 px-4 flex items-center justify-center text-xs font-bold uppercase tracking-widest rounded-2xl bg-muted/50 text-muted-foreground/40 cursor-not-allowed"
                               >
                                 <Download size={14} className="mr-1.5" />
                                 <span className="hidden sm:inline">{t("itinerary")}</span>
                               </button>
                             )}
                             <button
                               type="button"
                               onClick={() => setBookingModalOpen(true)}
                               className="h-12 px-6 flex items-center justify-center text-xs font-bold uppercase tracking-widest rounded-2xl transition-colors bg-primary hover:bg-primary/90 text-primary-foreground"
                             >
                               {t("reserve")}
                             </button>
                           </>
                        ) : event.status === "dateTba" ? (
                           <a
                             href={whatsappLink(event.whatsappText ?? event.title)}
                             target="_blank"
                             rel="noopener noreferrer"
                             className="h-12 px-6 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest rounded-2xl transition-colors bg-primary hover:bg-primary/90 text-primary-foreground"
                           >
                             <MessageCircle size={14} />
                             {t("notify")}
                           </a>
                        ) : event.status === "soldOut" || event.status === "comingSoon" ? (
                           // Not bookable yet: an inert button, not a "#" link that jumps to the top.
                           <button
                             type="button"
                             disabled
                             className="h-12 px-6 flex items-center justify-center text-xs font-bold uppercase tracking-widest rounded-2xl bg-muted/50 text-muted-foreground/40 cursor-not-allowed"
                           >
                             {event.status === "soldOut" ? t("waitlist") : t("notify")}
                           </button>
                        ) : (
                           <Link
                             href={`/book?event=${event.id}`}
                             className="h-12 px-6 flex items-center justify-center text-xs font-bold uppercase tracking-widest rounded-2xl transition-colors bg-primary hover:bg-primary/90 text-primary-foreground"
                           >
                             {t("reserve")}
                           </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </section>

      {/* ── Akagera Event Modal ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {bookingModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-sm overflow-y-auto">
             <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative bg-card w-full max-w-5xl rounded-2xl shadow-2xl flex flex-col lg:flex-row overflow-hidden max-h-full"
             >
                <button 
                  onClick={() => setBookingModalOpen(false)}
                  aria-label={tm("close")}
                  className="absolute top-4 right-4 z-50 flex h-12 w-12 items-center justify-center bg-black/20 hover:bg-black/40 text-white rounded-full transition-colors"
                >
                  <X size={20} />
                </button>

                <div className="lg:w-2/5 bg-primary relative overflow-hidden flex flex-col justify-between p-6 md:p-8 text-primary-foreground">
                   <div className="absolute inset-0 bg-[url('/activities/akagera/akagera-park.jpg')] bg-cover bg-center opacity-30 mix-blend-overlay" />
                   <div className="absolute inset-0 bg-gradient-to-t from-foreground/90 via-primary/80 to-primary/50" />
                   
                   <div className="relative z-10">
                      <span className="inline-block px-3 py-1 bg-secondary text-secondary-foreground text-xs font-extrabold tracking-widest uppercase mb-4 shadow-lg rounded-2xl">
                        {tm("deadline")}
                      </span>
                      <h2 className="text-4xl lg:text-5xl font-extrabold uppercase tracking-tight leading-[0.9] mb-4 whitespace-pre-line">
                        {tm("title")}
                      </h2>
                      <p className="text-sm font-medium text-white/80 uppercase tracking-widest border-l-2 border-secondary pl-3">
                        {tm("subtitle")}
                      </p>
                   </div>

                   <div className="relative z-10 mt-8 space-y-4 bg-black/20 p-5 rounded-2xl backdrop-blur-sm border border-white/10">
                      <div className="flex items-center gap-3">
                         <Calendar className="text-secondary" size={20} />
                         <div>
                            <span className="block text-xs text-white/50 font-bold uppercase tracking-widest">{tm("dateLabel")}</span>
                            <span className="font-bold text-sm">{tm("dateValue")}</span>
                         </div>
                      </div>
                      <div className="flex items-center gap-3">
                         <Clock className="text-secondary" size={20} />
                         <div>
                            <span className="block text-xs text-white/50 font-bold uppercase tracking-widest">{tm("departureLabel")}</span>
                            <span className="font-bold text-sm">{tm("departureValue")}</span>
                         </div>
                      </div>
                      <div className="flex items-center gap-3">
                         <MapPin className="text-secondary" size={20} />
                         <div>
                            <span className="block text-xs text-white/50 font-bold uppercase tracking-widest">{tm("locationLabel")}</span>
                            <span className="font-bold text-sm">{tm("locationValue")}</span>
                         </div>
                      </div>
                   </div>
                </div>

                <div className="lg:w-3/5 p-6 lg:p-10 bg-background overflow-y-auto custom-scrollbar">
                   <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-6 border-b border-border pb-2">
                     {tm("packagesTitle")}
                   </h3>

                   <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                      {(tm.raw("tiers") as { id: string; highlight?: boolean; label: string; price: string; note: string }[]).map((tier) => (
                        <div
                          key={tier.id}
                          className={`p-4 rounded-2xl text-center relative border ${tier.highlight ? "bg-primary border-primary shadow-lg transform sm:-translate-y-2" : "bg-muted border-border shadow-sm"}`}
                        >
                          {tier.highlight && (
                            <div className="absolute -top-2 inset-x-0 flex justify-center">
                              <span className="bg-secondary text-secondary-foreground text-xs font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-2xl">{tm("popular")}</span>
                            </div>
                          )}
                          <span className={`block text-xs font-bold uppercase tracking-widest mb-2 ${tier.highlight ? "text-white/60" : "text-muted-foreground"}`}>{tier.label}</span>
                          <span className={`block font-extrabold ${tier.highlight ? "text-3xl text-white" : "text-2xl text-foreground"}`}>{tier.price}</span>
                          <span className={`block text-xs mt-2 uppercase ${tier.highlight ? "text-white/60" : "text-muted-foreground"}`}>{tier.note}</span>
                        </div>
                      ))}
                   </div>

                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-10">
                      <div>
                         <h4 className="text-xs font-bold bg-secondary text-secondary-foreground inline-block px-2 py-1 uppercase tracking-widest mb-4 rounded-2xl">{tm("packageTitle")}</h4>
                         <ul className="space-y-2">
                            {(tm.raw("packageItems") as string[]).map(item => (
                               <li key={item} className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                  <CheckCircle2 size={14} className="text-primary" /> {item}
                               </li>
                            ))}
                         </ul>
                      </div>
                      <div>
                         <h4 className="text-xs font-bold bg-primary text-primary-foreground inline-block px-2 py-1 uppercase tracking-widest mb-4 rounded-2xl">{tm("activitiesTitle")}</h4>
                         <ul className="space-y-2">
                            {(tm.raw("activityItems") as string[]).map(item => (
                               <li key={item} className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                  <CheckCircle2 size={14} className="text-primary" /> {item}
                               </li>
                            ))}
                         </ul>
                      </div>
                   </div>

                   <div className="border-t border-border pt-6">
                      <h4 className="text-sm font-bold text-foreground uppercase tracking-widest mb-4 text-center">{tm("secureTitle")}</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                         <a 
                            href={`https://wa.me/250788564000?text=${encodeURIComponent(tm("whatsappText"))}`}
                            target="_blank" rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 bg-whatsapp hover:bg-whatsapp-hover text-foreground px-4 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest transition-colors shadow-sm"
                         >
                            <MessageCircle size={16} /> {tm("whatsapp")}
                         </a>
                         <a 
                            href="tel:+250788564000" 
                            className="flex items-center justify-center gap-2 bg-foreground hover:bg-primary text-background hover:text-primary-foreground px-4 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest transition-colors shadow-sm"
                         >
                            <Phone size={16} /> {tm("call")}
                         </a>
                         <a 
                            href={`mailto:suraessenceltd@gmail.com?subject=${encodeURIComponent(tm("emailSubject"))}`} 
                            className="flex items-center justify-center gap-2 bg-muted hover:bg-secondary hover:text-secondary-foreground border border-border text-foreground px-4 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest transition-colors shadow-sm"
                         >
                            <Mail size={16} /> {tm("email")}
                         </a>
                      </div>
                   </div>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      <section className="border-t border-border bg-gradient-to-b from-transparent to-muted/20">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 pt-16 md:pt-20 pb-24 md:pb-32 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex flex-col gap-2">
            <h2 className="text-3xl md:text-4xl font-extrabold uppercase tracking-tight text-foreground leading-tight">
              {t("bespoke.title")}
            </h2>
            <p className="text-muted-foreground text-sm max-w-md">
              {t("bespoke.text")}
            </p>
          </div>
          <a 
            href={`https://wa.me/250788564000?text=${encodeURIComponent(t("bespoke.whatsappText"))}`}
            target="_blank" rel="noopener noreferrer"
            className="flex min-h-12 items-center gap-2 bg-secondary text-secondary-foreground text-xs font-bold tracking-widest uppercase px-7 py-3.5 rounded-2xl hover:bg-secondary/90 transition-colors duration-200 shrink-0 shadow-sm"
          >
            {t("bespoke.cta")}
            <ArrowRight size={14} />
          </a>
        </div>
      </section>

      <AnimatePresence>
        {showBackToTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            onClick={scrollToTop}
            aria-label={t("backToTop")}
            className="fixed bottom-8 right-8 z-50 size-12 flex items-center justify-center bg-primary border border-secondary/20 text-primary-foreground hover:bg-secondary hover:text-secondary-foreground rounded-2xl transition-colors shadow-xl"
          >
            <ChevronUp size={20} strokeWidth={2.5} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}