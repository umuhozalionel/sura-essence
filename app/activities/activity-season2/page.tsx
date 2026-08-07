"use client";

import React from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  Clock, 
  MessageCircle, 
  CheckCircle2, 
  Navigation,
  Check,
  Users,
  Camera,
  Utensils,
  Car
} from "lucide-react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Manrope } from "next/font/google";

const manrope = Manrope({ 
  subsets: ["latin"], 
  weight: ["400", "500", "700", "800"],
  variable: "--font-manrope"
});

export default function ActivitySeason2() {
  const WHATSAPP_LINK = "https://wa.me/250788564000?text=Hello%20Sura%20Essence!%20I%20would%20like%20to%20book%20the%20Akagera%20National%20Park%20Experience%20on%2022%20August.";

  return (
    <main className={`min-h-screen bg-[#F5F2EA] text-[#111827] ${manrope.className}`}>
      <Header />

      {/* Hero */}
      <section className="relative w-full h-[50vh] min-h-[420px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/60 z-10" />
          <img 
            src="/activities/akagera/akagera-park.jpg" 
            alt="Akagera National Park Experience" 
            className="w-full h-full object-cover object-center" 
          />
        </div>

        <div className="relative z-20 text-center px-6 mt-12 md:mt-16 max-w-4xl">
          <span className="inline-block bg-[#C97C2F] text-white px-3.5 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] rounded-sm mb-5 shadow-md">
            Upcoming Experience
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white uppercase tracking-tighter leading-[0.95] mb-4 drop-shadow-lg">
            Akagera National Park
          </h1>
          <p className="text-white/90 text-xs md:text-sm font-bold uppercase tracking-[0.18em] max-w-2xl mx-auto leading-relaxed">
            Wildlife Game Drive • Scenic Views • Bicaca Bush Feast
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 md:py-20 px-5 sm:px-6 md:px-10 max-w-6xl mx-auto">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-[10px] font-black text-gray-500 hover:text-[#006cb7] uppercase tracking-[0.2em] transition-colors mb-10 md:mb-12"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>

        <div className="grid md:grid-cols-12 gap-10 md:gap-12">
          
          {/* Left Column */}
          <div className="md:col-span-8 flex flex-col gap-10 md:gap-12">
            
            {/* Event Details Card */}
            <div className="bg-white p-7 md:p-10 border border-gray-200 rounded-sm shadow-sm">
              <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight mb-6 md:mb-8">Event Details</h2>
              <div className="grid sm:grid-cols-3 gap-6 md:gap-8">
                <div className="flex flex-col gap-2">
                  <Calendar className="w-5 h-5 text-[#84BD00]" />
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Date</span>
                  <span className="text-sm font-black text-[#111827]">22 August 2026</span>
                </div>
                <div className="flex flex-col gap-2">
                  <MapPin className="w-5 h-5 text-[#84BD00]" />
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Departure</span>
                  <span className="text-sm font-black text-[#111827]">CHIC, Downtown Kigali</span>
                </div>
                <div className="flex flex-col gap-2">
                  <Clock className="w-5 h-5 text-[#84BD00]" />
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Time</span>
                  <span className="text-sm font-black text-[#111827]">05:00 AM Sharp</span>
                </div>
              </div>
              
              <div className="mt-8 pt-6 border-t border-gray-100">
                <p className="text-[11px] font-bold text-[#C97C2F] uppercase tracking-widest">
                  Payment deadline: 19 August 2026
                </p>
              </div>
            </div>

            {/* Itinerary */}
            <div className="flex flex-col gap-6">
              <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight">The Experience</h2>
              
              <div className="relative pl-8 border-l-2 border-gray-200 flex flex-col gap-8">
                <div className="relative">
                  <div className="absolute -left-[41px] top-1 w-5 h-5 rounded-full bg-[#84BD00] border-4 border-[#F5F2EA]" />
                  <h3 className="text-base md:text-lg font-black uppercase mb-3 text-[#006cb7]">Morning</h3>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <Navigation className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                      <span className="text-sm font-semibold text-gray-600">Depart Kigali at 05:00 AM from CHIC</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Navigation className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                      <span className="text-sm font-semibold text-gray-600">Arrive Akagera National Park – briefing & park entry</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Navigation className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                      <span className="text-sm font-semibold text-gray-600">Guided Wildlife Game Drive across the savanna</span>
                    </li>
                  </ul>
                </div>

                <div className="relative">
                  <div className="absolute -left-[41px] top-1 w-5 h-5 rounded-full bg-[#C97C2F] border-4 border-[#F5F2EA]" />
                  <h3 className="text-base md:text-lg font-black uppercase mb-3 text-[#006cb7]">Midday & Afternoon</h3>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <Navigation className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                      <span className="text-sm font-semibold text-gray-600">Bicaca Bush Feast Experience – traditional outdoor meal</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Navigation className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                      <span className="text-sm font-semibold text-gray-600">Continue game drive – elephants, giraffes, zebras, antelopes & more</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Navigation className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                      <span className="text-sm font-semibold text-gray-600">Scenic viewpoints & photography stops</span>
                    </li>
                  </ul>
                </div>

                <div className="relative">
                  <div className="absolute -left-[41px] top-1 w-5 h-5 rounded-full bg-[#006cb7] border-4 border-[#F5F2EA]" />
                  <h3 className="text-base md:text-lg font-black uppercase mb-3 text-[#006cb7]">Evening</h3>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <Navigation className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                      <span className="text-sm font-semibold text-gray-600">Return journey to Kigali</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Navigation className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                      <span className="text-sm font-semibold text-gray-600">Arrival expected in the evening</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Highlights */}
            <div className="bg-[#111827] text-white p-7 md:p-9 rounded-sm shadow-md">
              <h3 className="text-lg font-black uppercase tracking-tight mb-6">Experience Highlights</h3>
              <div className="grid sm:grid-cols-2 gap-3.5">
                {[
                  { icon: Camera, text: "Wildlife Game Drive" },
                  { icon: Navigation, text: "Scenic Views & Adventure" },
                  { icon: Utensils, text: "Bicaca Bush Feast" },
                  { icon: Car, text: "Comfortable Safari Vehicle" },
                  { icon: CheckCircle2, text: "Breathtaking Nature" },
                  { icon: Users, text: "Professional Guide" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 bg-white/5 border border-white/10 p-3.5 rounded-sm">
                    <item.icon className="w-4 h-4 text-[#84BD00] shrink-0" />
                    <span className="text-[11px] font-bold uppercase tracking-widest">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Right Column – Pricing (Sticky) */}
          <div className="md:col-span-4">
            <div className="sticky top-28 flex flex-col gap-5">
              
              {/* Main Package – Locals / EAC */}
              <div className="bg-white border-2 border-[#84BD00] rounded-sm p-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-[#84BD00] text-white px-3 py-1 text-[9px] font-black uppercase tracking-widest">
                  Recommended
                </div>
                <h3 className="text-xl font-black uppercase tracking-tighter mb-1">Rwandans / EAC</h3>
                <div className="text-3xl font-black text-[#84BD00] mb-1">
                  110,000 <span className="text-sm text-gray-500 font-bold">RWF</span>
                </div>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-5">Kids: 100,000 RWF</p>
                
                <ul className="space-y-2.5 mb-7 text-sm font-semibold text-gray-600">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#84BD00] shrink-0" /> Round-trip transport
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#84BD00] shrink-0" /> Park entry fees
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#84BD00] shrink-0" /> Guided game drive
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#84BD00] shrink-0" /> Bicaca Bush Feast
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#84BD00] shrink-0" /> Professional safari guide
                  </li>
                </ul>

                <a 
                  href={WHATSAPP_LINK} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#128C7E] text-white py-3.5 text-[11px] font-black uppercase tracking-widest transition-colors rounded-sm shadow-md"
                >
                  <MessageCircle className="w-4 h-4" /> Book Now
                </a>
              </div>

              {/* International Package */}
              <div className="bg-white border border-gray-200 rounded-sm p-6 shadow-sm">
                <h3 className="text-lg font-black uppercase tracking-tighter mb-1">Internationals</h3>
                <div className="text-2xl font-black text-[#111827] mb-5">
                  180 <span className="text-sm text-gray-500 font-bold">USD</span>
                </div>
                
                <ul className="space-y-2 mb-6 text-xs font-semibold text-gray-500">
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-gray-400 shrink-0" /> All inclusions above
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-gray-400 shrink-0" /> Priority coordination
                  </li>
                </ul>

                <a 
                  href={WHATSAPP_LINK} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="w-full flex items-center justify-center gap-2 bg-[#006cb7] hover:bg-[#005b9f] text-white py-3 text-[10px] font-black uppercase tracking-widest transition-colors rounded-sm"
                >
                  Book International
                </a>
              </div>

              {/* Note */}
              <div className="bg-[#F5F2EA] border border-gray-200 rounded-sm p-4 text-center">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider leading-relaxed">
                  Limited seats. Secure your spot before the payment deadline.
                </p>
              </div>

            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
