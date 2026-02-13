"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  MapPin, 
  Clock, 
  Car, 
  ArrowRight, 
  Plane, 
  Map as MapIcon, 
  Navigation, 
  Loader2, 
  Calendar, 
  Crosshair,
  Users,
  CheckCircle2,
  Search
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const RWANDA_SITES = [
  { id: "volcanoes", title: "Volcanoes National Park", region: "Musanze", price: 90000, coords: [-1.4748, 29.4831] },
  { id: "akagera", title: "Akagera National Park", region: "Eastern", price: 120000, coords: [-1.8833, 30.7167] },
  { id: "nyungwe", title: "Nyungwe Forest (Canopy)", region: "Southern", price: 150000, coords: [-2.4639, 29.2031] },
  { id: "rubavu", title: "Lake Kivu (Rubavu)", region: "Western", price: 110000, coords: [-1.6853, 29.4101] },
  { id: "karongi", title: "Lake Kivu (Karongi)", region: "Western", price: 100000, coords: [-2.1583, 29.3400] },
  { id: "huye", title: "Ethnographic Museum", region: "Huye", price: 80000, coords: [-2.6000, 29.7333] },
];

const VEHICLES = [
  { id: "sedan", name: "Standard (Sedan)", capacity: "4 Seats", comfort: "Essential", multiplier: 1 },
  { id: "suv", name: "Executive (SUV)", capacity: "7 Seats", comfort: "Premium", multiplier: 2 },
  { id: "van", name: "Group (Van)", capacity: "10 Seats", comfort: "Standard", multiplier: 2.5 },
  { id: "bus", name: "Coach (Bus)", capacity: "20+ Seats", comfort: "Group Protocol", multiplier: 5 },
];

