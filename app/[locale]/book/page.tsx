"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import BookingForm from "@/components/booking-form";
import { ArrowLeft, Car, Shield, Lock, MapPin } from "lucide-react";
import { motion } from "framer-motion";
import { useFormatter, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Manrope } from "next/font/google";

const manrope = Manrope({ 
  subsets: ["latin"], 
  weight: ["400", "500", "700", "800"],
  variable: "--font-manrope"
});

function MapPlaceholder() {
  const t = useTranslations("Book");

  return (
    <div className="w-full h-full bg-[#E5E5E5] animate-pulse flex flex-col items-center justify-center">
      <span className="text-xs font-bold uppercase tracking-widest text-gray-400">
        {t("loadingMap")}
      </span>
    </div>
  );
}

const MapWidget = dynamic(() => import("@/components/ui/map-widget"), {
  ssr: false,
  loading: () => <MapPlaceholder />,
});

export default function BookPage() {
  const t = useTranslations("Book");
  const format = useFormatter();

  const [pickup, setPickup] = useState<[number, number] | null>(null);
  const [dropoff, setDropoff] = useState<[number, number] | null>(null);
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [durationMin, setDurationMin] = useState<number | null>(null);

  const handleRouteUpdate = async (type: 'pickup' | 'dropoff', coords: [number, number]) => {
    if (type === 'pickup') setPickup(coords);
    if (type === 'dropoff') setDropoff(coords);

    const start = type === 'pickup' ? coords : pickup;
    const end = type === 'dropoff' ? coords : dropoff;

    if (start && end) {
      try {
        const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`);
        const data = await res.json();
        if (data.routes && data.routes[0]) {
           const coords = data.routes[0].geometry.coordinates.map((c: number[]) => [c[1], c[0]] as [number, number]);
           setRouteCoords(coords);
           setDistanceKm(data.routes[0].distance / 1000);
           setDurationMin(Math.round(data.routes[0].duration / 60));
        }
      } catch (e) { console.error("Routing failed", e); }
    }
  };

  return (
    <main className={`min-h-screen bg-[#F9F8F6] py-12 px-6 ${manrope.className}`}>
      
      {/* HEADER */}
      <div className="max-w-7xl mx-auto flex items-center justify-between mb-12">
           <Link href="/" className="px-6 py-3 bg-white border border-gray-200 shadow-sm hover:border-[#125740]/50 font-bold text-xs uppercase tracking-widest flex items-center gap-2 transition-all">
             <ArrowLeft size={14} /> {t("back")}
           </Link>
           <div className="flex items-center gap-3 bg-white px-5 py-3 border border-gray-200 shadow-sm">
             <div className="w-6 h-6 bg-[#125740] flex items-center justify-center">
                <Car size={14} className="text-white" />
             </div>
             <span className="font-black text-xs uppercase tracking-widest text-[#0A1128]">{t("brand")}</span>
           </div>
      </div>

      {/* SPLIT GRID LAYOUT */}
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-0 shadow-2xl bg-white">
          
          {/* LEFT: FORM (Clean & Sharp) */}
          <div className="h-full border-r border-gray-100">
             <BookingForm onRouteUpdate={handleRouteUpdate} />
          </div>

          {/* RIGHT: MAP (Sharp Container) */}
          <div className="hidden lg:block h-full min-h-[600px] relative bg-gray-50">
             <MapWidget pickupCoords={pickup} dropoffCoords={dropoff} routeCoords={routeCoords} />
             
             {/* SQUARE HUD (Clean White Box) */}
             {(distanceKm !== null || durationMin !== null) && (
               <motion.div 
                 initial={{ opacity: 0, x: 20 }} 
                 animate={{ opacity: 1, x: 0 }} 
                 className="absolute top-0 right-0 z-[1000] bg-white/95 backdrop-blur-sm p-8 min-w-[240px] border-l border-b border-gray-200"
               >
                  <div className="flex flex-col gap-6">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-2">{t("estTime")}</p>
                      <div className="flex items-center gap-3">
                         <div className="w-2 h-8 bg-[#125740]" /> {/* Copper Accent Bar */}
                         <p className="text-4xl font-black text-[#0A1128] tracking-tighter">
                           {durationMin !== null ? `${format.number(durationMin)} min` : "—"}
                         </p>
                      </div>
                    </div>
                    <div className="h-[1px] bg-gray-100 w-full" />
                    <div>
                      <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-2">{t("distance")}</p>
                      <div className="flex items-center gap-2">
                         <MapPin className="w-4 h-4 text-[#125740]" />
                         <p className="text-lg font-bold text-gray-600">
                           {distanceKm !== null
                             ? `${format.number(distanceKm, { maximumFractionDigits: 1 })} km`
                             : "—"}
                         </p>
                      </div>
                    </div>
                 </div>
               </motion.div>
             )}
          </div>
      </div>

      {/* FOOTER */}
      <div className="max-w-7xl mx-auto mt-12 flex justify-between items-center opacity-40">
         <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#0A1128]">{t("copyright")}</span>
         <div className="flex gap-4 text-[#0A1128]"><Shield size={14}/><Lock size={14}/></div>
      </div>
    </main>
  );
}