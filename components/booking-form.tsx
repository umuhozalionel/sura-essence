"use client";

import React, { useState, useEffect, Suspense } from "react";
import dynamic from "next/dynamic";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Clock, Car, Info, ArrowRight, Plane, Map as MapIcon, Calendar, CheckCircle2 } from "lucide-react";

// Load Map Client-Side Only
const MapWidget = dynamic(() => import("@/components/ui/map-widget"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-[#F5F2EA] animate-pulse flex flex-col items-center justify-center text-[#C97C2F]">
      <MapPin className="w-8 h-8 mb-2 opacity-50" />
      <span className="text-xs font-serif tracking-widest uppercase">Locating...</span>
    </div>
  )
});

// --- DATA ---
const COUNTRYSIDE_TRIPS = [
  { id: "musanze", title: "Musanze (Volcanoes)", price: 90000, distance: "96 km", coords: [-1.5033, 29.6326] as [number, number], img: "/fleet/rwanda-chauffeur-hire.jpg" },
  { id: "akagera", title: "Akagera National Park", price: 120000, distance: "110 km", coords: [-1.8833, 30.7167] as [number, number], img: "/fleet/Land-Cruiser-safari-Rwanda.jpg" },
  { id: "huye", title: "Huye (Ethnographic Museum)", price: 80000, distance: "132 km", coords: [-2.6000, 29.7333] as [number, number], img: "/fleet/sedan.jpg" },
  { id: "rusizi", title: "Rusizi (Nyungwe Forest)", price: 120000, distance: "220 km", coords: [-2.4833, 28.9000] as [number, number], img: "/fleet/suv.webp" },
];

