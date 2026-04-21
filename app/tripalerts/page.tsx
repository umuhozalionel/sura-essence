"use client";

import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { AlertCircle, Calendar, ChevronRight, Globe, Info, ShieldAlert } from "lucide-react";
import { Manrope } from "next/font/google";
import Link from "next/link";

const manrope = Manrope({ 
  subsets: ["latin"], 
  weight: ["400", "500", "700", "800"],
  variable: "--font-manrope"
});

const ALERTS = [
  {
    id: 1,
    title: "IMPORTANT ROUTE UPDATE FOR CROSS-BORDER TRANSFERS.",
    date: "04-03-2026",
    content: "Due to continued road infrastructure upgrades and regional border assessments, all SURA cross-border Driver and self-drive transfers to specific regions are suspended until further notice:\n\n• Goma Border Post (DRC)\n• Bukavu Border Post (DRC)\n• Select Northern Corridors\n\nWhile these specific international services are affected, the entirety of the SURA internal Rwandan network, including all National Parks (Akagera, Nyungwe, Volcanoes), continues to operate as scheduled with zero delays. The safety and security of our clients and Drivers remain our absolute top priority.\n\nWe are closely monitoring the situation and will provide further updates as soon as more information becomes available. Affected clients may reschedule their itineraries for a later date without penalty.\n\nWe sincerely apologize for the inconvenience caused. For further assistance or itinerary adjustments, please contact our concierge team at Suraessenceltd@gmail.com or reach out via our 24/7 WhatsApp desk.",
    isUrgent: true
  },
  {
    id: 2,
    title: "Kigali Airport VIP Meet-and-Greet Processing Times",
    date: "12-01-2026",
    content: "Due to increased seasonal volume, please allow up to 45 minutes for customs clearance upon arrival at KGL. Your SURA Driver will actively monitor your flight status and will wait at the arrivals terminal holding a standardized SURA identification board. No wait-time fees will be incurred for customs delays.",
    isUrgent: false
  },
  {
    id: 3,
    title: "Fleet Luggage & Equipment Restrictions",
    date: "04-12-2025",
    content: "When booking Executive Sedans, please note that luggage capacity is strictly limited to 2 standard check-in bags. For clients travelling with heavy expedition gear, photography equipment, or excess baggage, upgrading to a Premium SUV or Expedition 4x4 is mandated for your comfort and vehicle safety.",
    isUrgent: false
  },
  {
    id: 4,
    title: "ENTRY REQUIREMENTS FOR NATIONAL PARKS",
    date: "16-10-2025",
    content: "All clients embarking on Gorilla Trekking (Volcanoes National Park) or Safaris (Akagera) must ensure their permits are processed at least 72 hours prior to departure. SURA Essence concierge services can handle these logistics on your behalf. Ensure you carry your original passport for all internal transit.",
    isUrgent: false
  },
  {
    id: 5,
    title: "Rwanda Environmental Policy: Plastic Ban",
    date: "03-10-2025",
    content: "Rwanda enforces a strict nationwide ban on non-biodegradable plastic bags. Please ensure your luggage does not contain polythene bags before arrival. SURA Essence provides eco-friendly refreshment packaging in all our fleet vehicles.",
    isUrgent: false
  }
];

export default function TripAlertsPage() {
  return (
    <main className={`min-h-screen w-full bg-[#F5F2EA] text-[#111827] ${manrope.className}`}>
      {/* Reusing the transparent header, so we need a dark background for this page's top section */}
      <Header />

      {/* Hero Header for Alerts */}
      <div className="bg-[#111827] pt-40 pb-20 px-6 relative overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#ffffff 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }} />
        <div className="max-w-4xl mx-auto relative z-10 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-[#C97C2F] flex items-center justify-center rounded-none mb-8">
                <Globe className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-white uppercase tracking-tighter mb-4">
                Operational <span className="text-[#C97C2F]">Alerts.</span>
            </h1>
            <p className="text-white/60 font-black uppercase tracking-widest text-sm md:text-base max-w-2xl">
                Live updates regarding routes, border protocols, and fleet operations across the SURA network.
            </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-20">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 mb-12 border-b border-gray-200 pb-4">
            <Link href="/" className="hover:text-[#C97C2F] transition-colors">Home</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-[#111827]">Travel Alerts</span>
        </div>

        {/* Alerts Feed */}
        <div className="space-y-8">
            {ALERTS.map((alert) => (
                <article key={alert.id} className="bg-white border border-gray-200 shadow-xl rounded-none relative overflow-hidden group">
                    {alert.isUrgent && (
                        <div className="absolute top-0 left-0 w-full h-1 bg-[#ef4444]" />
                    )}
                    {!alert.isUrgent && (
                        <div className="absolute top-0 left-0 w-full h-1 bg-[#C97C2F]" />
                    )}
                    
                    <div className="p-8 md:p-10">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-gray-400 bg-gray-50 px-3 py-1.5 border border-gray-100">
                                <Calendar className="w-3 h-3 text-[#C97C2F]" />
                                Published: {alert.date}
                            </div>
                            {alert.isUrgent && (
                                <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-[#ef4444] bg-red-50 px-3 py-1.5 border border-red-100">
                                    <ShieldAlert className="w-3 h-3" />
                                    Urgent Protocol
                                </div>
                            )}
                        </div>

                        <h2 className="text-2xl md:text-3xl font-black text-[#111827] uppercase tracking-tighter mb-6 leading-tight">
                            {alert.title}
                        </h2>

                        <div className="prose prose-sm md:prose-base max-w-none text-gray-600 font-medium leading-relaxed whitespace-pre-wrap">
                            {alert.content}
                        </div>
                    </div>
                </article>
            ))}
        </div>

        {/* Support Block */}
        <div className="mt-20 bg-[#111827] text-white p-10 flex flex-col items-center text-center border-t-4 border-[#C97C2F]">
            <Info className="w-8 h-8 text-[#C97C2F] mb-6" />
            <h3 className="text-2xl font-black uppercase tracking-tighter mb-4">Require Immediate Assistance?</h3>
            <p className="text-white/70 font-bold uppercase tracking-widest text-xs mb-8 max-w-lg leading-relaxed">
                If your itinerary is affected by any of the active alerts, our concierge team is on standby to reroute and secure your transit.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                <a href="mailto:Suraessenceltd@gmail.com" className="bg-[#C97C2F] hover:bg-white hover:text-[#111827] text-white px-8 py-4 text-[10px] font-black uppercase tracking-[0.2em] transition-colors rounded-none text-center">
                    Email Dispatch
                </a>
                <a href="https://wa.me/250788845062" target="_blank" className="bg-white/10 hover:bg-white hover:text-[#111827] text-white px-8 py-4 text-[10px] font-black uppercase tracking-[0.2em] transition-colors rounded-none text-center border border-white/20">
                    WhatsApp Desk
                </a>
            </div>
        </div>

      </div>

      <Footer />
    </main>
  );
}