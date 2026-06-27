"use client";

import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Plus,
  Minus,
  ChevronDown,
  ChevronUp,
  Hotel,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/* ─────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────── */

type VehicleId = "sedan" | "suv" | "van" | "bus";
type LuggageId = "none" | "carry" | "medium" | "heavy";
type ServiceType = "airport" | "city_tour" | "inter_city";
type TabId = "city" | "hourly" | "country";

interface LatLon {
  lat: number;
  lon: number;
}

/** Normalised result from the Photon OSM API */
interface OSMSuggestion {
  displayName: string;
  lat: number;
  lon: number;
}

/** Raw feature shape returned by photon.komoot.io */
interface PhotonFeature {
  properties: { name?: string; city?: string };
  geometry: { coordinates: [number, number] }; // [lon, lat]
}

interface RwandaSite {
  id: string;
  title: string;
  region: string;
  price: number;
  coords: [number, number]; // [lat, lon]
}

interface Vehicle {
  id: VehicleId;
  name: string;
  capacity: string;
  comfort: string;
  multiplier: number;
  maxPassengers: number;
}

interface LuggageOption {
  id: LuggageId;
  label: string;
  icon: string;
}

interface FormData {
  // Routing
  pickup: string;
  dropoff: string;
  serviceType: ServiceType;
  hours: string;
  vehicleId: VehicleId;
  date: string;
  time: string;
  selectedTripId: string;
  // Passengers & luggage
  passengers: number;
  luggage: LuggageId;
  // Return trip
  returnTrip: boolean;
  returnDate: string;
  returnTime: string;
  // Airport extras
  flightNumber: string;
  // Accommodation
  hotelName: string;
  // Contact
  contactName: string;
  contactPhone: string;
  // Notes
  specialRequests: string;
}

interface BookingFormProps {
  onRouteUpdate: (type: "pickup" | "dropoff", coords: [number, number]) => void;
}

/* ─────────────────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────── */

/** Base fares and surcharge rates — single source of truth */
const PRICING = {
  AIRPORT_BASE: 20_000,
  CITY_TOUR_BASE: 100_000,
  INTER_CITY_BASE: 10_000,
  HOURLY_BASE: 25_000,
  HOURLY_MIN_HOURS: 3,
  HOURLY_INCREMENT_PER_HOUR: 7_000,
  WAYPOINT_SURCHARGE: 8_000,
  PASSENGER_SURCHARGE_RATE: 0.1, // +10 % per passenger above 1
} as const;

const WHATSAPP_NUMBER = "250788564000";
const SCENIC_BG = "/scenic/aerial-view.jpg";
const OSM_BIAS = { lat: -1.9441, lon: 30.0619 } satisfies LatLon; // Kigali centre

const RWANDA_SITES: RwandaSite[] = [
  { id: "volcanoes", title: "Volcanoes National Park",  region: "Musanze",  price: 90_000,  coords: [-1.4748, 29.4831] },
  { id: "akagera",   title: "Akagera National Park",    region: "Eastern",  price: 120_000, coords: [-1.8833, 30.7167] },
  { id: "nyungwe",   title: "Nyungwe Forest (Canopy)",  region: "Southern", price: 150_000, coords: [-2.4639, 29.2031] },
  { id: "rubavu",    title: "Lake Kivu (Rubavu)",        region: "Western",  price: 110_000, coords: [-1.6853, 29.4101] },
  { id: "karongi",   title: "Lake Kivu (Karongi)",      region: "Western",  price: 100_000, coords: [-2.1583, 29.3400] },
  { id: "huye",      title: "Ethnographic Museum",      region: "Huye",     price: 80_000,  coords: [-2.6000, 29.7333] },
  { id: "kigali",    title: "Kigali City Tour",         region: "Kigali",   price: 60_000,  coords: [-1.9441, 30.0619] },
  { id: "musanze",   title: "Musanze Caves",            region: "Musanze",  price: 75_000,  coords: [-1.4990, 29.6340] },
  { id: "bisate",    title: "Bisate Village",           region: "Musanze",  price: 95_000,  coords: [-1.5203, 29.5031] },
  { id: "gishwati",  title: "Gishwati-Mukura Forest",  region: "Western",  price: 130_000, coords: [-1.8333, 29.3833] },
];