function OSMInput({ label, onSelect, icon: Icon }: { label: string, onSelect: (coords: [number, number], name: string) => void, icon: any }) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const handleGPS = () => {
    if (!navigator.geolocation) return alert("Geolocation not supported.");
    setLoading(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const res = await fetch(`https://photon.komoot.io/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`);
        const data = await res.json();
        const f = data.features[0];
        const name = `${f.properties.name || 'Current Location'}, ${f.properties.city || ''}`;
        setQuery(name);
        onSelect([pos.coords.latitude, pos.coords.longitude], name);
      } catch (e) { console.error(e); }
      setLoading(false);
    }, () => setLoading(false));
  };

  useEffect(() => {
    const delay = setTimeout(async () => {
      if (query.length < 3) return;
      setLoading(true);
      try {
        const res = await fetch(`https://photon.komoot.io/api/?q=${query}&lat=-1.9441&lon=30.0619&limit=5`);
        const data = await res.json();
        const results = data.features.map((f: any) => ({
            display_name: `${f.properties.name}, ${f.properties.city || ''}`,
            lat: f.geometry.coordinates[1],
            lon: f.geometry.coordinates[0]
        }));
        setSuggestions(results);
        setShowDropdown(true);
      } catch (e) { console.error(e); }
      setLoading(false);
    }, 500);
    return () => clearTimeout(delay);
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
          className={`pl-16 h-14 bg-white border border-gray-200 rounded-none text-xs font-bold text-[#111827] uppercase tracking-wider focus:ring-0 focus:border-[#C97C2F] focus:border-l-4 transition-all ${label === "Pickup" ? "pr-12" : "pr-4"}`} 
          placeholder={`Search ${label}...`}
        />
        {label === "Pickup" && (
          <button onClick={handleGPS} className="absolute right-0 top-0 bottom-0 w-12 flex items-center justify-center hover:bg-gray-50 z-20">
             {loading ? <Loader2 className="w-4 h-4 animate-spin text-[#C97C2F]" /> : <Crosshair className="w-4 h-4 text-gray-400" />}
          </button>
        )}
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

interface BookingFormProps {
  onRouteUpdate: (type: 'pickup' | 'dropoff', coords: [number, number]) => void;
}

export default function BookingForm({ onRouteUpdate }: BookingFormProps) {
  const [activeTab, setActiveTab] = useState("city");
  const [quote, setQuote] = useState(20000);
  const [formData, setFormData] = useState({ 
    pickup: "", 
    dropoff: "", 
    serviceType: "airport", 
    hours: "3", 
    vehicleId: "sedan", 
    date: "", 
    time: "", 
    selectedTripId: "" 
  });
  
  const [tripSearch, setTripSearch] = useState("");
  const [showTripDropdown, setShowTripDropdown] = useState(false);

  const selectedVehicle = useMemo(() => 
    VEHICLES.find(v => v.id === formData.vehicleId) || VEHICLES[0], 
    [formData.vehicleId]
  );
  
  const filteredTrips = useMemo(() => 
    RWANDA_SITES.filter(s => s.title.toLowerCase().includes(tripSearch.toLowerCase())), 
    [tripSearch]
  );

  useEffect(() => {
    let base = 0;
    if (activeTab === "city") {
      base = formData.serviceType === "airport" ? 20000 : formData.serviceType === "city_tour" ? 100000 : 10000;
    } else if (activeTab === "hourly") {
      base = 25000 + ((parseInt(formData.hours) - 3) * 7000);
    } else if (activeTab === "country") {
      const trip = RWANDA_SITES.find(s => s.id === formData.selectedTripId);
      base = trip ? trip.price : 0;
    }
    setQuote(base * selectedVehicle.multiplier);
  }, [activeTab, formData.vehicleId, formData.hours, formData.serviceType, formData.selectedTripId, selectedVehicle]);

  const handleWhatsApp = () => {
    const text = `🚗 SURA Booking Request\nVehicle: ${selectedVehicle.name}\nPickup: ${formData.pickup}\nTotal: ${quote.toLocaleString()} RWF`.trim();
    window.open(`https://wa.me/250788845062?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <div className="flex flex-col h-full w-full bg-white">
      <Tabs defaultValue="city" className="flex-1 flex flex-col" onValueChange={setActiveTab}>
        <div className="px-10 pt-8">
          <TabsList className="grid w-full grid-cols-3 bg-gray-50 p-1 rounded-none">
            <TabsTrigger value="city" className="rounded-none h-10 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-[#C97C2F]">City</TabsTrigger>
            <TabsTrigger value="hourly" className="rounded-none h-10 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-[#C97C2F]">Hourly</TabsTrigger>
            <TabsTrigger value="country" className="rounded-none h-10 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-[#C97C2F]">Trips</TabsTrigger>
          </TabsList>
        </div>

        <div className="p-10 flex-1 space-y-8 overflow-y-auto custom-scrollbar">
          <div className="space-y-3">
             <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Select Fleet Type</Label>
             <div className="grid grid-cols-2 gap-3">
                {VEHICLES.map((v) => (
                   <button 
                      key={v.id} 
                      onClick={() => setFormData({...formData, vehicleId: v.id})} 
                      className={`p-4 border text-left transition-all ${formData.vehicleId === v.id ? 'border-[#C97C2F] bg-[#C97C2F]/5' : 'border-gray-100 hover:border-gray-300'}`}
                   >
                      <div className="flex justify-between items-start mb-2">
                        <span className={`text-[10px] font-black uppercase tracking-widest ${formData.vehicleId === v.id ? 'text-[#C97C2F]' : 'text-gray-400'}`}>
                          {v.name}
                        </span>
                        {formData.vehicleId === v.id && <CheckCircle2 className="w-3.5 h-3.5 text-[#C97C2F]" />}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-bold text-[#111827] mb-1">
                        <Users className="w-3 h-3" /> {v.capacity}
                      </div>
                      <p className="text-[9px] text-gray-400 font-medium leading-tight">Comfort: {v.comfort}</p>
                   </button>
                ))}
             </div>
          </div>

          <TabsContent value="city" className="space-y-6 mt-0">
             <div className="grid grid-cols-3 gap-4">
              {[ { id: "airport", label: "Airport", icon: Plane }, { id: "city_tour", label: "Tour", icon: MapIcon }, { id: "inter_city", label: "A to B", icon: Car } ].map((s) => (
                <button 
                  key={s.id} 
                  onClick={() => setFormData({ ...formData, serviceType: s.id })} 
                  className={`flex flex-col items-center justify-center p-4 border rounded-none ${formData.serviceType === s.id ? "border-[#C97C2F] bg-[#C97C2F]/5 text-[#C97C2F]" : "border-gray-100 text-gray-400"}`}
                >
                  <s.icon className="w-5 h-5 mb-2" />
                  <span className="text-[10px] font-black uppercase tracking-widest">{s.label}</span>
                </button>
              ))}
            </div>
             <OSMInput label="Pickup" icon={MapPin} onSelect={(c, n) => { setFormData({...formData, pickup: n}); onRouteUpdate('pickup', c); }} />
             {formData.serviceType !== 'city_tour' && (
               <OSMInput label="Destination" icon={Navigation} onSelect={(c, n) => { setFormData({...formData, dropoff: n}); onRouteUpdate('dropoff', c); }} />
             )}
          </TabsContent>

          <TabsContent value="hourly" className="space-y-6 mt-0">
             <OSMInput label="Pickup" icon={MapPin} onSelect={(c, n) => { setFormData({...formData, pickup: n}); onRouteUpdate('pickup', c); }} />
             <div className="space-y-2">
               <Label className="text-[10px] font-bold text-gray-400 uppercase">Duration</Label>
               <Select onValueChange={(v) => setFormData({...formData, hours: v})} defaultValue="3">
                 <SelectTrigger className="h-14 bg-white border border-gray-200 rounded-none text-xs font-bold uppercase">
                   <SelectValue />
                 </SelectTrigger>
                 <SelectContent className="rounded-none border border-gray-100">
                   {[3,4,5,6,8,10,12].map(h => (
                     <SelectItem key={h} value={h.toString()} className="uppercase font-bold text-xs">{h} Hours</SelectItem>
                   ))}
                 </SelectContent>
               </Select>
             </div>
          </TabsContent>

          <TabsContent value="country" className="space-y-6 mt-0">
             <OSMInput label="Pickup" icon={MapPin} onSelect={(c, n) => { setFormData({...formData, pickup: n}); onRouteUpdate('pickup', c); }} />
             <div className="space-y-2 relative">
                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Destination</Label>
                <div className="relative">
                   <div className="absolute left-0 top-0 bottom-0 w-12 flex items-center justify-center bg-gray-50 border-r border-gray-100 z-10">
                     <Search className="w-4 h-4 text-[#C97C2F]" />
                   </div>
                   <Input 
                      value={tripSearch} 
                      onChange={(e) => setTripSearch(e.target.value)} 
                      onFocus={() => setShowTripDropdown(true)} 
                      className="pl-16 h-14 bg-white border border-gray-200 rounded-none text-xs font-bold text-[#111827] uppercase tracking-wider focus:ring-0 focus:border-[#C97C2F]" 
                      placeholder="SEARCH RWANDA SITES..." 
                   />
                </div>
                <AnimatePresence>
                   {showTripDropdown && (
                      <motion.ul 
                        initial={{ opacity: 0, y: -10 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        exit={{ opacity: 0, y: -10 }} 
                        className="absolute z-50 w-full bg-white border border-gray-100 shadow-xl mt-0 max-h-60 overflow-y-auto"
                      >
                         {filteredTrips.map((s) => (
                            <li 
                              key={s.id} 
                              onClick={() => { 
                                setTripSearch(s.title); 
                                setFormData({...formData, selectedTripId: s.id}); 
                                onRouteUpdate('dropoff', [s.coords[0], s.coords[1]]); 
                                setShowTripDropdown(false); 
                              }} 
                              className="p-4 hover:bg-[#F5F2EA] cursor-pointer border-b border-gray-50 last:border-0"
                            >
                               <div className="flex justify-between items-center">
                                 <div>
                                   <p className="text-xs font-bold uppercase text-[#111827]">{s.title}</p>
                                   <p className="text-[9px] font-bold text-[#C97C2F] uppercase">{s.region}</p>
                                 </div>
                                 <ArrowRight className="w-3.5 h-3.5 text-gray-300" />
                               </div>
                            </li>
                         ))}
                      </motion.ul>
                   )}
                </AnimatePresence>
             </div>
          </TabsContent>

          <div className="grid grid-cols-2 gap-4 pt-6 border-t border-gray-100">
             <div className="space-y-2">
               <Label className="text-[10px] font-bold text-gray-400 uppercase">Date</Label>
               <div className="relative">
                 <div className="absolute left-0 top-0 bottom-0 w-10 bg-gray-50 flex items-center justify-center border-r border-gray-200 z-10">
                   <Calendar className="w-4 h-4 text-[#C97C2F]"/>
                 </div>
                 <Input type="date" className="pl-12 h-12 border border-gray-200 rounded-none text-xs font-bold uppercase" onChange={(e) => setFormData({...formData, date: e.target.value})} />
               </div>
             </div>
             <div className="space-y-2">
               <Label className="text-[10px] font-bold text-gray-400 uppercase">Time</Label>
               <div className="relative">
                 <div className="absolute left-0 top-0 bottom-0 w-10 bg-gray-50 flex items-center justify-center border-r border-gray-200 z-10">
                   <Clock className="w-4 h-4 text-[#C97C2F]"/>
                 </div>
                 <Input type="time" className="pl-12 h-12 border border-gray-200 rounded-none text-xs font-bold uppercase" onChange={(e) => setFormData({...formData, time: e.target.value})} />
               </div>
             </div>
          </div>
        </div>

        <div className="p-10 border-t border-gray-100 bg-[#F9F9F9]">
           <div className="flex justify-between items-end mb-4">
             <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Estimate</span>
             <span className="text-3xl font-black text-[#111827] tracking-tighter">
               {quote.toLocaleString()} <span className="text-sm text-[#C97C2F]">RWF</span>
             </span>
           </div>
           <Button onClick={handleWhatsApp} className="w-full h-14 bg-[#111827] hover:bg-[#C97C2F] text-white font-black uppercase tracking-widest text-xs rounded-none shadow-lg">
             Confirm & Book <ArrowRight className="ml-3 w-4 h-4" />
           </Button>
        </div>
      </Tabs>
    </div>
  );
}