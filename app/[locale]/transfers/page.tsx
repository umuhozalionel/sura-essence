"use client";

import React, { useState, useEffect, Suspense, useMemo } from "react";
import { Manrope } from "next/font/google";
import { 
  ArrowRight, Sun, Moon, Zap, Timer, CloudRain, TrafficCone,
  AlertTriangle, Map, ChevronDown, ArrowUp
} from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { getIcon } from "@/lib/icons";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

const manrope = Manrope({ 
  subsets: ["latin"], 
  weight: ["400", "500", "700", "800"],
  variable: "--font-manrope"
});

// Environment variables recommended for production
const API_KEY = "23f292fb66ec335896541f0b5e8b87bf"; 
const CITY = "Kigali";

// Routes, prices and every piece of text come from messages/en.json + messages/fr.json
// (namespace "Transfers"). Add a route or change a price by editing those two files.
type Vehicle = { id: string; icon: string; label: string };
type Route = {
  id: string;
  icon: string;
  km: number;
  isMountainous: boolean;
  prices: Record<string, number>;
  destination: string;
  duration: string;
  insight: string;
};
type Guarantee = { id: string; icon: string; title: string; description: string };

function TransfersContent() {
  const t = useTranslations("Transfers");
  const tr = useTranslations("Transfers.routes");
  const format = useFormatter();
  const vehicles = tr.raw("vehicles") as Vehicle[];
  const routes = tr.raw("items") as Route[];
  const guarantees = t.raw("guarantee.items") as Guarantee[];

  const [isMounted, setIsMounted] = useState(false);
  const [kigaliTime, setKigaliTime] = useState("");
  const [weatherStatus, setWeatherStatus] = useState<{ temp: number; condition: string } | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  
  const [rawRates, setRawRates] = useState<{ USD: number, EUR: number, GBP: number } | null>(null);
  const [amounts, setAmounts] = useState<Record<string, number | string>>({ USD: 1, EUR: 1, GBP: 1 });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Back to top scroll listener
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 500) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    async function fetchLiveUpdates() {
      try {
        const weatherRes = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${CITY}&units=metric&appid=${API_KEY}`);
        if (weatherRes.ok) {
           const weatherData = await weatherRes.json();
           setWeatherStatus({ temp: Math.round(weatherData.main.temp), condition: weatherData.weather[0].main });
        }

        const rateRes = await fetch('https://api.exchangerate-api.com/v4/latest/RWF');
        if (rateRes.ok) {
          const rateData = await rateRes.json();
          setRawRates({ USD: rateData.rates.USD, EUR: rateData.rates.EUR, GBP: rateData.rates.GBP });
        }
      } catch (e) { 
        setWeatherStatus({ temp: 24, condition: "Clear" }); 
      }
    }
    fetchLiveUpdates();
    const interval = setInterval(fetchLiveUpdates, 1800000); 
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const updateTime = () => {
      setKigaliTime(new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Africa/Kigali', hour: '2-digit', minute: '2-digit', hour12: false
      }).format(new Date()));
    };
    updateTime();
    const timer = setInterval(updateTime, 60000);
    return () => clearInterval(timer);
  }, []);

  const triggerHaptic = () => { if (typeof window !== "undefined" && window.navigator.vibrate) window.navigator.vibrate(10); };

  const convertToRWF = (ratePerRWF: number, amount: number | string) => {
    if (!ratePerRWF || amount === "") return "---";
    return Math.round((1 / ratePerRWF) * (amount as number)).toLocaleString();
  };

  const handleAmountChange = (label: string, value: string) => {
    if (value === "") {
        setAmounts(prev => ({ ...prev, [label]: "" }));
        return;
    }
    const num = parseFloat(value);
    setAmounts(prev => ({ ...prev, [label]: isNaN(num) ? "" : num }));
  };

  const travelStatus = useMemo(() => {
    if (!kigaliTime) return { label: t("dashboard.statusLoading"), icon: Timer, color: "text-white/50" };
    const hour = parseInt(kigaliTime.split(":")[0]);
    if (hour >= 17 && hour < 18) return { label: t("dashboard.statusSunset"), icon: Sun, color: "text-secondary" };
    if (hour >= 18 || hour < 5) return { label: t("dashboard.statusNight"), icon: Moon, color: "text-blue-300" };
    return { label: t("dashboard.statusDay"), icon: Zap, color: "text-secondary" };
  }, [kigaliTime, t]);

  const scrollToNextSection = () => {
    window.scrollTo({ top: window.innerHeight, behavior: 'smooth' });
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <main className={`min-h-screen bg-background text-foreground transition-colors duration-300 ${manrope.className} selection:bg-primary/20 relative`}>
      <Header />

      {/* HERO SECTION */}
      <section className="relative pt-40 pb-20 px-6 md:px-10 min-h-[90vh] flex items-center bg-foreground overflow-hidden">
        <div className="absolute inset-0 z-0 bg-cover bg-center opacity-30" style={{ backgroundImage: "url('/backgrounds/winding-road.jpg')" }} />
        <div className="absolute inset-0 bg-gradient-to-r from-foreground/95 via-foreground/80 to-transparent" />

        <div className="relative z-10 max-w-[1600px] mx-auto w-full grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-3 py-2 px-4 bg-white/5 backdrop-blur-md text-secondary font-bold text-xs uppercase tracking-widest mb-8 border border-white/10 rounded-sm">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              {t("badge")}
            </div>
            <h1 className="text-5xl md:text-8xl font-black text-white mb-8 leading-[0.9] tracking-tight">
              {t("title")} <br/><span className="text-secondary">{t("titleHighlight")}</span>
            </h1>
            <p className="text-lg md:text-xl text-white/80 max-w-xl font-medium leading-relaxed border-l-2 border-secondary pl-6">
              {t("subtitle")}
            </p>
          </div>

          {/* DYNAMIC DASHBOARD WIDGET */}
          <div className="flex flex-col gap-6 lg:pl-10">
             <div className="flex items-center justify-between border-b border-white/20 pb-4">
                <span className="text-xs font-bold text-white/60 uppercase tracking-widest">{t("dashboard.title")}</span>
             </div>
             
             <div className="grid grid-cols-2 gap-8 border-b border-white/20 pb-6">
                <div className="space-y-1">
                   <span className="text-xs font-bold text-white/50 uppercase tracking-widest">{t("dashboard.localTime")}</span>
                   <p className="text-3xl font-black text-white tabular-nums">
                     {isMounted ? kigaliTime : "--:--"}
                   </p>
                </div>
                <div className="space-y-1">
                   <span className="text-xs font-bold text-white/50 uppercase tracking-widest">{t("dashboard.weather")}</span>
                   <p className="text-3xl font-black text-white">
                     {isMounted && weatherStatus ? `${weatherStatus.temp}°C` : "--°C"}
                   </p>
                </div>
             </div>

             <div className="space-y-4 border-b border-white/20 pb-6">
                <span className="text-xs font-bold text-secondary uppercase tracking-widest block">{t("dashboard.currencyTitle")}</span>
                <div className="grid grid-cols-3 gap-2">
                   {[
                      { label: "USD", symbol: "$", key: "USD" },
                      { label: "EUR", symbol: "€", key: "EUR" },
                      { label: "GBP", symbol: "£", key: "GBP" }
                   ].map((cur) => (
                      <div key={cur.key} className="bg-white/10 backdrop-blur-sm p-4 border border-white/10 rounded-sm hover:bg-white/20 transition-colors">
                         <div className="flex items-center gap-2 mb-1">
                            <span className="text-white font-bold text-sm">{cur.symbol}</span>
                            <input 
                               type="number" 
                               value={amounts[cur.key as keyof typeof amounts]}
                               onChange={(e) => handleAmountChange(cur.key, e.target.value)}
                               className="bg-transparent border-none focus:ring-0 p-0 text-white font-bold text-lg w-full outline-none"
                               placeholder="0"
                            />
                         </div>
                         <div className="text-xs font-bold text-secondary tabular-nums">
                            {rawRates ? convertToRWF(rawRates[cur.key as keyof typeof rawRates], amounts[cur.key]) : "---"}
                         </div>
                      </div>
                   ))}
                </div>
             </div>

             <div className="flex items-center gap-3 py-3 px-4 bg-white/10 backdrop-blur-sm border border-white/10 rounded-sm">
                <travelStatus.icon className={`w-5 h-5 ${travelStatus.color}`} />
                <span className="text-xs font-bold text-white uppercase tracking-widest">{travelStatus.label}</span>
             </div>

             <Link href="/book?tab=country" onClick={triggerHaptic} className="h-16 mt-2 bg-primary hover:bg-secondary text-primary-foreground hover:text-secondary-foreground transition-all flex items-center justify-between px-8 rounded-sm shadow-xl shadow-primary/20">
                <span className="text-sm font-bold uppercase tracking-widest">{t("dashboard.book")}</span>
                <ArrowRight className="w-5 h-5" />
             </Link>
          </div>
        </div>

        {/* SCROLL INDICATOR */}
        <div 
          onClick={scrollToNextSection}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-2 cursor-pointer z-20 group hover:opacity-80 transition-opacity"
        >
          <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest group-hover:text-white transition-colors"></span>
          <ChevronDown className="w-6 h-6 text-white/50 group-hover:text-white animate-bounce" />
        </div>
      </section>

      {/* ROUTE & PRICING BOARD */}
      <section className="py-24 px-6 md:px-10 max-w-[1600px] mx-auto relative z-20">
        <div className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
           <div className="max-w-2xl border-l-4 border-secondary pl-6">
              <h2 className="text-4xl md:text-5xl font-black text-foreground tracking-tight mb-4 transition-colors">{tr("title")}</h2>
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">{tr("subtitle")}</p>
           </div>
           
           {weatherStatus?.condition === "Rain" && (
             <div className="bg-destructive/10 text-destructive px-6 py-4 rounded-sm flex items-center gap-4 shadow-lg border border-destructive/20">
                <AlertTriangle size={20} className="text-destructive" />
                <div className="flex flex-col">
                  <span className="text-xs font-bold uppercase tracking-widest text-destructive">{tr("advisoryTitle")}</span>
                  <span className="text-xs text-destructive/80">{tr("advisoryText")}</span>
                </div>
             </div>
           )}
        </div>

        <div className="bg-card border border-border shadow-xl rounded-sm overflow-hidden transition-colors duration-300">
          {/* Table Header */}
          <div className="hidden lg:grid grid-cols-12 gap-8 bg-muted border-b border-border px-10 py-5 transition-colors">
             <div className="col-span-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">{tr("headerDestination")}</div>
             <div className="col-span-3 text-xs font-bold text-muted-foreground uppercase tracking-widest">{tr("headerDetails")}</div>
             <div className="col-span-4 text-xs font-bold text-muted-foreground uppercase tracking-widest text-center">{tr("headerVehicles")}</div>
             <div className="col-span-1 text-right text-xs font-bold text-muted-foreground uppercase tracking-widest">{tr("headerAction")}</div>
          </div>

          <div className="divide-y divide-border">
            {routes.map((route) => {
              const TerrainIcon = getIcon(route.icon);

              return (
                <div key={route.id} className="group hover:bg-muted/50 transition-colors duration-300 px-6 lg:px-10 py-8 grid lg:grid-cols-12 gap-8 items-center">
                  
                  {/* Destination */}
                  <div className="lg:col-span-4 flex items-center gap-6">
                      <div className="w-14 h-14 rounded-full bg-muted group-hover:bg-background flex items-center justify-center transition-colors shrink-0">
                        <TerrainIcon className="w-6 h-6 text-secondary" />
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-foreground tracking-tight mb-1">{route.destination}</h3>
                        <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground tracking-wide">
                            <span>{format.number(route.km)} km</span>
                            <span>•</span>
                            <span>{route.duration}</span>
                        </div>
                      </div>
                  </div>

                  {/* Terrain & Status */}
                  <div className="lg:col-span-3">
                      <div className="flex items-center gap-2 mb-2">
                        <TrafficCone size={14} className="text-secondary shrink-0" />
                        <p className="text-sm font-bold text-foreground/90">{route.insight}</p>
                      </div>
                      {weatherStatus?.condition === "Rain" && route.isMountainous && (
                        <div className="flex items-center gap-2">
                          <CloudRain size={14} className="text-blue-500 shrink-0" />
                          <p className="text-xs font-bold text-blue-500">{tr("suvRecommended")}</p>
                        </div>
                      )}
                  </div>

                  {/* Vehicle Pricing */}
                  <div className="lg:col-span-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                      {vehicles.map((vehicle) => {
                        const VehicleIcon = getIcon(vehicle.icon);
                        return (
                        <div key={vehicle.id} className="text-center p-2 rounded-sm border border-transparent hover:border-border hover:bg-muted transition-colors">
                          <VehicleIcon size={18} className="mx-auto text-muted-foreground mb-1" />
                          <span className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">{vehicle.label}</span>
                          <span className="block text-xs font-black text-foreground">{format.number(route.prices[vehicle.id] ?? 0)}</span>
                        </div>
                        );
                      })}
                  </div>

                  {/* Action */}
                  <div className="lg:col-span-1 flex lg:justify-end">
                      <Link 
                        href={`/book?tab=country&dest=${encodeURIComponent(route.destination)}`}
                        onClick={triggerHaptic}
                        aria-label={tr("bookRoute", { destination: route.destination })}
                        className="h-14 w-full lg:w-14 bg-muted hover:bg-primary rounded-sm flex items-center justify-center text-foreground hover:text-primary-foreground transition-all"
                      >
                        <ArrowRight className="w-5 h-5 hover:translate-x-1 transition-transform" />
                      </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-12 flex justify-center">
            <Link href="/book?tab=country" onClick={triggerHaptic} className="h-14 px-10 bg-foreground text-background hover:bg-primary hover:text-primary-foreground rounded-sm transition-all flex items-center gap-3 shadow-lg">
                <span className="text-sm font-bold uppercase tracking-widest">{tr("seeAll")}</span>
                <ArrowRight size={18} />
            </Link>
        </div>
      </section>

      {/* SERVICE GUARANTEE */}
      <section className="py-24 bg-background border-t border-border transition-colors duration-300 relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('/backgrounds/grid.png')] opacity-5" />
          <div className="max-w-[1600px] mx-auto px-6 md:px-10 grid lg:grid-cols-2 gap-16 items-center relative z-10">
            <div>
               <span className="text-secondary text-xs font-bold uppercase tracking-widest mb-4 block">{t("guarantee.badge")}</span>
               <h2 className="text-4xl md:text-5xl font-black text-foreground mb-10 tracking-tight leading-tight whitespace-pre-line">
                  {t("guarantee.title")}
               </h2>

               <div className="space-y-8">
                  {guarantees.map((item) => {
                    const Icon = getIcon(item.icon);
                    return (
                    <div key={item.id} className="flex gap-5 group">
                       <div className="w-14 h-14 rounded-sm bg-muted border border-border flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:border-primary transition-all">
                          <Icon className="w-6 h-6 text-primary group-hover:text-primary-foreground" />
                       </div>
                       <div className="max-w-md">
                          <h4 className="text-lg font-bold text-foreground mb-1">{item.title}</h4>
                          <p className="text-sm text-muted-foreground leading-relaxed font-medium">{item.description}</p>
                       </div>
                    </div>
                    );
                  })}
               </div>
            </div>

            <div className="bg-secondary p-10 md:p-14 shadow-2xl relative rounded-sm">
               <div className="absolute top-0 right-0 p-8 opacity-10"><Map size={100} className="text-secondary-foreground" /></div>
               <h3 className="text-3xl md:text-4xl font-black text-secondary-foreground mb-4 tracking-tight whitespace-pre-line">{t("guarantee.advisoryTitle")}</h3>
               <p className="text-secondary-foreground/90 text-md mb-8 font-medium leading-relaxed max-w-sm">
                  {t.rich("guarantee.advisoryText", {
                    suv: (chunks) => <strong className="bg-background text-foreground px-2 py-0.5 rounded-sm text-sm mx-1">{chunks}</strong>,
                  })}
               </p>
               <Link href="/book?vehicle=comfort&dest=Akagera" onClick={triggerHaptic} className="h-14 w-full bg-primary rounded-sm text-primary-foreground font-bold uppercase text-sm tracking-widest hover:bg-foreground transition-all flex items-center justify-center gap-3">
                  {t("guarantee.advisoryCta")} <ArrowRight size={18} />
               </Link>
            </div>
          </div>
      </section>

      {/* BACK TO TOP BUTTON */}
      <button
        onClick={scrollToTop}
        className={`fixed bottom-8 right-8 z-50 p-4 bg-primary text-primary-foreground rounded-sm shadow-lg shadow-primary/20 hover:bg-secondary hover:text-secondary-foreground transition-all duration-300 transform ${showScrollTop ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 pointer-events-none'}`}
        aria-label={t("backToTop")}
      >
        <ArrowUp className="w-5 h-5" />
      </button>

      <Footer />
    </main>
  );
}

export default function TransfersPage() {
  const t = useTranslations("Transfers");
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center text-secondary font-bold uppercase tracking-widest text-sm">
        {t("loading")}
      </div>
    }>
      <TransfersContent />
    </Suspense>
  );
}