export default function BookingForm() {
  const [activeTab, setActiveTab] = useState("city");
  
  // Form State
  const [formData, setFormData] = useState({
    pickup: "",
    dropoff: "",
    serviceType: "airport", 
    hours: "3",
    vehicle: "standard",
    date: "",
    time: ""
  });

  const [selectedTrip, setSelectedTrip] = useState<typeof COUNTRYSIDE_TRIPS[0] | null>(null);
  const [quote, setQuote] = useState(0);

  // Map State
  const [mapCenter, setMapCenter] = useState<[number, number]>([-1.9441, 30.0619]); 
  const [mapZoom, setMapZoom] = useState(12);
  const [markers, setMarkers] = useState<Array<{ pos: [number, number]; label: string }>>([
    { pos: [-1.9441, 30.0619], label: "Kigali" }
  ]);

  // PRICING ENGINE
  useEffect(() => {
    let price = 0;
    const isComfort = formData.vehicle === "comfort";
    const tierMultiplier = isComfort ? 1.3 : 1;

    if (activeTab === "city") {
      if (formData.serviceType === "airport") price = isComfort ? 40000 : 20000;
      else if (formData.serviceType === "city_tour") price = isComfort ? 130000 : 100000; 
      else price = isComfort ? 15000 : 10000; 
    } 
    else if (activeTab === "hourly") {
      const base = isComfort ? 35000 : 25000;
      const extra = isComfort ? 9000 : 7000;
      const h = parseInt(formData.hours) || 3;
      price = base + ((h - 3) * extra);
    }
    else if (activeTab === "country" && selectedTrip) {
      price = selectedTrip.price * (isComfort ? 1.2 : 1);
    }

    setQuote(Math.round(price));
  }, [activeTab, formData.vehicle, formData.hours, formData.serviceType, selectedTrip]);

  // Handlers
  const handleTripSelect = (trip: typeof COUNTRYSIDE_TRIPS[0]) => {
    setSelectedTrip(trip);
    setFormData(prev => ({ ...prev, dropoff: trip.title }));
    setMapCenter(trip.coords);
    setMapZoom(9);
    setMarkers([
      { pos: [-1.9441, 30.0619], label: "Kigali Start" },
      { pos: trip.coords, label: trip.title }
    ]);
  };

  const handleWhatsApp = () => {
    const text = `
🚗 *New SURA Booking Request*
Type: ${activeTab.toUpperCase()}
Service: ${activeTab === 'city' ? formData.serviceType : 'Direct'}
Vehicle: ${formData.vehicle.toUpperCase()}
${activeTab === 'country' ? `Destination: ${selectedTrip?.title} (${selectedTrip?.distance})` : `From: ${formData.pickup || 'TBD'} \nTo: ${formData.dropoff || 'TBD'}`}
Date: ${formData.date} @ ${formData.time}
${activeTab === 'hourly' ? `Duration: ${formData.hours} Hours` : ''}
💰 Est. Price: ${quote.toLocaleString()} RWF
    `.trim();
    window.open(`https://wa.me/250788845062?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <section id="book" className="w-full py-20 px-4 bg-[#F5F2EA]">
      <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-8 h-auto min-h-[750px]">
        
        {/* LEFT: THE SMART FORM */}
        <div className="bg-white rounded-[2rem] shadow-2xl border border-white/20 overflow-hidden flex flex-col h-full ring-1 ring-black/5">
          <div className="p-8 pb-4 border-b border-gray-100">
            <span className="text-[#C97C2F] text-xs font-bold uppercase tracking-widest mb-1 block">Start Your Journey</span>
            <h2 className="text-3xl font-serif text-[#0B1215]">Reserve a Vehicle</h2>
          </div>

          <Tabs defaultValue="city" className="flex-1 flex flex-col" onValueChange={setActiveTab}>
            <div className="px-8 pt-6">
              <TabsList className="grid w-full grid-cols-3 bg-[#F5F2EA] p-1 rounded-full h-12">
                <TabsTrigger value="city" className="rounded-full data-[state=active]:bg-[#0B1215] data-[state=active]:text-white transition-all duration-300">City / Airport</TabsTrigger>
                <TabsTrigger value="hourly" className="rounded-full data-[state=active]:bg-[#0B1215] data-[state=active]:text-white transition-all duration-300">Hourly Hire</TabsTrigger>
                <TabsTrigger value="country" className="rounded-full data-[state=active]:bg-[#0B1215] data-[state=active]:text-white transition-all duration-300">Expeditions</TabsTrigger>
              </TabsList>
            </div>

            {/* SCROLLABLE CONTENT AREA */}
            <div className="p-8 flex-1 overflow-y-auto custom-scrollbar">
              
              {/* TAB 1: CITY / AIRPORT */}
              <TabsContent value="city" className="space-y-6 mt-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: "airport", label: "Airport", icon: Plane },
                    { id: "city_tour", label: "City Tour", icon: MapIcon },
                    { id: "inter_city", label: "A to B", icon: Car },
                  ].map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setFormData({ ...formData, serviceType: s.id })}
                      className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all duration-300 ${
                        formData.serviceType === s.id 
                          ? "border-[#C97C2F] bg-[#C97C2F]/5 text-[#C97C2F]" 
                          : "border-gray-100 hover:border-[#C97C2F]/30 hover:bg-gray-50 text-gray-500"
                      }`}
                    >
                      <s.icon className="w-6 h-6 mb-2" />
                      <span className="text-xs font-bold">{s.label}</span>
                    </button>
                  ))}
                </div>

                <div className="space-y-5">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Pickup Location</Label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-3.5 w-5 h-5 text-[#C97C2F]" />
                      <Input 
                        placeholder={formData.serviceType === 'airport' ? "e.g. Flight WB402 or Kigali Airport" : "Enter pickup address"} 
                        className="pl-12 h-12 bg-[#F9F9F9] border-gray-200 focus:border-[#C97C2F] focus:ring-[#C97C2F]/20 rounded-xl"
                        onChange={(e) => setFormData({...formData, pickup: e.target.value})}
                      />
                    </div>
                  </div>

                  {formData.serviceType !== 'city_tour' && (
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Drop-off Location</Label>
                      <div className="relative">
                        <MapPin className="absolute left-4 top-3.5 w-5 h-5 text-[#C97C2F]" />
                        <Input 
                          placeholder="Enter destination" 
                          className="pl-12 h-12 bg-[#F9F9F9] border-gray-200 focus:border-[#C97C2F] focus:ring-[#C97C2F]/20 rounded-xl"
                          onChange={(e) => setFormData({...formData, dropoff: e.target.value})}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* TAB 2: HOURLY */}
              <TabsContent value="hourly" className="space-y-6 mt-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="p-5 bg-[#F5F2EA] rounded-xl border border-[#C97C2F]/20 flex gap-4">
                  <Info className="w-5 h-5 text-[#C97C2F] shrink-0 mt-1" />
                  <p className="text-sm text-[#0B1215]/80 leading-relaxed font-medium">
                    <strong className="text-[#0B1215]">Flexible Chauffeur:</strong> The driver stays with you for meetings, shopping, or events. Fuel included within Kigali.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Pickup Location</Label>
                  <Input 
                    placeholder="Where do we start?" 
                    className="h-12 bg-[#F9F9F9] border-gray-200 focus:border-[#C97C2F] rounded-xl" 
                    onChange={(e) => setFormData({...formData, pickup: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                   <Label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Duration</Label>
                   <Select onValueChange={(v) => setFormData({...formData, hours: v})} defaultValue="3">
                    <SelectTrigger className="h-12 bg-[#F9F9F9] border-gray-200 focus:border-[#C97C2F] rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[3,4,5,6,8,10,12].map(h => (
                        <SelectItem key={h} value={h.toString()}>{h} Hours {h===3 && "(Min)"}</SelectItem>
                      ))}
                    </SelectContent>
                   </Select>
                </div>
              </TabsContent>

              {/* TAB 3: COUNTRYSIDE */}
              <TabsContent value="country" className="space-y-4 mt-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
                {COUNTRYSIDE_TRIPS.map((trip) => (
                  <button 
                    key={trip.id}
                    onClick={() => handleTripSelect(trip)}
                    className={`w-full flex items-center gap-4 p-3 rounded-xl border transition-all text-left group relative overflow-hidden
                      ${selectedTrip?.id === trip.id 
                        ? "border-[#C97C2F] bg-[#C97C2F]/5" 
                        : "border-gray-100 hover:border-[#C97C2F]/30 hover:bg-gray-50"}`}
                  >
                    <div className="w-16 h-16 rounded-lg bg-gray-200 shrink-0 overflow-hidden relative shadow-md">
                       <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('${trip.img}')`}} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-serif font-bold text-[#0B1215] text-lg truncate">{trip.title}</span>
                        <span className="text-sm font-bold text-[#C97C2F] shrink-0">{trip.price.toLocaleString()} RWF</span>
                      </div>
                      <div className="flex items-center text-[10px] gap-3 text-gray-500">
                         <span className="flex items-center gap-1"><MapPin size={10} /> {trip.distance}</span>
                         <span className="bg-[#0B1215] text-white px-2 py-0.5 rounded-full uppercase tracking-wider">Premium 4x4</span>
                      </div>
                    </div>
                    {selectedTrip?.id === trip.id && <CheckCircle2 className="w-5 h-5 text-[#C97C2F] absolute top-3 right-3" />}
                  </button>
                ))}
              </TabsContent>

              {/* SHARED FIELDS (Visible in ALL Tabs) */}
              <div className="grid grid-cols-2 gap-4 mt-8 pt-8 border-t border-gray-100">
                 <div className="space-y-2">
                    <Label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Date & Time</Label>
                    <div className="flex gap-2">
                       <div className="relative flex-1">
                          <Calendar className="absolute left-2 top-2.5 w-4 h-4 text-gray-400" />
                          <Input type="date" className="bg-[#F9F9F9] text-xs pl-8 h-10 rounded-lg" onChange={(e) => setFormData({...formData, date: e.target.value})} />
                       </div>
                       <div className="relative flex-1">
                          <Clock className="absolute left-2 top-2.5 w-4 h-4 text-gray-400" />
                          <Input type="time" className="bg-[#F9F9F9] text-xs pl-8 h-10 rounded-lg" onChange={(e) => setFormData({...formData, time: e.target.value})} />
                       </div>
                    </div>
                 </div>
                 <div className="space-y-2">
                    <Label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Vehicle Class</Label>
                    <Select onValueChange={(v) => setFormData({...formData, vehicle: v})} defaultValue="standard">
                      <SelectTrigger className="bg-[#F9F9F9] border-gray-200 text-xs h-10 rounded-lg"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="standard">Standard (Sedan)</SelectItem>
                        <SelectItem value="comfort">Comfort (SUV/Van)</SelectItem>
                      </SelectContent>
                    </Select>
                 </div>
              </div>
            </div>

            {/* FORM FOOTER (Fixed at Bottom of Card) */}
            <div className="p-8 border-t border-gray-100 bg-[#F9F9F9] mt-auto relative z-20">
              <div className="flex justify-between items-end mb-6">
                <span className="text-sm text-gray-500 font-medium pb-1">Estimated Total</span>
                <div className="text-right">
                  <span className="text-3xl font-serif font-bold text-[#0B1215] block leading-none">{quote.toLocaleString()}</span>
                  <span className="text-[10px] text-[#C97C2F] font-bold uppercase tracking-widest">RWF / All Inclusive</span>
                </div>
              </div>
              <Button 
                onClick={handleWhatsApp}
                className="w-full rounded-full h-14 text-lg font-bold shadow-lg shadow-[#C97C2F]/20 hover:shadow-[#C97C2F]/40 transition-all hover:-translate-y-1 bg-[#C97C2F] hover:bg-[#b06a25] text-white"
              >
                Book via WhatsApp <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </div>
          </Tabs>
        </div>

        {/* RIGHT: MAP WIDGET */}
        <div className="hidden lg:block h-full min-h-[500px] rounded-[2rem] overflow-hidden shadow-2xl border border-white/20 relative bg-white ring-1 ring-black/5">
          <Suspense fallback={<div className="w-full h-full bg-[#F5F2EA] animate-pulse" />}>
            <MapWidget center={mapCenter} zoom={mapZoom} markers={markers} />
          </Suspense>
          
          {/* Dynamic Map Overlay Info */}
          <div className="absolute top-6 right-6 bg-white/95 backdrop-blur-md p-4 rounded-xl shadow-xl border border-gray-100 z-[400] max-w-[240px] animate-in slide-in-from-top-4">
             <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-[#C97C2F]/10 flex items-center justify-center">
                   <MapPin className="w-5 h-5 text-[#C97C2F]" />
                </div>
                <div>
                   <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Destination</p>
                   <p className="text-sm font-bold truncate w-32 font-serif text-[#0B1215]">
                      {activeTab === 'country' && selectedTrip ? selectedTrip.title : (formData.dropoff || "Kigali Area")}
                   </p>
                </div>
             </div>
             {activeTab === 'country' && selectedTrip && (
               <div className="pt-2 mt-2 border-t border-gray-100 flex justify-between text-xs">
                 <span className="text-gray-500">Distance</span>
                 <span className="font-bold text-[#0B1215]">{selectedTrip.distance}</span>
               </div>
             )}
          </div>
        </div>

      </div>
    </section>
  );
}