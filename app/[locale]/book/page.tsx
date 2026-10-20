"use client";

import dynamic from "next/dynamic";
import { useRef, useState } from "react";
import BookingForm from "@/components/booking-form";
import { ArrowLeft, Car, Shield, Lock, MapPin } from "lucide-react";
import { motion } from "framer-motion";
import { useFormatter, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

function MapPlaceholder() {
  const t = useTranslations("Book");

  return (
    <div className="w-full h-full bg-muted animate-pulse flex flex-col items-center justify-center">
      <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
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

  // The latest ends, so two updates in a row (e.g. a link that sets both) see each other.
  const ends = useRef<{ pickup: [number, number] | null; dropoff: [number, number] | null }>({ pickup: null, dropoff: null });
  const routeRequest = useRef(0);

  const handleRouteUpdate = async (type: 'pickup' | 'dropoff', coords: [number, number] | null) => {
    ends.current[type] = coords;
    if (type === 'pickup') setPickup(coords);
    if (type === 'dropoff') setDropoff(coords);

    const { pickup: start, dropoff: end } = ends.current;
    const request = ++routeRequest.current;
    setRouteCoords([]);
    setDistanceKm(null);
    setDurationMin(null);

    if (start && end) {
      try {
        const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`);
        const data = await res.json();
        // Ignore an answer for ends that have changed since.
        if (request !== routeRequest.current) return;
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
    <div
      className={`min-h-dvh lg:h-dvh lg:min-h-[640px] flex flex-col bg-background bg-cover bg-center bg-no-repeat py-4 sm:py-6 lg:py-8 px-4 sm:px-6 lg:px-10`}
      style={{
        backgroundImage:
          "linear-gradient(rgba(10, 17, 40, 0.45), rgba(10, 17, 40, 0.45)), url('/backgrounds/nyungwe_sky.jpg')",
      }}
    >
      <h1 className="sr-only">{t("title")}</h1>

      {/* HEADER */}
      <div className="w-full max-w-[1800px] mx-auto flex items-center justify-between mb-4 sm:mb-6 flex-shrink-0">
           <Link href="/" className="min-h-12 px-5 sm:px-6 py-3 rounded-full bg-white/95 backdrop-blur-sm ring-1 ring-black/5 shadow-lg shadow-black/10 hover:text-primary font-bold text-xs uppercase tracking-widest flex items-center gap-2 transition-all">
             <ArrowLeft size={14} /> {t("back")}
           </Link>
           <div className="flex items-center gap-3 rounded-full bg-white/95 backdrop-blur-sm pl-2 pr-5 py-2 ring-1 ring-black/5 shadow-lg shadow-black/10">
             <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <Car size={14} className="text-white" />
             </div>
             <span className="font-extrabold text-xs uppercase tracking-widest text-foreground">{t("brand")}</span>
           </div>
      </div>

      {/* SPLIT LAYOUT — on large screens the card fills the screen: the form steps on the
          left (scrolling inside if needed) and the map fixed on the right. On phones the
          map is a short preview above the form and the page scrolls. */}
      <div className="w-full max-w-[1800px] mx-auto flex-1 lg:min-h-0 grid grid-cols-1 lg:grid-cols-2 lg:grid-rows-[minmax(0,1fr)] gap-0 rounded-2xl lg:overflow-hidden ring-1 ring-black/5 shadow-2xl shadow-black/30 bg-card">
          
          {/* LEFT: FORM */}
          <div className="order-2 lg:order-1 h-full min-w-0 lg:min-h-0 lg:border-r border-border">
             <BookingForm onRouteUpdate={handleRouteUpdate} />
          </div>

          {/* RIGHT: MAP */}
          <div className="order-1 lg:order-2 relative isolate h-56 sm:h-72 lg:h-full lg:min-h-0 overflow-hidden rounded-t-2xl lg:rounded-none bg-muted/40">
             <MapWidget pickupCoords={pickup} dropoffCoords={dropoff} routeCoords={routeCoords} />
             
             {/* SQUARE HUD (Clean White Box) */}
             {(distanceKm !== null || durationMin !== null) && (
               <motion.div 
                 initial={{ opacity: 0, x: 20 }} 
                 animate={{ opacity: 1, x: 0 }} 
                 className="absolute top-0 right-0 z-[1000] bg-white/95 backdrop-blur-sm p-4 lg:p-8 min-w-[150px] lg:min-w-[240px] border-l border-b border-border rounded-bl-2xl"
               >
                  <div className="flex flex-col gap-3 lg:gap-6">
                    <div>
                      <p className="text-xs uppercase font-bold text-muted-foreground tracking-widest mb-2">{t("estTime")}</p>
                      <div className="flex items-center gap-3">
                         <div className="w-1.5 lg:w-2 h-6 lg:h-8 rounded-full bg-primary" /> {/* Copper Accent Bar */}
                         <p className="text-2xl lg:text-4xl font-extrabold text-foreground tracking-tighter">
                           {durationMin !== null ? `${format.number(durationMin)} min` : "—"}
                         </p>
                      </div>
                    </div>
                    <div className="h-[1px] bg-muted/70 w-full" />
                    <div>
                      <p className="text-xs uppercase font-bold text-muted-foreground tracking-widest mb-2">{t("distance")}</p>
                      <div className="flex items-center gap-2">
                         <MapPin className="w-4 h-4 text-primary" />
                         <p className="text-lg font-bold text-muted-foreground">
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
      <div className="w-full max-w-[1800px] mx-auto mt-4 sm:mt-6 flex-shrink-0 flex justify-between items-center opacity-80">
         <span className="text-xs font-extrabold uppercase tracking-widest text-white">{t("copyright", { year: new Date().getFullYear() })}</span>
         <div className="flex gap-4 text-white"><Shield size={14}/><Lock size={14}/></div>
      </div>
    </div>
  );
}