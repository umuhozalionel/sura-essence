"use client";

import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Clock, Car, ArrowRight, Plane, Map as MapIcon, Navigation, Loader2, Calendar } from "lucide-react";

// --- SQUARE INPUT COMPONENT (Clean Style) ---
function OSMInput({ label, onSelect, icon: Icon }: { label: string, onSelect: (coords: [number, number], name: string) => void, icon: any }) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (query.length < 3) return;
      setLoading(true);
      try {
        const res = await fetch(`https://photon.komoot.io/api/?q=${query}&lat=-1.9441&lon=30.0619&limit=5`);
        const data = await res.json();
        const results = data.features.map((f: any) => ({
            display_name: `${f.properties.name}, ${f.properties.city || f.properties.country || ''}`,
            lat: f.geometry.coordinates[1],
            lon: f.geometry.coordinates[0]
        }));
        setSuggestions(results);
        setShowDropdown(true);
      } catch (e) { console.error("Search Error:", e); }
      setLoading(false);
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  return (
    <div className="space-y-2 relative">
      <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</Label>
      <div className="relative group">
        <div className="absolute left-0 top-0 bottom-0 w-12 flex items-center justify-center bg-gray-50 border-r border-gray-100 z-10">
           <Icon className="w-4 h-4 text-[#C97C2F]" />
        </div>
        <Input 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length > 2 && setShowDropdown(true)}
          placeholder={`Search ${label}...`} 
          className="pl-16 h-14 bg-white border border-gray-200 rounded-none text-xs font-bold text-[#111827] uppercase tracking-wider focus:ring-0 focus:border-[#C97C2F] focus:border-l-4 transition-all placeholder:text-gray-300" 
        />
        {loading && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#C97C2F] animate-spin" />}
      </div>
      
      {showDropdown && suggestions.length > 0 && (
        <ul className="absolute z-50 w-full bg-white border border-gray-100 shadow-xl mt-0 max-h-60 overflow-y-auto">
          {suggestions.map((s, i) => (
            <li key={i} onClick={() => { setQuery(s.display_name.split(",")[0]); onSelect([s.lat, s.lon], s.display_name); setShowDropdown(false); }}
              className="p-4 hover:bg-[#F5F2EA] cursor-pointer text-xs font-bold uppercase tracking-wider border-b border-gray-50 last:border-0 transition-colors text-gray-600 hover:text-[#C97C2F]"
            >
              {s.display_name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const COUNTRYSIDE_TRIPS = [
  { id: "musanze", title: "Musanze (Volcanoes)", price: 90000, distance: "96 km", coords: [-1.5033, 29.6326] as [number, number] },
  { id: "akagera", title: "Akagera National Park", price: 120000, distance: "110 km", coords: [-1.8833, 30.7167] as [number, number] },
  { id: "huye", title: "Huye (Museum)", price: 80000, distance: "132 km", coords: [-2.6000, 29.7333] as [number, number] },
];

interface BookingFormProps {
  onRouteUpdate: (type: 'pickup' | 'dropoff', coords: [number, number]) => void;
}

export default function BookingForm({ onRouteUpdate }: BookingFormProps) {
  const [activeTab, setActiveTab] = useState("city");
  const [quote, setQuote] = useState(0);
  const [formData, setFormData] = useState({ pickup: "", dropoff: "", serviceType: "airport", hours: "3", vehicle: "standard", date: "", time: "" });
  
  useEffect(() => {
    let price = 0;
    const isComfort = formData.vehicle === "comfort";
    if (activeTab === "city") {
      if (formData.serviceType === "airport") price = isComfort ? 40000 : 20000;
      else if (formData.serviceType === "city_tour") price = isComfort ? 130000 : 100000; 
      else price = isComfort ? 15000 : 10000; 
    } else if (activeTab === "hourly") {
      const base = isComfort ? 35000 : 25000;
      const extra = isComfort ? 9000 : 7000;
      const h = parseInt(formData.hours) || 3;
      price = base + ((h - 3) * extra);
    }
    setQuote(Math.round(price));
  }, [activeTab, formData.vehicle, formData.hours, formData.serviceType]);

  const handleLocationSelect = (type: 'pickup' | 'dropoff', coords: [number, number], name: string) => {
    setFormData(prev => ({ ...prev, [type]: name }));
    onRouteUpdate(type, coords);
  };

  const handleWhatsApp = () => {
    const text = `🚗 *Booking Request*\nType: ${activeTab.toUpperCase()}\nFrom: ${formData.pickup}\nTo: ${formData.dropoff}\nPrice: ${quote.toLocaleString()} RWF`.trim();
    window.open(`https://wa.me/250788845062?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <div className="flex flex-col h-full w-full bg-white">
      <div className="p-10 pb-6 border-b border-gray-100">
        <span className="text-[#C97C2F] text-[10px] font-black uppercase tracking-[0.3em] mb-2 block">Start Your Journey</span>
        <h2 className="text-4xl font-black text-[#111827] uppercase tracking-tighter">Reserve Vehicle</h2>
      </div>

      <Tabs defaultValue="city" className="flex-1 flex flex-col" onValueChange={setActiveTab}>
        <div className="px-10 pt-8">
          <TabsList className="grid w-full grid-cols-3 bg-gray-50 p-1 rounded-none">
            <TabsTrigger value="city" className="rounded-none h-10 text-[10px] font-black uppercase tracking-widest text-gray-400 data-[state=active]:bg-white data-[state=active]:text-[#C97C2F] data-[state=active]:shadow-sm transition-all">City</TabsTrigger>
            <TabsTrigger value="hourly" className="rounded-none h-10 text-[10px] font-black uppercase tracking-widest text-gray-400 data-[state=active]:bg-white data-[state=active]:text-[#C97C2F] data-[state=active]:shadow-sm transition-all">Hourly</TabsTrigger>
            <TabsTrigger value="country" className="rounded-none h-10 text-[10px] font-black uppercase tracking-widest text-gray-400 data-[state=active]:bg-white data-[state=active]:text-[#C97C2F] data-[state=active]:shadow-sm transition-all">Trips</TabsTrigger>
          </TabsList>
        </div>

        <div className="p-10 flex-1 space-y-8 overflow-y-auto custom-scrollbar">
          
          <TabsContent value="city" className="space-y-6 mt-0">
             <div className="grid grid-cols-3 gap-4">
              {[ { id: "airport", label: "Airport", icon: Plane }, { id: "city_tour", label: "Tour", icon: MapIcon }, { id: "inter_city", label: "A to B", icon: Car } ].map((s) => (
                <button key={s.id} onClick={() => setFormData({ ...formData, serviceType: s.id })} className={`flex flex-col items-center justify-center p-4 border transition-all duration-200 rounded-none ${formData.serviceType === s.id ? "border-[#C97C2F] bg-[#C97C2F]/5 text-[#C97C2F]" : "border-gray-100 text-gray-400 hover:border-gray-300 hover:text-gray-600"}`}><s.icon className="w-5 h-5 mb-2" /><span className="text-[10px] font-black uppercase tracking-widest">{s.label}</span></button>
              ))}
            </div>
             <OSMInput label="Pickup" icon={MapPin} onSelect={(c, n) => handleLocationSelect('pickup', c, n)} />
             {formData.serviceType !== 'city_tour' && <OSMInput label="Destination" icon={Navigation} onSelect={(c, n) => handleLocationSelect('dropoff', c, n)} />}
          </TabsContent>

          <TabsContent value="hourly" className="space-y-6 mt-0">
             <OSMInput label="Start Point" icon={MapPin} onSelect={(c, n) => handleLocationSelect('pickup', c, n)} />
             <div className="space-y-2">
               <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Duration</Label>
               <Select onValueChange={(v) => setFormData({...formData, hours: v})} defaultValue="3"><SelectTrigger className="h-14 bg-white border border-gray-200 rounded-none text-xs font-bold uppercase focus:border-[#C97C2F]"><SelectValue /></SelectTrigger><SelectContent className="rounded-none border border-gray-100">{[3,4,5,6,8,10,12].map(h => <SelectItem key={h} value={h.toString()} className="uppercase font-bold text-xs">{h} Hours</SelectItem>)}</SelectContent></Select>
             </div>
          </TabsContent>

          <TabsContent value="country" className="space-y-4 mt-0">
            {COUNTRYSIDE_TRIPS.map(trip => (
                <button key={trip.id} onClick={() => { handleLocationSelect('dropoff', trip.coords, trip.title); }} className="w-full flex items-center justify-between p-4 border border-gray-100 hover:border-[#C97C2F] text-left transition-all group hover:bg-[#F5F2EA] rounded-none">
                    <span className="font-bold text-[#111827] uppercase tracking-wider group-hover:text-[#C97C2F]">{trip.title}</span>
                    <span className="text-xs font-black text-[#C97C2F]">{trip.price.toLocaleString()} RWF</span>
                </button>
            ))}
          </TabsContent>

          <div className="grid grid-cols-2 gap-4 pt-6 border-t border-gray-100">
             <div className="space-y-2"><Label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Date</Label><div className="relative"><div className="absolute left-0 top-0 bottom-0 w-10 bg-gray-50 flex items-center justify-center border-r border-gray-200 z-10"><Calendar className="w-4 h-4 text-[#C97C2F]"/></div><Input type="date" className="pl-12 h-12 bg-white border border-gray-200 rounded-none text-xs font-bold uppercase focus:border-[#C97C2F]" onChange={(e) => setFormData({...formData, date: e.target.value})} /></div></div>
             <div className="space-y-2"><Label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Time</Label><div className="relative"><div className="absolute left-0 top-0 bottom-0 w-10 bg-gray-50 flex items-center justify-center border-r border-gray-200 z-10"><Clock className="w-4 h-4 text-[#C97C2F]"/></div><Input type="time" className="pl-12 h-12 bg-white border border-gray-200 rounded-none text-xs font-bold uppercase focus:border-[#C97C2F]" onChange={(e) => setFormData({...formData, time: e.target.value})} /></div></div>
          </div>
        </div>

        <div className="p-10 border-t border-gray-100 bg-[#F9F9F9]">
           <div className="flex justify-between items-end mb-4">
             <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Estimate</span>
             <span className="text-3xl font-black text-[#111827] tracking-tighter">{quote.toLocaleString()} <span className="text-sm text-[#C97C2F]">RWF</span></span>
           </div>
           <Button onClick={handleWhatsApp} className="w-full h-14 bg-[#111827] hover:bg-[#C97C2F] text-white font-black uppercase tracking-widest text-xs rounded-none shadow-lg transition-all">
             Confirm & Book <ArrowRight className="ml-3 w-4 h-4" />
           </Button>
        </div>
      </Tabs>
    </div>
  );
}