"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  ArrowRight,
  Calendar,
  MapPin,
  Clock,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Users
} from "lucide-react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Manrope } from "next/font/google";
import { motion } from "framer-motion";

const manrope = Manrope({ 
  subsets: ["latin"], 
  weight: ["400", "500", "700", "800"],
  variable: "--font-manrope"
});

const SEASONS = [
  {
    id: "season2",
    slug: "/activities/activity-season2",
    title: "Akagera National Park Experience",
    shortTitle: "Akagera",
    date: "22 August 2026",
    status: "upcoming",
    tag: "Incoming",
    location: "Eastern Province",
    price: "From 110K RWF",
    image: "/flyers/flyer2.jpg",
    description: "Wildlife Game Drive • Bicaca Bush Feast • Scenic Savanna Adventure"
  },
  {
    id: "season1",
    slug: "/activities/activity-season1",
    title: "Discover Bigogwe",
    shortTitle: "Bigogwe",
    date: "28–29 March 2026",
    status: "past",
    tag: "Past Experience",
    location: "Western Highlands",
    price: "From 50K RWF",
    image: "/Gemin.jpg",
    description: "Green Hills • Cattle Culture • Highland Experience"
  }
];

export default function ActivitiesPage() {
  const [activeIndex, setActiveIndex] = useState(0);
  const upcoming = SEASONS.find(s => s.status === "upcoming") || SEASONS[0];

  const goPrev = () => setActiveIndex((prev) => (prev === 0 ? SEASONS.length - 1 : prev - 1));
  const goNext = () => setActiveIndex((prev) => (prev === SEASONS.length - 1 ? 0 : prev + 1));

  return (
    <main className={`min-h-screen bg-[#F5F2EA] text-[#111827] ${manrope.className}`}>
      <Header />

      {/* Page Header */}
      <section className="pt-28 md:pt-32 pb-8 px-5 sm:px-8 md:px-12 max-w-6xl mx-auto">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-[10px] font-black text-gray-500 hover:text-[#006cb7] uppercase tracking-[0.2em] transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-[#84BD00]" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#84BD00]">
                Sura Experiences
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tighter leading-tight">
              Activity Calendar
            </h1>
            <p className="mt-3 text-sm text-gray-500 font-medium max-w-md">
              Explore our seasonal adventures. Navigate freely between past and upcoming experiences.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={goPrev}
              className="w-11 h-11 rounded-sm border border-gray-300 bg-white hover:border-[#006cb7] hover:text-[#006cb7] flex items-center justify-center transition-colors"
              aria-label="Previous season"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-[11px] font-black uppercase tracking-widest text-gray-500 min-w-[80px] text-center">
              {activeIndex + 1} / {SEASONS.length}
            </span>
            <button 
              onClick={goNext}
              className="w-11 h-11 rounded-sm border border-gray-300 bg-white hover:border-[#006cb7] hover:text-[#006cb7] flex items-center justify-center transition-colors"
              aria-label="Next season"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* Featured Incoming – Flyer + Details side by side */}
      <section className="px-5 sm:px-8 md:px-12 max-w-6xl mx-auto mb-16">
        <div className="mb-5 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#C97C2F] animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#C97C2F]">
            Incoming Activity
          </span>
        </div>

        <Link href={upcoming.slug} className="block group">
          <motion.div 
            whileHover={{ scale: 1.005 }}
            transition={{ duration: 0.25 }}
            className="relative bg-white rounded-sm overflow-hidden shadow-xl border border-gray-200 group-hover:border-[#84BD00]/60 group-hover:shadow-[0_0_40px_rgba(132,189,0,0.25)] transition-all duration-400"
          >
            <div className="grid md:grid-cols-12">
              
              {/* Portrait Flyer */}
              <div className="md:col-span-5 relative bg-[#1a1a1a]">
                <div className="aspect-[3/4] md:aspect-auto md:h-full min-h-[420px] relative overflow-hidden">
                  <img 
                    src={upcoming.image}
                    alt={upcoming.title}
                    className="absolute inset-0 w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-[1.03]"
                  />
                  {/* Soft glow edge on hover */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none shadow-[inset_0_0_60px_rgba(132,189,0,0.2)]" />
                </div>
              </div>

              {/* Details aside */}
              <div className="md:col-span-7 p-7 sm:p-9 md:p-10 flex flex-col justify-center">
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <span className="bg-[#C97C2F] text-white text-[9px] font-black uppercase tracking-[0.18em] px-2.5 py-1 rounded-sm">
                    {upcoming.tag}
                  </span>
                  <span className="bg-gray-100 text-gray-600 text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-sm">
                    {upcoming.date}
                  </span>
                </div>

                <h2 className="text-2xl sm:text-3xl md:text-[2rem] font-black text-[#111827] uppercase tracking-tighter leading-tight mb-3">
                  {upcoming.title}
                </h2>
                
                <p className="text-gray-500 text-sm font-medium mb-6 max-w-md leading-relaxed">
                  {upcoming.description}
                </p>

                <div className="flex flex-col gap-3 mb-8">
                  <div className="flex items-center gap-2.5 text-sm font-semibold text-gray-700">
                    <MapPin className="w-4 h-4 text-[#84BD00] shrink-0" />
                    {upcoming.location}
                  </div>
                  <div className="flex items-center gap-2.5 text-sm font-semibold text-gray-700">
                    <Clock className="w-4 h-4 text-[#84BD00] shrink-0" />
                    Departure 05:00 AM • CHIC
                  </div>
                  <div className="flex items-center gap-2.5 text-sm font-semibold text-gray-700">
                    <Users className="w-4 h-4 text-[#84BD00] shrink-0" />
                    Rwandans / EAC from 110,000 RWF • Internationals 180 USD
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  <span className="inline-flex items-center gap-2 bg-[#006cb7] text-white text-[11px] font-black uppercase tracking-[0.15em] px-6 py-3.5 rounded-sm group-hover:bg-[#005b9f] transition-colors">
                    View Full Experience
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    Payment deadline 19 Aug
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </Link>
      </section>

      {/* All Seasons */}
      <section className="px-5 sm:px-8 md:px-12 max-w-6xl mx-auto pb-20">
        <h3 className="text-lg font-black uppercase tracking-tight mb-6 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-[#006cb7]" />
          All Seasons
        </h3>

        <div className="grid sm:grid-cols-2 gap-5">
          {SEASONS.map((season, index) => (
            <Link 
              key={season.id}
              href={season.slug}
              onClick={() => setActiveIndex(index)}
              className={`group relative block rounded-sm overflow-hidden border transition-all duration-300 ${
                season.status === "upcoming" 
                  ? "border-[#84BD00] shadow-lg hover:shadow-[0_0_30px_rgba(132,189,0,0.2)]" 
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="relative h-52 sm:h-56">
                <img 
                  src={season.image}
                  alt={season.title}
                  className="absolute inset-0 w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent" />

                {season.status === "upcoming" && (
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-400 pointer-events-none shadow-[inset_0_0_50px_rgba(132,189,0,0.25)]" />
                )}
              </div>

              <div className="absolute bottom-0 left-0 right-0 p-5">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-sm ${
                    season.status === "upcoming" 
                      ? "bg-[#C97C2F] text-white" 
                      : "bg-white/20 text-white"
                  }`}>
                    {season.tag}
                  </span>
                  <span className="text-[9px] font-bold text-white/70 uppercase tracking-wider">
                    {season.date}
                  </span>
                </div>
                <h4 className="text-lg font-black text-white uppercase tracking-tight leading-tight">
                  {season.shortTitle}
                </h4>
                <p className="text-[11px] text-white/70 mt-1 font-medium">
                  {season.price}
                </p>
              </div>
            </Link>
          ))}
        </div>

        <p className="mt-8 text-center text-[11px] text-gray-400 font-medium uppercase tracking-wider">
          More seasons coming soon. Use the arrows above to navigate freely.
        </p>
      </section>

      <Footer />
    </main>
  );
}
