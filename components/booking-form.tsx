"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Search,
  Phone,
  User,
  Repeat2,
  Hash,
  MessageSquare,
  Briefcase,
  Plus,
  Minus,
  ChevronDown,
  ChevronUp,
  Hotel,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/* ─────────────────────────────────────────────
   DATA
───────────────────────────────────────────── */
const RWANDA_SITES = [
  { id: "volcanoes",  title: "Volcanoes National Park",    region: "Musanze",  price: 90000,  coords: [-1.4748, 29.4831] as [number, number] },
  { id: "akagera",   title: "Akagera National Park",       region: "Eastern",  price: 120000, coords: [-1.8833, 30.7167] as [number, number] },
  { id: "nyungwe",   title: "Nyungwe Forest (Canopy)",     region: "Southern", price: 150000, coords: [-2.4639, 29.2031] as [number, number] },
  { id: "rubavu",    title: "Lake Kivu (Rubavu)",          region: "Western",  price: 110000, coords: [-1.6853, 29.4101] as [number, number] },
  { id: "karongi",   title: "Lake Kivu (Karongi)",         region: "Western",  price: 100000, coords: [-2.1583, 29.3400] as [number, number] },
  { id: "huye",      title: "Ethnographic Museum",         region: "Huye",     price: 80000,  coords: [-2.6000, 29.7333] as [number, number] },
  { id: "kigali",    title: "Kigali City Tour",            region: "Kigali",   price: 60000,  coords: [-1.9441, 30.0619] as [number, number] },
  { id: "musanze",   title: "Musanze Caves",               region: "Musanze",  price: 75000,  coords: [-1.4990, 29.6340] as [number, number] },
  { id: "bisate",    title: "Bisate Village",              region: "Musanze",  price: 95000,  coords: [-1.5203, 29.5031] as [number, number] },
  { id: "gishwati",  title: "Gishwati-Mukura Forest",      region: "Western",  price: 130000, coords: [-1.8333, 29.3833] as [number, number] },
];

const VEHICLES = [
  { id: "sedan", name: "Standard (Sedan)",   capacity: "4 Seats",   comfort: "Essential", multiplier: 1   },
  { id: "suv",   name: "Executive (SUV)",    capacity: "7 Seats",   comfort: "Premium",   multiplier: 2   },
  { id: "van",   name: "Group (Van)",        capacity: "10 Seats",  comfort: "Standard",  multiplier: 2.5 },
  { id: "bus",   name: "Coach (Bus)",        capacity: "20+ Seats", comfort: "Group",     multiplier: 5   },
];

const LUGGAGE_OPTIONS = [
  { id: "none",   label: "No Luggage",     icon: "—"  },
  { id: "carry",  label: "Carry-On Only",  icon: "🎒" },
  { id: "medium", label: "1–2 Suitcases",  icon: "🧳" },
  { id: "heavy",  label: "3+ / Heavy",     icon: "🏋️" },
];

const SCENIC_BG = "/scenic/aerial-view.jpg";