const VEHICLES: Vehicle[] = [
  { id: "sedan", name: "Standard (Sedan)",  capacity: "4 Seats",   comfort: "Essential", multiplier: 1,   maxPassengers: 4  },
  { id: "suv",   name: "Executive (SUV)",   capacity: "7 Seats",   comfort: "Premium",   multiplier: 2,   maxPassengers: 7  },
  { id: "van",   name: "Group (Van)",       capacity: "10 Seats",  comfort: "Standard",  multiplier: 2.5, maxPassengers: 10 },
  { id: "bus",   name: "Coach (Bus)",       capacity: "20+ Seats", comfort: "Group",     multiplier: 5,   maxPassengers: 40 },
];

const LUGGAGE_OPTIONS: LuggageOption[] = [
  { id: "none",   label: "No Luggage",    icon: "—"  },
  { id: "carry",  label: "Carry-On Only", icon: "🎒" },
  { id: "medium", label: "1–2 Suitcases", icon: "🧳" },
  { id: "heavy",  label: "3+ / Heavy",    icon: "🏋️" },
];

const HOURLY_OPTIONS = [3, 4, 5, 6, 8, 10, 12] as const;

const SERVICE_TYPES = [
  { id: "airport"    as const, label: "Airport", icon: Plane   },
  { id: "city_tour"  as const, label: "Tour",    icon: MapIcon },
  { id: "inter_city" as const, label: "A to B",  icon: Car     },
] as const;

/* ─────────────────────────────────────────────────────────
   CUSTOM HOOKS
───────────────────────────────────────────────────────── */

/**
 * Debounced geocoding search against the Photon/OSM API.
 * Returns normalised suggestions, a loading flag, and any error message.
 */
function useOSMSearch(query: string, debounceMs = 500) {
  const [suggestions, setSuggestions] = useState<OSMSuggestion[]>([]);
  const [isLoading, setIsLoading]     = useState(false);
  const [error, setError]             = useState<string | null>(null);

  useEffect(() => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }
    const timerId = setTimeout(async () => {
      setIsLoading(true);
      setError(null);
      try {
        const url = new URL("https://photon.komoot.io/api/");
        url.searchParams.set("q",     query);
        url.searchParams.set("lat",   String(OSM_BIAS.lat));
        url.searchParams.set("lon",   String(OSM_BIAS.lon));
        url.searchParams.set("limit", "5");

        const res = await fetch(url.toString());
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();
        setSuggestions(
          (data.features as PhotonFeature[]).map((f) => ({
            displayName: [f.properties.name, f.properties.city]
              .filter(Boolean)
              .join(", "),
            lat: f.geometry.coordinates[1],
            lon: f.geometry.coordinates[0],
          }))
        );
      } catch {
        setError("Search unavailable — please type your location manually.");
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, debounceMs);

    return () => clearTimeout(timerId);
  }, [query, debounceMs]);

  return { suggestions, isLoading, error };
}

/**
 * Browser Geolocation + Photon reverse-geocoding.
 * Returns a `locate` callback that calls `onSuccess` with coords and name,
 * plus a loading flag and any user-visible error.
 */
function useGeolocation() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]         = useState<string | null>(null);

  const locate = useCallback(
    (onSuccess: (coords: [number, number], name: string) => void) => {
      if (!navigator.geolocation) {
        setError("Geolocation is not supported by your browser.");
        return;
      }
      setIsLoading(true);
      setError(null);

      navigator.geolocation.getCurrentPosition(
        async ({ coords }) => {
          const { latitude, longitude } = coords;
          try {
            const res = await fetch(
              `https://photon.komoot.io/reverse?lat=${latitude}&lon=${longitude}`
            );
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            const f    = data.features[0] as PhotonFeature;
            const name = [f.properties.name ?? "Current Location", f.properties.city]
              .filter(Boolean)
              .join(", ");
            onSuccess([latitude, longitude], name);
          } catch {
            setError("Could not determine your address. Try typing it instead.");
          } finally {
            setIsLoading(false);
          }
        },
        () => {
          setError("Location access was denied.");
          setIsLoading(false);
        }
      );
    },
    []
  );

  return { locate, isLoading, error };
}

/**
 * Typed form state + a stable `update` updater.
 * Extracting this keeps the main component lean and makes individual
 * fields trivially testable.
 */
function useBookingForm() {
  const [formData, setFormData] = useState<FormData>({
    pickup:          "",
    dropoff:         "",
    serviceType:     "airport",
    hours:           "3",
    vehicleId:       "sedan",
    date:            "",
    time:            "",
    selectedTripId:  "",
    passengers:      1,
    luggage:         "none",
    returnTrip:      false,
    returnDate:      "",
    returnTime:      "",
    flightNumber:    "",
    hotelName:       "",
    contactName:     "",
    contactPhone:    "",
    specialRequests: "",
  });

  const update = useCallback(
    <K extends keyof FormData>(key: K, value: FormData[K]) =>
      setFormData((prev) => ({ ...prev, [key]: value })),
    []
  );

  return { formData, update };
}

