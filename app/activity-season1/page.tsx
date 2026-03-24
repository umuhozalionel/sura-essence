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
  Check // Added missing import
} from "lucide-react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Manrope } from "next/font/google";

const manrope = Manrope({ 
  subsets: ["latin"], 
  weight: ["400", "500", "700", "800"],
  variable: "--font-manrope"
});

export default function ActivitySeason1() {
  const WHATSAPP_LINK = "https://wa.me/250788564000?text=Hello!%20I%20would%20like%20to%20book%20a%20package%20for%20the%20Discover%20Bigogwe%20trip.";

  return (
    <main className={`min-h-screen bg-[#F5F2EA] text-[#111827] ${manrope.className}`}>
      <Header />

      <section className="relative w-full h-[50vh] min-h-[400px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-black/60 z-10" />
          <img src="/Gemin.jpg" alt="Discover Bigogwe" className="w-full h-full object-cover object-top" />
        </div>

        <div className="relative z-20 text-center px-6 mt-16 max-w-4xl">
          <span className="inline-block bg-[#C97C2F] text-white px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] rounded-sm mb-4">
            Official Event
          </span>
          <h1 className="text-5xl md:text-7xl font-black text-white uppercase tracking-tighter leading-tight mb-4 drop-shadow-md">
            Discover Bigogwe
          </h1>
          <p className="text-white/90 text-xs md:text-sm font-bold uppercase tracking-widest max-w-2xl mx-auto leading-relaxed">
            Green Hills • Cattle Culture • Highland Experience
          </p>
        </div>
      </section>

      <section className="py-20 px-6 md:px-10 max-w-6xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-[10px] font-black text-gray-500 hover:text-[#006cb7] uppercase tracking-[0.2em] transition-colors mb-12">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>

        <div className="grid md:grid-cols-12 gap-12">
          <div className="md:col-span-8 flex flex-col gap-12">
            
            <div className="bg-white p-8 md:p-10 border border-gray-200 rounded-sm shadow-sm">
              <h2 className="text-2xl font-black uppercase tracking-tight mb-6">Event Details</h2>
              <div className="grid sm:grid-cols-3 gap-6">
                <div className="flex flex-col gap-2">
                  <Calendar className="w-5 h-5 text-[#84BD00]" />
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Date</span>
                  <span className="text-sm font-black text-[#111827]">March 28-29, 2026</span>
                </div>
                <div className="flex flex-col gap-2">
                  <MapPin className="w-5 h-5 text-[#84BD00]" />
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Departure</span>
                  <span className="text-sm font-black text-[#111827]">CHIC, Downtown</span>
                </div>
                <div className="flex flex-col gap-2">
                  <Clock className="w-5 h-5 text-[#84BD00]" />
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Time</span>
                  <span className="text-sm font-black text-[#111827]">4:00 AM - 5:00 AM</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-6">
              <h2 className="text-2xl font-black uppercase tracking-tight">The Itinerary</h2>
              
              <div className="relative pl-8 border-l-2 border-gray-200 flex flex-col gap-8">
                <div className="relative">
                  <div className="absolute -left-[41px] top-1 w-5 h-5 rounded-full bg-[#84BD00] border-4 border-[#F5F2EA]" />
                  <h3 className="text-lg font-black uppercase mb-3 text-[#006cb7]">Day 1</h3>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <Navigation className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                      <span className="text-sm font-semibold text-gray-600">Depart Kigali (early morning)</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Navigation className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                      <span className="text-sm font-semibold text-gray-600">Explore Bigogwe: hiking, cow experience, traditional food</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Navigation className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                      <span className="text-sm font-semibold text-gray-600">Afternoon transfer to Gisenyi. Special Dinner on the 28th included. (Overnight stay in Gisenyi, Lake Kivu)</span>
                    </li>
                  </ul>
                </div>

                <div className="relative">
                  <div className="absolute -left-[41px] top-1 w-5 h-5 rounded-full bg-[#C97C2F] border-4 border-[#F5F2EA]" />
                  <h3 className="text-lg font-black uppercase mb-3 text-[#006cb7]">Day 2</h3>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <Navigation className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                      <span className="text-sm font-semibold text-gray-600">Breakfast on the 29th in Gisenyi</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Navigation className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                      <span className="text-sm font-semibold text-gray-600">Relaxation or Optional Activities</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Navigation className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                      <span className="text-sm font-semibold text-gray-600">Return to Kigali</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-[#111827] text-white p-8 rounded-sm shadow-md mt-4">
              <h3 className="text-lg font-black uppercase tracking-tight mb-6">Experience Highlights</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                {["Hiking the Highlands", "Cow & Milk Experience", "Traditional Food", "Urukiramende (Acrobatics)"].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 bg-white/5 border border-white/10 p-4 rounded-sm">
                    <CheckCircle2 className="w-4 h-4 text-[#84BD00]" />
                    <span className="text-xs font-bold uppercase tracking-widest">{item}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          <div className="md:col-span-4">
            <div className="sticky top-32 flex flex-col gap-6">
              
              <div className="bg-white border-2 border-[#84BD00] rounded-sm p-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-[#84BD00] text-white px-3 py-1 text-[9px] font-black uppercase tracking-widest">Recommended</div>
                <h3 className="text-2xl font-black uppercase tracking-tighter mb-2">Full Package</h3>
                <div className="text-3xl font-black text-[#84BD00] mb-6">80,000 <span className="text-sm text-gray-500">RWF</span></div>
                
                <ul className="space-y-3 mb-8 text-sm font-semibold text-gray-600">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#84BD00]" /> Transport (Round Trip)</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#84BD00]" /> 01 Dinner (on 28th)</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#84BD00]" /> 01 Breakfast (on 29th)</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#84BD00]" /> Activities & Entry Fees</li>
                </ul>

                <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" className="w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#128C7E] text-white py-4 text-[11px] font-black uppercase tracking-widest transition-colors rounded-sm shadow-md">
                  <MessageCircle className="w-4 h-4" /> Book Full Package
                </a>
              </div>

              <div className="bg-white border border-gray-200 rounded-sm p-6 shadow-sm">
                <h3 className="text-xl font-black uppercase tracking-tighter mb-2">Basic Package</h3>
                <div className="text-2xl font-black text-[#111827] mb-4">50,000 <span className="text-xs text-gray-500">RWF</span></div>
                
                <ul className="space-y-2 mb-6 text-xs font-semibold text-gray-500">
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-gray-400" /> Transport (Round Trip)</li>
                  <li className="flex items-center gap-2 text-gray-400 italic">(No overnight stay or meals)</li>
                </ul>

                <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" className="w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-[#111827] py-3 text-[10px] font-black uppercase tracking-widest transition-colors rounded-sm">
                  Book Basic Package
                </a>
              </div>

            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}