/* ─────────────────────────────────────────────
   OSM SEARCH INPUT
───────────────────────────────────────────── */
function OSMInput({
  label,
  onSelect,
  icon: Icon,
  showGPS = false,
}: {
  label: string;
  onSelect: (coords: [number, number], name: string) => void;
  icon: React.ElementType;
  showGPS?: boolean;
}) {
  const [query, setQuery]           = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading]       = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const handleGPS = () => {
    if (!navigator.geolocation) return alert("Geolocation not supported.");
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res  = await fetch(`https://photon.komoot.io/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`);
          const data = await res.json();
          const f    = data.features[0];
          const name = `${f.properties.name || "Current Location"}, ${f.properties.city || ""}`;
          setQuery(name);
          onSelect([pos.coords.latitude, pos.coords.longitude], name);
        } catch (e) { console.error(e); }
        setLoading(false);
      },
      () => setLoading(false)
    );
  };

  useEffect(() => {
    const delay = setTimeout(async () => {
      if (query.length < 3) { setSuggestions([]); return; }
      setLoading(true);
      try {
        const res  = await fetch(`https://photon.komoot.io/api/?q=${query}&lat=-1.9441&lon=30.0619&limit=5`);
        const data = await res.json();
        setSuggestions(
          data.features.map((f: any) => ({
            display_name: `${f.properties.name}, ${f.properties.city || ""}`,
            lat: f.geometry.coordinates[1],
            lon: f.geometry.coordinates[0],
          }))
        );
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
          onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
          className={`pl-16 h-14 bg-white border border-gray-200 rounded-none text-xs font-bold text-[#111827] uppercase tracking-wider focus:ring-0 focus:border-[#C97C2F] focus:border-l-4 transition-all ${showGPS ? "pr-12" : "pr-4"}`}
          placeholder={`Search ${label}...`}
        />
        {showGPS && (
          <button
            type="button"
            onClick={handleGPS}
            className="absolute right-0 top-0 bottom-0 w-12 flex items-center justify-center hover:bg-gray-50 z-20"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin text-[#C97C2F]" />
            ) : (
              <Crosshair className="w-4 h-4 text-gray-400" />
            )}
          </button>
        )}
      </div>
      <AnimatePresence>
        {showDropdown && suggestions.length > 0 && (
          <motion.ul
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="absolute z-50 w-full bg-white border border-gray-100 shadow-xl mt-0 max-h-52 overflow-y-auto"
          >
            {suggestions.map((s, i) => (
              <li
                key={i}
                onMouseDown={() => {
                  setQuery(s.display_name.split(",")[0]);
                  onSelect([s.lat, s.lon], s.display_name);
                  setShowDropdown(false);
                }}
                className="p-4 hover:bg-[#F5F2EA] cursor-pointer text-xs font-bold uppercase tracking-wider border-b border-gray-50 last:border-0 transition-colors text-gray-600 hover:text-[#C97C2F]"
              >
                {s.display_name}
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─────────────────────────────────────────────
   STEPPER
───────────────────────────────────────────── */
function Stepper({
  label,
  value,
  min = 1,
  max = 20,
  onChange,
}: {
  label: string;
  value: number;
  min?: number;
  max?: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</Label>
      <div className="flex items-center h-14 border border-gray-200 bg-white">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          className="w-14 h-full flex items-center justify-center border-r border-gray-100 hover:bg-gray-50 text-gray-400 hover:text-[#C97C2F] transition-colors"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <span className="flex-1 text-center text-sm font-black text-[#111827] tracking-widest">{value}</span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          className="w-14 h-full flex items-center justify-center border-l border-gray-100 hover:bg-gray-50 text-gray-400 hover:text-[#C97C2F] transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   COLLAPSIBLE SECTION
───────────────────────────────────────────── */
function CollapsibleSection({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-gray-100 rounded-none overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">{title}</span>
        {open ? (
          <ChevronUp className="w-3.5 h-3.5 text-gray-400" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
        )}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="p-4 space-y-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─────────────────────────────────────────────
   PROPS
───────────────────────────────────────────── */
interface BookingFormProps {
  onRouteUpdate: (type: "pickup" | "dropoff", coords: [number, number]) => void;
}

/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */
export default function BookingForm({ onRouteUpdate }: BookingFormProps) {
  const [activeTab, setActiveTab]   = useState("city");
  const [quote, setQuote]           = useState(20000);
  const [tripSearch, setTripSearch] = useState("");
  const [showTripDropdown, setShowTripDropdown] = useState(false);
  const [waypoints, setWaypoints]   = useState<string[]>([]);

  /* ── Core form state ── */
  const [formData, setFormData] = useState({
    // routing
    pickup:          "",
    dropoff:         "",
    serviceType:     "airport",
    hours:           "3",
    vehicleId:       "sedan",
    date:            "",
    time:            "",
    selectedTripId:  "",
    // passengers & luggage
    passengers:      1,
    luggage:         "none",
    // return trip
    returnTrip:      false,
    returnDate:      "",
    returnTime:      "",
    // airport extras
    flightNumber:    "",
    // accommodation
    hotelName:       "",
    // contact
    contactName:     "",
    contactPhone:    "",
    // notes
    specialRequests: "",
  });

  const set = (k: keyof typeof formData, v: any) =>
    setFormData((prev) => ({ ...prev, [k]: v }));

  const selectedVehicle = useMemo(
    () => VEHICLES.find((v) => v.id === formData.vehicleId) || VEHICLES[0],
    [formData.vehicleId]
  );

  const filteredTrips = useMemo(
    () => RWANDA_SITES.filter((s) =>
      s.title.toLowerCase().includes(tripSearch.toLowerCase())
    ),
    [tripSearch]
  );

  /* ── Quote calculation ── */
  useEffect(() => {
    let base = 0;
    if (activeTab === "city") {
      base =
        formData.serviceType === "airport"
          ? 20000
          : formData.serviceType === "city_tour"
          ? 100000
          : 10000;
    } else if (activeTab === "hourly") {
      base = 25000 + (parseInt(formData.hours) - 3) * 7000;
    } else if (activeTab === "country") {
      const trip = RWANDA_SITES.find((s) => s.id === formData.selectedTripId);
      base = trip ? trip.price : 0;
    }
    // Passenger surcharge: +10% per passenger above 1
    const paxMultiplier = 1 + (formData.passengers - 1) * 0.1;
    // Return trip doubles the base
    const returnMult = formData.returnTrip ? 2 : 1;
    // Waypoint surcharge: +8000 per stop
    const waypointExtra = waypoints.filter(Boolean).length * 8000;
    setQuote(
      Math.round(base * selectedVehicle.multiplier * paxMultiplier * returnMult) +
        waypointExtra
    );
  }, [
    activeTab,
    formData.vehicleId,
    formData.hours,
    formData.serviceType,
    formData.selectedTripId,
    formData.passengers,
    formData.returnTrip,
    waypoints,
    selectedVehicle,
  ]);

  /* ── WhatsApp handler ── */
  const handleWhatsApp = () => {
    const lines = [
      `🚗 *SURA ESSENCE — BOOKING REQUEST*`,
      ``,
      `📋 *Service*: ${activeTab === "city" ? `City — ${formData.serviceType}` : activeTab === "hourly" ? `Hourly (${formData.hours}h)` : `Country Trip — ${formData.selectedTripId}`}`,
      `🚘 *Vehicle*: ${selectedVehicle.name}`,
      `👥 *Passengers*: ${formData.passengers}`,
      `🧳 *Luggage*: ${LUGGAGE_OPTIONS.find((l) => l.id === formData.luggage)?.label || "—"}`,
      ``,
      `📍 *Pickup*: ${formData.pickup || "—"}`,
      waypoints.filter(Boolean).length
        ? `🔁 *Stops*: ${waypoints.filter(Boolean).join(" → ")}`
        : null,
      `🏁 *Dropoff*: ${formData.dropoff || formData.selectedTripId ? RWANDA_SITES.find((s) => s.id === formData.selectedTripId)?.title : "—"}`,
      formData.hotelName ? `🏨 *Hotel*: ${formData.hotelName}` : null,
      ``,
      `📅 *Date*: ${formData.date || "—"}  ⏰ *Time*: ${formData.time || "—"}`,
      formData.serviceType === "airport" && formData.flightNumber
        ? `✈️ *Flight*: ${formData.flightNumber}`
        : null,
      formData.returnTrip
        ? `🔄 *Return*: ${formData.returnDate || "—"} @ ${formData.returnTime || "—"}`
        : null,
      ``,
      formData.contactName  ? `👤 *Name*: ${formData.contactName}`   : null,
      formData.contactPhone ? `📞 *Phone*: ${formData.contactPhone}` : null,
      formData.specialRequests
        ? `📝 *Notes*: ${formData.specialRequests}`
        : null,
      ``,
      `💵 *Estimated Total*: ${quote.toLocaleString()} RWF`,
    ]
      .filter((l) => l !== null)
      .join("\n");

    window.open(
      `https://wa.me/250788564000?text=${encodeURIComponent(lines)}`,
      "_blank"
    );
  };

  /* ─────────────────────────────────────────
     RENDER
  ───────────────────────────────────────── */
  return (
    /* Outer shell — full scenic background */
    <div
      className="relative flex flex-col h-full w-full bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url('${SCENIC_BG}')` }}
    >
      {/* Rich atmospheric overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#111827]/70 via-[#111827]/40 to-[#C97C2F]/20 z-0" />

      {/* Subtle vignette */}
      <div className="absolute inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.45) 100%)",
        }}
      />

      {/* Form panel — glass morphism */}
      <div className="relative z-10 flex flex-col h-full w-full bg-white/[0.93] backdrop-blur-[2px]">

        <Tabs
          defaultValue="city"
          className="flex-1 flex flex-col min-h-0"
          onValueChange={setActiveTab}
        >
          {/* ── Tab bar ── */}
          <div className="px-10 pt-8 flex-shrink-0">
            <TabsList className="grid w-full grid-cols-3 bg-gray-50/80 p-1 rounded-none border border-gray-100">
              <TabsTrigger
                value="city"
                className="rounded-none h-10 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-[#C97C2F]"
              >
                City
              </TabsTrigger>
              <TabsTrigger
                value="hourly"
                className="rounded-none h-10 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-[#C97C2F]"
              >
                Hourly
              </TabsTrigger>
              <TabsTrigger
                value="country"
                className="rounded-none h-10 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-[#C97C2F]"
              >
                Trips
              </TabsTrigger>
            </TabsList>
          </div>

          {/* ── Scrollable body ── */}
          <div className="p-10 flex-1 space-y-8 overflow-y-auto custom-scrollbar min-h-0">

            {/* VEHICLE SELECTOR */}
            <div className="space-y-3">
              <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Select Fleet Type
              </Label>
              <div className="grid grid-cols-2 gap-3">
                {VEHICLES.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => set("vehicleId", v.id)}
                    className={`p-4 border text-left transition-all ${
                      formData.vehicleId === v.id
                        ? "border-[#C97C2F] bg-[#C97C2F]/5"
                        : "border-gray-100 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span
                        className={`text-[10px] font-black uppercase tracking-widest ${
                          formData.vehicleId === v.id ? "text-[#C97C2F]" : "text-gray-400"
                        }`}
                      >
                        {v.name}
                      </span>
                      {formData.vehicleId === v.id && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#C97C2F]" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-[#111827] mb-1">
                      <Users className="w-3 h-3" /> {v.capacity}
                    </div>
                    <p className="text-[9px] text-gray-400 font-medium leading-tight">
                      Comfort: {v.comfort}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* ══════════ CITY TAB ══════════ */}
            <TabsContent value="city" className="space-y-6 mt-0">
              {/* Service type */}
              <div className="grid grid-cols-3 gap-4">
                {[
                  { id: "airport",    label: "Airport",  icon: Plane   },
                  { id: "city_tour",  label: "Tour",     icon: MapIcon },
                  { id: "inter_city", label: "A to B",   icon: Car     },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => set("serviceType", s.id)}
                    className={`flex flex-col items-center justify-center p-4 border rounded-none transition-all ${
                      formData.serviceType === s.id
                        ? "border-[#C97C2F] bg-[#C97C2F]/5 text-[#C97C2F]"
                        : "border-gray-100 text-gray-400 hover:border-gray-300"
                    }`}
                  >
                    <s.icon className="w-5 h-5 mb-2" />
                    <span className="text-[10px] font-black uppercase tracking-widest">
                      {s.label}
                    </span>
                  </button>
                ))}
              </div>

              <OSMInput
                label="Pickup"
                icon={MapPin}
                showGPS
                onSelect={(c, n) => { set("pickup", n); onRouteUpdate("pickup", c); }}
              />

              {/* Extra waypoints */}
              {waypoints.map((wp, i) => (
                <div key={i} className="flex gap-2">
                  <div className="flex-1">
                    <OSMInput
                      label={`Stop ${i + 1}`}
                      icon={MapPin}
                      onSelect={(c, n) => {
                        const updated = [...waypoints];
                        updated[i] = n;
                        setWaypoints(updated);
                      }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setWaypoints(waypoints.filter((_, j) => j !== i))}
                    className="mt-8 w-14 h-14 border border-gray-200 flex items-center justify-center text-gray-400 hover:text-red-400 hover:border-red-200 transition-colors flex-shrink-0"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                </div>
              ))}

              {formData.serviceType !== "city_tour" && (
                <OSMInput
                  label="Destination"
                  icon={Navigation}
                  onSelect={(c, n) => { set("dropoff", n); onRouteUpdate("dropoff", c); }}
                />
              )}

              {/* Add waypoint button */}
              <button
                type="button"
                onClick={() => setWaypoints([...waypoints, ""])}
                className="w-full h-10 border border-dashed border-gray-200 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:border-[#C97C2F] hover:text-[#C97C2F] transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add Stop
              </button>

              {/* Airport: flight number */}
              <AnimatePresence>
                {formData.serviceType === "airport" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-2 overflow-hidden"
                  >
                    <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      Flight Number
                    </Label>
                    <div className="relative">
                      <div className="absolute left-0 top-0 bottom-0 w-12 flex items-center justify-center bg-gray-50 border-r border-gray-100 z-10">
                        <Hash className="w-4 h-4 text-[#C97C2F]" />
                      </div>
                      <Input
                        value={formData.flightNumber}
                        onChange={(e) => set("flightNumber", e.target.value.toUpperCase())}
                        className="pl-16 h-14 bg-white border border-gray-200 rounded-none text-xs font-bold text-[#111827] uppercase tracking-wider focus:ring-0 focus:border-[#C97C2F]"
                        placeholder="E.G. RW 101..."
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </TabsContent>

            {/* ══════════ HOURLY TAB ══════════ */}
            <TabsContent value="hourly" className="space-y-6 mt-0">
              <OSMInput
                label="Pickup"
                icon={MapPin}
                showGPS
                onSelect={(c, n) => { set("pickup", n); onRouteUpdate("pickup", c); }}
              />
              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-gray-400 uppercase">
                  Duration
                </Label>
                <Select
                  onValueChange={(v) => set("hours", v)}
                  defaultValue="3"
                >
                  <SelectTrigger className="h-14 bg-white border border-gray-200 rounded-none text-xs font-bold uppercase">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-none border border-gray-100">
                    {[3, 4, 5, 6, 8, 10, 12].map((h) => (
                      <SelectItem
                        key={h}
                        value={h.toString()}
                        className="uppercase font-bold text-xs"
                      >
                        {h} Hours
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Driver tasks for hourly */}
              <CollapsibleSection title="Planned Activities (Optional)">
                <Textarea
                  value={formData.specialRequests}
                  onChange={(e) => set("specialRequests", e.target.value)}
                  className="min-h-[80px] bg-white border border-gray-200 rounded-none text-xs font-bold text-[#111827] uppercase tracking-wide focus:ring-0 focus:border-[#C97C2F] resize-none"
                  placeholder="E.G. CITY SIGHTSEEING, SHOPPING STOPS, BUSINESS MEETINGS..."
                />
              </CollapsibleSection>
            </TabsContent>

            {/* ══════════ COUNTRY (TRIPS) TAB ══════════ */}
            <TabsContent value="country" className="space-y-6 mt-0">
              <OSMInput
                label="Pickup"
                icon={MapPin}
                showGPS
                onSelect={(c, n) => { set("pickup", n); onRouteUpdate("pickup", c); }}
              />

              <div className="space-y-2 relative">
                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Destination
                </Label>
                <div className="relative">
                  <div className="absolute left-0 top-0 bottom-0 w-12 flex items-center justify-center bg-gray-50 border-r border-gray-100 z-10">
                    <Search className="w-4 h-4 text-[#C97C2F]" />
                  </div>
                  <Input
                    value={tripSearch}
                    onChange={(e) => setTripSearch(e.target.value)}
                    onFocus={() => setShowTripDropdown(true)}
                    onBlur={() => setTimeout(() => setShowTripDropdown(false), 200)}
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
                          onMouseDown={() => {
                            setTripSearch(s.title);
                            set("selectedTripId", s.id);
                            onRouteUpdate("dropoff", [s.coords[0], s.coords[1]]);
                            setShowTripDropdown(false);
                          }}
                          className="p-4 hover:bg-[#F5F2EA] cursor-pointer border-b border-gray-50 last:border-0"
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-xs font-bold uppercase text-[#111827]">
                                {s.title}
                              </p>
                              <p className="text-[9px] font-bold text-[#C97C2F] uppercase">
                                {s.region}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-[9px] font-black text-gray-400">
                                from
                              </p>
                              <p className="text-[10px] font-black text-[#111827]">
                                {s.price.toLocaleString()}
                                <span className="text-[#C97C2F] ml-1">RWF</span>
                              </p>
                            </div>
                          </div>
                        </li>
                      ))}
                    </motion.ul>
                  )}
                </AnimatePresence>
              </div>
            </TabsContent>

            {/* ══════════ DATE & TIME (shared) ══════════ */}
            <div className="grid grid-cols-2 gap-4 pt-6 border-t border-gray-100">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-gray-400 uppercase">
                  Date
                </Label>
                <div className="relative">
                  <div className="absolute left-0 top-0 bottom-0 w-10 bg-gray-50 flex items-center justify-center border-r border-gray-200 z-10">
                    <Calendar className="w-4 h-4 text-[#C97C2F]" />
                  </div>
                  <Input
                    type="date"
                    className="pl-12 h-12 border border-gray-200 rounded-none text-xs font-bold uppercase"
                    onChange={(e) => set("date", e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-gray-400 uppercase">
                  Time
                </Label>
                <div className="relative">
                  <div className="absolute left-0 top-0 bottom-0 w-10 bg-gray-50 flex items-center justify-center border-r border-gray-200 z-10">
                    <Clock className="w-4 h-4 text-[#C97C2F]" />
                  </div>
                  <Input
                    type="time"
                    className="pl-12 h-12 border border-gray-200 rounded-none text-xs font-bold uppercase"
                    onChange={(e) => set("time", e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* ══════════ PASSENGER & LUGGAGE ══════════ */}
            <div className="grid grid-cols-2 gap-4">
              <Stepper
                label="Passengers"
                value={formData.passengers}
                min={1}
                max={selectedVehicle.id === "bus" ? 40 : selectedVehicle.id === "van" ? 10 : selectedVehicle.id === "suv" ? 7 : 4}
                onChange={(v) => set("passengers", v)}
              />
              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Luggage
                </Label>
                <Select
                  value={formData.luggage}
                  onValueChange={(v) => set("luggage", v)}
                >
                  <SelectTrigger className="h-14 bg-white border border-gray-200 rounded-none text-xs font-bold uppercase">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-none border border-gray-100">
                    {LUGGAGE_OPTIONS.map((l) => (
                      <SelectItem
                        key={l.id}
                        value={l.id}
                        className="uppercase font-bold text-xs"
                      >
                        {l.icon} {l.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* ══════════ RETURN TRIP ══════════ */}
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => set("returnTrip", !formData.returnTrip)}
                className={`w-full flex items-center justify-between px-5 h-14 border transition-all ${
                  formData.returnTrip
                    ? "border-[#C97C2F] bg-[#C97C2F]/5"
                    : "border-gray-100 bg-gray-50 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Repeat2
                    className={`w-4 h-4 ${
                      formData.returnTrip ? "text-[#C97C2F]" : "text-gray-400"
                    }`}
                  />
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-600">
                    Return Trip
                  </span>
                </div>
                <div
                  className={`w-10 h-5 rounded-full relative transition-colors ${
                    formData.returnTrip ? "bg-[#C97C2F]" : "bg-gray-200"
                  }`}
                >
                  <div
                    className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                      formData.returnTrip ? "translate-x-5" : "translate-x-0.5"
                    }`}
                  />
                </div>
              </button>

              <AnimatePresence>
                {formData.returnTrip && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="grid grid-cols-2 gap-4 overflow-hidden"
                  >
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold text-gray-400 uppercase">
                        Return Date
                      </Label>
                      <div className="relative">
                        <div className="absolute left-0 top-0 bottom-0 w-10 bg-gray-50 flex items-center justify-center border-r border-gray-200 z-10">
                          <Calendar className="w-4 h-4 text-[#C97C2F]" />
                        </div>
                        <Input
                          type="date"
                          className="pl-12 h-12 border border-gray-200 rounded-none text-xs font-bold uppercase"
                          onChange={(e) => set("returnDate", e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold text-gray-400 uppercase">
                        Return Time
                      </Label>
                      <div className="relative">
                        <div className="absolute left-0 top-0 bottom-0 w-10 bg-gray-50 flex items-center justify-center border-r border-gray-200 z-10">
                          <Clock className="w-4 h-4 text-[#C97C2F]" />
                        </div>
                        <Input
                          type="time"
                          className="pl-12 h-12 border border-gray-200 rounded-none text-xs font-bold uppercase"
                          onChange={(e) => set("returnTime", e.target.value)}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ══════════ ACCOMMODATION ══════════ */}
            <CollapsibleSection title="Accommodation Details">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Hotel / Lodge Name
                </Label>
                <div className="relative">
                  <div className="absolute left-0 top-0 bottom-0 w-12 flex items-center justify-center bg-gray-50 border-r border-gray-100 z-10">
                    <Hotel className="w-4 h-4 text-[#C97C2F]" />
                  </div>
                  <Input
                    value={formData.hotelName}
                    onChange={(e) => set("hotelName", e.target.value)}
                    className="pl-16 h-14 bg-white border border-gray-200 rounded-none text-xs font-bold text-[#111827] uppercase tracking-wider focus:ring-0 focus:border-[#C97C2F]"
                    placeholder="KIGALI MARRIOTT, BISATE LODGE..."
                  />
                </div>
              </div>
            </CollapsibleSection>

            {/* ══════════ CONTACT DETAILS ══════════ */}
            <CollapsibleSection title="Your Contact Details" defaultOpen>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    Full Name
                  </Label>
                  <div className="relative">
                    <div className="absolute left-0 top-0 bottom-0 w-12 flex items-center justify-center bg-gray-50 border-r border-gray-100 z-10">
                      <User className="w-4 h-4 text-[#C97C2F]" />
                    </div>
                    <Input
                      value={formData.contactName}
                      onChange={(e) => set("contactName", e.target.value)}
                      className="pl-16 h-14 bg-white border border-gray-200 rounded-none text-xs font-bold text-[#111827] uppercase tracking-wider focus:ring-0 focus:border-[#C97C2F]"
                      placeholder="YOUR NAME..."
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    Phone / WhatsApp
                  </Label>
                  <div className="relative">
                    <div className="absolute left-0 top-0 bottom-0 w-12 flex items-center justify-center bg-gray-50 border-r border-gray-100 z-10">
                      <Phone className="w-4 h-4 text-[#C97C2F]" />
                    </div>
                    <Input
                      type="tel"
                      value={formData.contactPhone}
                      onChange={(e) => set("contactPhone", e.target.value)}
                      className="pl-16 h-14 bg-white border border-gray-200 rounded-none text-xs font-bold text-[#111827] uppercase tracking-wider focus:ring-0 focus:border-[#C97C2F]"
                      placeholder="+250 78X XXX XXX..."
                    />
                  </div>
                </div>
              </div>
            </CollapsibleSection>

            {/* ══════════ SPECIAL REQUESTS ══════════ */}
            <CollapsibleSection title="Special Requests / Notes">
              <div className="space-y-2">
                <div className="relative">
                  <div className="absolute left-0 top-0 h-14 w-12 flex items-center justify-center bg-gray-50 border-r border-gray-100 z-10">
                    <MessageSquare className="w-4 h-4 text-[#C97C2F]" />
                  </div>
                  <Textarea
                    value={formData.specialRequests}
                    onChange={(e) => set("specialRequests", e.target.value)}
                    className="pl-16 pt-4 min-h-[100px] bg-white border border-gray-200 rounded-none text-xs font-bold text-[#111827] uppercase tracking-wide focus:ring-0 focus:border-[#C97C2F] resize-none"
                    placeholder="CHILD SEAT, WHEELCHAIR ACCESS, BOTTLED WATER, SPECIFIC ROUTE, VIP PRIVACY..."
                  />
                </div>
              </div>
            </CollapsibleSection>

          </div>

          {/* ── Footer: price + CTA ── */}
          <div className="p-10 border-t border-gray-100 bg-[#F9F9F9] flex-shrink-0">
            {/* Price breakdown */}
            <div className="mb-4 space-y-1">
              {formData.returnTrip && (
                <div className="flex justify-between text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                  <span>Return trip included</span>
                  <span className="text-[#C97C2F]">×2</span>
                </div>
              )}
              {waypoints.filter(Boolean).length > 0 && (
                <div className="flex justify-between text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                  <span>{waypoints.filter(Boolean).length} extra stop(s)</span>
                  <span className="text-[#C97C2F]">
                    +{(waypoints.filter(Boolean).length * 8000).toLocaleString()} RWF
                  </span>
                </div>
              )}
            </div>

            <div className="flex justify-between items-end mb-5">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Total Estimate
              </span>
              <span className="text-3xl font-black text-[#111827] tracking-tighter">
                {quote.toLocaleString()}{" "}
                <span className="text-sm text-[#C97C2F]">RWF</span>
              </span>
            </div>

            <Button
              onClick={handleWhatsApp}
              className="w-full h-14 bg-[#111827] hover:bg-[#C97C2F] text-white font-black uppercase tracking-widest text-xs rounded-none shadow-lg transition-colors duration-300"
            >
              Confirm &amp; Book via WhatsApp{" "}
              <ArrowRight className="ml-3 w-4 h-4" />
            </Button>
          </div>
        </Tabs>
      </div>
    </div>
  );
}