/**
 * Derives the live price estimate from current form state.
 * Pure calculation — no side effects, no state.
 */
function useQuote(
  activeTab:        TabId,
  formData:         FormData,
  waypoints:        string[],
  vehicleMultiplier: number
): number {
  return useMemo(() => {
    let base = 0;

    if (activeTab === "city") {
      const rates: Record<ServiceType, number> = {
        airport:    PRICING.AIRPORT_BASE,
        city_tour:  PRICING.CITY_TOUR_BASE,
        inter_city: PRICING.INTER_CITY_BASE,
      };
      base = rates[formData.serviceType];
    } else if (activeTab === "hourly") {
      const hours = parseInt(formData.hours, 10);
      base =
        PRICING.HOURLY_BASE +
        (hours - PRICING.HOURLY_MIN_HOURS) * PRICING.HOURLY_INCREMENT_PER_HOUR;
    } else if (activeTab === "country") {
      base = RWANDA_SITES.find((s) => s.id === formData.selectedTripId)?.price ?? 0;
    }

    const paxMultiplier  = 1 + (formData.passengers - 1) * PRICING.PASSENGER_SURCHARGE_RATE;
    const returnMult     = formData.returnTrip ? 2 : 1;
    const waypointExtra  = waypoints.filter(Boolean).length * PRICING.WAYPOINT_SURCHARGE;

    return Math.round(base * vehicleMultiplier * paxMultiplier * returnMult) + waypointExtra;
  }, [activeTab, formData, waypoints, vehicleMultiplier]);
}

/* ─────────────────────────────────────────────────────────
   SHARED STYLE TOKENS
   Centralising repeated Tailwind fragments prevents drift.
───────────────────────────────────────────────────────── */
const cx = {
  label:     "text-[10px] font-bold text-gray-400 uppercase tracking-widest",
  input:     "h-14 bg-white border border-gray-200 rounded-none text-xs font-bold text-[#111827] uppercase tracking-wider focus:ring-0 focus:border-[#C97C2F] transition-all",
  iconSlot:  "absolute left-0 top-0 bottom-0 w-12 flex items-center justify-center bg-gray-50 border-r border-gray-100 z-10",
  amber:     "text-[#C97C2F]",
  amberBorder: "border-[#C97C2F] bg-[#C97C2F]/5",
} as const;

/* ─────────────────────────────────────────────────────────
   SUB-COMPONENTS
───────────────────────────────────────────────────────── */

interface OSMInputProps {
  label:    string;
  onSelect: (coords: [number, number], name: string) => void;
  icon:     React.ElementType;
  showGPS?: boolean;
}

function OSMInput({ label, onSelect, icon: Icon, showGPS = false }: OSMInputProps) {
  const [query, setQuery]           = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const inputId                     = React.useId();
  const listId                      = `${inputId}-list`;

  const { suggestions, isLoading: searchLoading } = useOSMSearch(query);
  const { locate, isLoading: gpsLoading }         = useGeolocation();

  const isLoading = searchLoading || gpsLoading;

  const handleSelect = (s: OSMSuggestion) => {
    setQuery(s.displayName.split(",")[0]);
    onSelect([s.lat, s.lon], s.displayName);
    setShowDropdown(false);
  };

  const handleGPS = () =>
    locate((coords, name) => {
      setQuery(name);
      onSelect(coords, name);
    });

  return (
    <div className="space-y-2 relative">
      <Label htmlFor={inputId} className={cx.label}>{label}</Label>
      <div className="relative group">
        <div className={cx.iconSlot}>
          <Icon className={`w-4 h-4 ${cx.amber}`} />
        </div>
        <Input
          id={inputId}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
          autoComplete="off"
          aria-autocomplete="list"
          aria-controls={showDropdown ? listId : undefined}
          aria-expanded={showDropdown}
          className={`${cx.input} pl-16 ${showGPS ? "pr-12" : "pr-4"} ${
            showDropdown ? "border-l-4 border-[#C97C2F]" : ""
          }`}
          placeholder={`Search ${label}…`}
        />
        {showGPS && (
          <button
            type="button"
            onClick={handleGPS}
            aria-label="Use my current location"
            className="absolute right-0 top-0 bottom-0 w-12 flex items-center justify-center hover:bg-gray-50 z-20"
          >
            {isLoading ? (
              <Loader2 className={`w-4 h-4 animate-spin ${cx.amber}`} />
            ) : (
              <Crosshair className="w-4 h-4 text-gray-400" />
            )}
          </button>
        )}
      </div>

      <AnimatePresence>
        {showDropdown && suggestions.length > 0 && (
          <motion.ul
            id={listId}
            role="listbox"
            aria-label={`${label} suggestions`}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="absolute z-50 w-full bg-white border border-gray-100 shadow-xl mt-0 max-h-52 overflow-y-auto"
          >
            {suggestions.map((s, i) => (
              <li
                key={i}
                role="option"
                aria-selected={false}
                onMouseDown={() => handleSelect(s)}
                className={`p-4 hover:bg-[#F5F2EA] cursor-pointer text-xs font-bold uppercase tracking-wider
                  border-b border-gray-50 last:border-0 transition-colors text-gray-600 hover:${cx.amber}`}
              >
                {s.displayName}
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Stepper ──────────────────────────────────────────── */

interface StepperProps {
  label:    string;
  value:    number;
  min?:     number;
  max?:     number;
  onChange: (value: number) => void;
}

function Stepper({ label, value, min = 1, max = 20, onChange }: StepperProps) {
  const decrementId = React.useId();
  const incrementId = React.useId();

  return (
    <div className="space-y-2">
      <Label className={cx.label}>{label}</Label>
      <div className="flex items-center h-14 border border-gray-200 bg-white" role="group" aria-label={label}>
        <button
          type="button"
          id={decrementId}
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          aria-label={`Decrease ${label}`}
          className="w-14 h-full flex items-center justify-center border-r border-gray-100
            hover:bg-gray-50 text-gray-400 hover:text-[#C97C2F] transition-colors
            disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <output
          htmlFor={`${decrementId} ${incrementId}`}
          className="flex-1 text-center text-sm font-black text-[#111827] tracking-widest"
        >
          {value}
        </output>
        <button
          type="button"
          id={incrementId}
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          aria-label={`Increase ${label}`}
          className="w-14 h-full flex items-center justify-center border-l border-gray-100
            hover:bg-gray-50 text-gray-400 hover:text-[#C97C2F] transition-colors
            disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

/* ── CollapsibleSection ───────────────────────────────── */

interface CollapsibleSectionProps {
  title:       string;
  children:    React.ReactNode;
  defaultOpen?: boolean;
}

function CollapsibleSection({ title, children, defaultOpen = false }: CollapsibleSectionProps) {
  const [open, setOpen]  = useState(defaultOpen);
  const contentId        = React.useId();
  const headingId        = React.useId();

  return (
    <div className="border border-gray-100 overflow-hidden">
      <button
        type="button"
        id={headingId}
        aria-expanded={open}
        aria-controls={contentId}
        onClick={() => setOpen((prev) => !prev)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">{title}</span>
        {open
          ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" aria-hidden="true" />
          : <ChevronDown className="w-3.5 h-3.5 text-gray-400" aria-hidden="true" />
        }
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={contentId}
            role="region"
            aria-labelledby={headingId}
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

/* ─────────────────────────────────────────────────────────
   ICON SLOT — shared layout for form-field icons
───────────────────────────────────────────────────────── */
function IconSlot({ icon: Icon }: { icon: React.ElementType }) {
  return (
    <div className={cx.iconSlot}>
      <Icon className={`w-4 h-4 ${cx.amber}`} aria-hidden="true" />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────── */

export default function BookingForm({ onRouteUpdate }: BookingFormProps) {
  const [activeTab, setActiveTab]           = useState<TabId>("city");
  const [tripSearch, setTripSearch]         = useState("");
  const [showTripDropdown, setShowTripDropdown] = useState(false);
  const [waypoints, setWaypoints]           = useState<string[]>([]);

  const { formData, update } = useBookingForm();

  const selectedVehicle = useMemo(
    () => VEHICLES.find((v) => v.id === formData.vehicleId) ?? VEHICLES[0],
    [formData.vehicleId]
  );

  const filteredTrips = useMemo(
    () =>
      RWANDA_SITES.filter((s) =>
        s.title.toLowerCase().includes(tripSearch.toLowerCase())
      ),
    [tripSearch]
  );

  const quote = useQuote(activeTab, formData, waypoints, selectedVehicle.multiplier);

  /* ── WhatsApp message builder ─────────────────────── */
  const handleWhatsApp = () => {
    const selectedTrip = RWANDA_SITES.find((s) => s.id === formData.selectedTripId);
    const dropoffLabel = formData.dropoff || selectedTrip?.title || "—";

    const lines: (string | null)[] = [
      "🚗 *SURA ESSENCE — BOOKING REQUEST*",
      "",
      `📋 *Service*: ${
        activeTab === "city"    ? `City — ${formData.serviceType}` :
        activeTab === "hourly"  ? `Hourly (${formData.hours}h)`   :
        `Country Trip — ${selectedTrip?.title ?? formData.selectedTripId}`
      }`,
      `🚘 *Vehicle*: ${selectedVehicle.name}`,
      `👥 *Passengers*: ${formData.passengers}`,
      `🧳 *Luggage*: ${LUGGAGE_OPTIONS.find((l) => l.id === formData.luggage)?.label ?? "—"}`,
      "",
      `📍 *Pickup*: ${formData.pickup || "—"}`,
      waypoints.filter(Boolean).length
        ? `🔁 *Stops*: ${waypoints.filter(Boolean).join(" → ")}`
        : null,
      `🏁 *Dropoff*: ${dropoffLabel}`,
      formData.hotelName ? `🏨 *Hotel*: ${formData.hotelName}` : null,
      "",
      `📅 *Date*: ${formData.date || "—"}  ⏰ *Time*: ${formData.time || "—"}`,
      formData.serviceType === "airport" && formData.flightNumber
        ? `✈️ *Flight*: ${formData.flightNumber}`
        : null,
      formData.returnTrip
        ? `🔄 *Return*: ${formData.returnDate || "—"} @ ${formData.returnTime || "—"}`
        : null,
      "",
      formData.contactName  ? `👤 *Name*: ${formData.contactName}`   : null,
      formData.contactPhone ? `📞 *Phone*: ${formData.contactPhone}` : null,
      formData.specialRequests ? `📝 *Notes*: ${formData.specialRequests}` : null,
      "",
      `💵 *Estimated Total*: ${quote.toLocaleString()} RWF`,
    ];

    const message = lines.filter((l): l is string => l !== null).join("\n");
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, "_blank");
  };

  /* ── Waypoint helpers ─────────────────────────────── */
  const addWaypoint    = () => setWaypoints((prev) => [...prev, ""]);
  const removeWaypoint = (index: number) =>
    setWaypoints((prev) => prev.filter((_, j) => j !== index));
  const updateWaypoint = (index: number, name: string) =>
    setWaypoints((prev) => prev.map((w, j) => (j === index ? name : w)));

  /* ── Passenger cap from selected vehicle ─────────── */
  const passengerMax = selectedVehicle.maxPassengers;

  /* ── Shared date/time inputs ─────────────────────── */
  const renderDateTime = (
    dateKey: "date" | "returnDate",
    timeKey: "time" | "returnTime"
  ) => (
    <div className="grid grid-cols-2 gap-4">
      {/* Date */}
      <div className="space-y-2">
        <Label className={cx.label}>Date</Label>
        <div className="relative">
          <IconSlot icon={Calendar} />
          <Input
            type="date"
            value={formData[dateKey]}
            onChange={(e) => update(dateKey, e.target.value)}
            className={`${cx.input} pl-12 h-12`}
          />
        </div>
      </div>
      {/* Time */}
      <div className="space-y-2">
        <Label className={cx.label}>Time</Label>
        <div className="relative">
          <IconSlot icon={Clock} />
          <Input
            type="time"
            value={formData[timeKey]}
            onChange={(e) => update(timeKey, e.target.value)}
            className={`${cx.input} pl-12 h-12`}
          />
        </div>
      </div>
    </div>
  );

  /* ── Render ───────────────────────────────────────── */
  return (
    <div
      className="relative flex flex-col h-full w-full bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url('${SCENIC_BG}')` }}
    >
      {/* Atmospheric overlay */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-br from-[#111827]/70 via-[#111827]/40 to-[#C97C2F]/20 z-0"
      />
      {/* Vignette */}
      <div
        aria-hidden="true"
        className="absolute inset-0 z-0"
        style={{ background: "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.45) 100%)" }}
      />

      {/* Form panel */}
      <div className="relative z-10 flex flex-col h-full w-full bg-white/[0.93] backdrop-blur-[2px]">
        <Tabs
          defaultValue="city"
          className="flex-1 flex flex-col min-h-0"
          onValueChange={(v) => setActiveTab(v as TabId)}
        >
          {/* ── Tab bar ── */}
          <div className="px-10 pt-8 flex-shrink-0">
            <TabsList className="grid w-full grid-cols-3 bg-gray-50/80 p-1 rounded-none border border-gray-100">
              {(["city", "hourly", "country"] as const).map((tab) => (
                <TabsTrigger
                  key={tab}
                  value={tab}
                  className="rounded-none h-10 text-[10px] font-black uppercase tracking-widest
                    data-[state=active]:bg-white data-[state=active]:text-[#C97C2F]"
                >
                  {tab === "city" ? "City" : tab === "hourly" ? "Hourly" : "Trips"}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {/* ── Scrollable body ── */}
          <div className="p-10 flex-1 space-y-8 overflow-y-auto custom-scrollbar min-h-0">

            {/* ══ VEHICLE SELECTOR ══ */}
            <div className="space-y-3">
              <Label className={cx.label}>Select Fleet Type</Label>
              <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Vehicle type">
                {VEHICLES.map((v) => {
                  const isSelected = formData.vehicleId === v.id;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      onClick={() => update("vehicleId", v.id)}
                      className={`p-4 border text-left transition-all ${
                        isSelected ? cx.amberBorder : "border-gray-100 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className={`text-[10px] font-black uppercase tracking-widest ${
                          isSelected ? cx.amber : "text-gray-400"
                        }`}>
                          {v.name}
                        </span>
                        {isSelected && (
                          <CheckCircle2 className={`w-3.5 h-3.5 ${cx.amber}`} aria-hidden="true" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-bold text-[#111827] mb-1">
                        <Users className="w-3 h-3" aria-hidden="true" />
                        {v.capacity}
                      </div>
                      <p className="text-[9px] text-gray-400 font-medium leading-tight">
                        Comfort: {v.comfort}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ══ CITY TAB ══ */}
            <TabsContent value="city" className="space-y-6 mt-0">
              {/* Service type selector */}
              <div className="grid grid-cols-3 gap-4" role="radiogroup" aria-label="Service type">
                {SERVICE_TYPES.map(({ id, label, icon: Ico }) => {
                  const isSelected = formData.serviceType === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      onClick={() => update("serviceType", id)}
                      className={`flex flex-col items-center justify-center p-4 border rounded-none transition-all ${
                        isSelected
                          ? "border-[#C97C2F] bg-[#C97C2F]/5 text-[#C97C2F]"
                          : "border-gray-100 text-gray-400 hover:border-gray-300"
                      }`}
                    >
                      <Ico className="w-5 h-5 mb-2" aria-hidden="true" />
                      <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
                    </button>
                  );
                })}
              </div>

              <OSMInput
                label="Pickup"
                icon={MapPin}
                showGPS
                onSelect={(c, n) => { update("pickup", n); onRouteUpdate("pickup", c); }}
              />

              {/* Extra waypoints */}
              {waypoints.map((_, i) => (
                <div key={i} className="flex gap-2">
                  <div className="flex-1">
                    <OSMInput
                      label={`Stop ${i + 1}`}
                      icon={MapPin}
                      onSelect={(_, n) => updateWaypoint(i, n)}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeWaypoint(i)}
                    aria-label={`Remove stop ${i + 1}`}
                    className="mt-8 w-14 h-14 border border-gray-200 flex items-center justify-center
                      text-gray-400 hover:text-red-400 hover:border-red-200 transition-colors flex-shrink-0"
                  >
                    <Minus className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              ))}

              {formData.serviceType !== "city_tour" && (
                <OSMInput
                  label="Destination"
                  icon={Navigation}
                  onSelect={(c, n) => { update("dropoff", n); onRouteUpdate("dropoff", c); }}
                />
              )}

              <button
                type="button"
                onClick={addWaypoint}
                className="w-full h-10 border border-dashed border-gray-200 flex items-center justify-center gap-2
                  text-[10px] font-black uppercase tracking-widest text-gray-400
                  hover:border-[#C97C2F] hover:text-[#C97C2F] transition-colors"
              >
                <Plus className="w-3.5 h-3.5" aria-hidden="true" /> Add Stop
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
                    <Label className={cx.label}>Flight Number</Label>
                    <div className="relative">
                      <IconSlot icon={Hash} />
                      <Input
                        value={formData.flightNumber}
                        onChange={(e) => update("flightNumber", e.target.value.toUpperCase())}
                        className={`${cx.input} pl-16`}
                        placeholder="E.G. RW 101…"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </TabsContent>

            {/* ══ HOURLY TAB ══ */}
            <TabsContent value="hourly" className="space-y-6 mt-0">
              <OSMInput
                label="Pickup"
                icon={MapPin}
                showGPS
                onSelect={(c, n) => { update("pickup", n); onRouteUpdate("pickup", c); }}
              />
              <div className="space-y-2">
                <Label className={cx.label}>Duration</Label>
                <Select onValueChange={(v) => update("hours", v)} defaultValue="3">
                  <SelectTrigger className="h-14 bg-white border border-gray-200 rounded-none text-xs font-bold uppercase">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-none border border-gray-100">
                    {HOURLY_OPTIONS.map((h) => (
                      <SelectItem key={h} value={String(h)} className="uppercase font-bold text-xs">
                        {h} Hours
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <CollapsibleSection title="Planned Activities (Optional)">
                <Textarea
                  value={formData.specialRequests}
                  onChange={(e) => update("specialRequests", e.target.value)}
                  className="min-h-[80px] bg-white border border-gray-200 rounded-none text-xs font-bold
                    text-[#111827] uppercase tracking-wide focus:ring-0 focus:border-[#C97C2F] resize-none"
                  placeholder="E.G. CITY SIGHTSEEING, SHOPPING STOPS, BUSINESS MEETINGS…"
                />
              </CollapsibleSection>
            </TabsContent>

            {/* ══ COUNTRY (TRIPS) TAB ══ */}
            <TabsContent value="country" className="space-y-6 mt-0">
              <OSMInput
                label="Pickup"
                icon={MapPin}
                showGPS
                onSelect={(c, n) => { update("pickup", n); onRouteUpdate("pickup", c); }}
              />

              {/* Destination search */}
              <div className="space-y-2 relative">
                <Label className={cx.label}>Destination</Label>
                <div className="relative">
                  <IconSlot icon={Search} />
                  <Input
                    value={tripSearch}
                    onChange={(e) => setTripSearch(e.target.value)}
                    onFocus={() => setShowTripDropdown(true)}
                    onBlur={() => setTimeout(() => setShowTripDropdown(false), 200)}
                    aria-label="Search Rwanda destinations"
                    className={`${cx.input} pl-16`}
                    placeholder="SEARCH RWANDA SITES…"
                  />
                </div>
                <AnimatePresence>
                  {showTripDropdown && (
                    <motion.ul
                      role="listbox"
                      aria-label="Available destinations"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute z-50 w-full bg-white border border-gray-100 shadow-xl mt-0 max-h-60 overflow-y-auto"
                    >
                      {filteredTrips.map((s) => (
                        <li
                          key={s.id}
                          role="option"
                          aria-selected={formData.selectedTripId === s.id}
                          onMouseDown={() => {
                            setTripSearch(s.title);
                            update("selectedTripId", s.id);
                            onRouteUpdate("dropoff", s.coords);
                            setShowTripDropdown(false);
                          }}
                          className="p-4 hover:bg-[#F5F2EA] cursor-pointer border-b border-gray-50 last:border-0"
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-xs font-bold uppercase text-[#111827]">{s.title}</p>
                              <p className={`text-[9px] font-bold ${cx.amber} uppercase`}>{s.region}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-[9px] font-black text-gray-400">from</p>
                              <p className="text-[10px] font-black text-[#111827]">
                                {s.price.toLocaleString()}
                                <span className={`${cx.amber} ml-1`}>RWF</span>
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

            {/* ══ DATE & TIME (shared across tabs) ══ */}
            <div className="pt-6 border-t border-gray-100">
              {renderDateTime("date", "time")}
            </div>

            {/* ══ PASSENGERS & LUGGAGE ══ */}
            <div className="grid grid-cols-2 gap-4">
              <Stepper
                label="Passengers"
                value={formData.passengers}
                min={1}
                max={passengerMax}
                onChange={(v) => update("passengers", v)}
              />
              <div className="space-y-2">
                <Label className={cx.label}>Luggage</Label>
                <Select value={formData.luggage} onValueChange={(v) => update("luggage", v as LuggageId)}>
                  <SelectTrigger className="h-14 bg-white border border-gray-200 rounded-none text-xs font-bold uppercase">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-none border border-gray-100">
                    {LUGGAGE_OPTIONS.map((l) => (
                      <SelectItem key={l.id} value={l.id} className="uppercase font-bold text-xs">
                        {l.icon} {l.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* ══ RETURN TRIP ══ */}
            <div className="space-y-4">
              <button
                type="button"
                role="switch"
                aria-checked={formData.returnTrip}
                onClick={() => update("returnTrip", !formData.returnTrip)}
                className={`w-full flex items-center justify-between px-5 h-14 border transition-all ${
                  formData.returnTrip
                    ? cx.amberBorder
                    : "border-gray-100 bg-gray-50 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Repeat2
                    className={`w-4 h-4 ${formData.returnTrip ? cx.amber : "text-gray-400"}`}
                    aria-hidden="true"
                  />
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-600">
                    Return Trip
                  </span>
                </div>
                {/* Visual toggle */}
                <div
                  aria-hidden="true"
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
                    className="overflow-hidden"
                  >
                    {renderDateTime("returnDate", "returnTime")}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ══ ACCOMMODATION ══ */}
            <CollapsibleSection title="Accommodation Details">
              <div className="space-y-2">
                <Label className={cx.label}>Hotel / Lodge Name</Label>
                <div className="relative">
                  <IconSlot icon={Hotel} />
                  <Input
                    value={formData.hotelName}
                    onChange={(e) => update("hotelName", e.target.value)}
                    className={`${cx.input} pl-16`}
                    placeholder="KIGALI MARRIOTT, BISATE LODGE…"
                  />
                </div>
              </div>
            </CollapsibleSection>

            {/* ══ CONTACT ══ */}
            <CollapsibleSection title="Your Contact Details" defaultOpen>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className={cx.label}>Full Name</Label>
                  <div className="relative">
                    <IconSlot icon={User} />
                    <Input
                      value={formData.contactName}
                      onChange={(e) => update("contactName", e.target.value)}
                      className={`${cx.input} pl-16`}
                      placeholder="YOUR NAME…"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className={cx.label}>Phone / WhatsApp</Label>
                  <div className="relative">
                    <IconSlot icon={Phone} />
                    <Input
                      type="tel"
                      value={formData.contactPhone}
                      onChange={(e) => update("contactPhone", e.target.value)}
                      className={`${cx.input} pl-16`}
                      placeholder="+250 78X XXX XXX…"
                    />
                  </div>
                </div>
              </div>
            </CollapsibleSection>

            {/* ══ SPECIAL REQUESTS ══ */}
            <CollapsibleSection title="Special Requests / Notes">
              <div className="space-y-2">
                <div className="relative">
                  <div className="absolute left-0 top-0 h-14 w-12 flex items-center justify-center bg-gray-50 border-r border-gray-100 z-10">
                    <MessageSquare className={`w-4 h-4 ${cx.amber}`} aria-hidden="true" />
                  </div>
                  <Textarea
                    value={formData.specialRequests}
                    onChange={(e) => update("specialRequests", e.target.value)}
                    className="pl-16 pt-4 min-h-[100px] bg-white border border-gray-200 rounded-none
                      text-xs font-bold text-[#111827] uppercase tracking-wide
                      focus:ring-0 focus:border-[#C97C2F] resize-none"
                    placeholder="CHILD SEAT, WHEELCHAIR ACCESS, BOTTLED WATER, SPECIFIC ROUTE, VIP PRIVACY…"
                  />
                </div>
              </div>
            </CollapsibleSection>

          </div>{/* end scrollable body */}

          {/* ── Footer: price + CTA ── */}
          <div className="p-10 border-t border-gray-100 bg-[#F9F9F9] flex-shrink-0">
            {/* Price breakdown */}
            <div className="mb-4 space-y-1">
              {formData.returnTrip && (
                <div className="flex justify-between text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                  <span>Return trip included</span>
                  <span className={cx.amber}>×2</span>
                </div>
              )}
              {waypoints.filter(Boolean).length > 0 && (
                <div className="flex justify-between text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                  <span>{waypoints.filter(Boolean).length} extra stop(s)</span>
                  <span className={cx.amber}>
                    +{(waypoints.filter(Boolean).length * PRICING.WAYPOINT_SURCHARGE).toLocaleString()} RWF
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
                <span className={`text-sm ${cx.amber}`}>RWF</span>
              </span>
            </div>

            <Button
              onClick={handleWhatsApp}
              className="w-full h-14 bg-[#111827] hover:bg-[#C97C2F] text-white font-black
                uppercase tracking-widest text-xs rounded-none shadow-lg transition-colors duration-300"
            >
              Confirm &amp; Book via WhatsApp
              <ArrowRight className="ml-3 w-4 h-4" aria-hidden="true" />
            </Button>
          </div>

        </Tabs>
      </div>
    </div>
  );
}