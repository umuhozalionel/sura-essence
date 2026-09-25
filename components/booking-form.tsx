"use client";

import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
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
  ArrowRight,
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
import { useFormatter, useTranslations } from "next-intl";
import { getIcon } from "@/lib/icons";
import {
  DESTINATIONS,
  HIRE_HOUR_OPTIONS,
  VEHICLES,
  destinationPrice,
  getVehicle,
  priceNoteKind,
  quote,
  routeDistanceKm,
  serviceDays,
  trips,
  type CityRideMode,
  type PriceNoteKind,
  type Quote,
  type Trip,
} from "@/lib/pricing";

/* ─────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────── */

/** Vehicle and destination ids come from lib/pricing.ts; the message files only name them. */
type VehicleId = string;
type LuggageId = string;
type ServiceType = string;
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

/** A destination from lib/pricing.ts, with its name from the messages. */
interface RwandaSite {
  id: string;
  coords: [number, number]; // [lat, lon]
  title: string;
  region: string;
}

/** Words for a vehicle class (messages: BookingForm.vehicles.<id>). */
interface VehicleLabel {
  name: string;
  models: string;
  comfort: string;
}

/** Where the customer picked a place, for distance-based fuel pricing. */
type Coords = [number, number];
interface Waypoint {
  name: string;
  coords: Coords | null;
}

interface LuggageOption {
  id: LuggageId;
  /** An emoji rendered next to the label, not a lucide icon name. */
  icon: string;
  label: string;
}

interface ServiceTypeOption {
  id: ServiceType;
  icon: string;
  label: string;
}

interface TabOption {
  id: TabId;
  label: string;
}

interface FormData {
  // Routing
  pickup: string;
  dropoff: string;
  serviceType: ServiceType;
  /** City ride (A to B): Cab or Private. */
  cityRideMode: CityRideMode;
  /** Hourly hire, trips and tours: with a driver or self-drive. */
  withDriver: boolean;
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

const WHATSAPP_NUMBER = "250788564000";
const SCENIC_BG = "/scenic/aerial-view.jpg";
const OSM_BIAS = { lat: -1.9441, lon: 30.0619 } satisfies LatLon; // Kigali centre

/**
 * Every price comes from lib/pricing.ts — vehicle classes, destinations and the
 * formula all live there. The message files (namespace "BookingForm") only
 * hold the words: vehicle and destination names, luggage options, tab labels.
 */

/* ─────────────────────────────────────────────────────────
   CUSTOM HOOKS
───────────────────────────────────────────────────────── */

/**
 * Debounced geocoding search against the Photon/OSM API.
 * Returns normalised suggestions, a loading flag, and any error message.
 */
function useOSMSearch(query: string, debounceMs = 500) {
  const te = useTranslations("BookingForm.errors");
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
        setError(te("searchUnavailable"));
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, debounceMs);

    return () => clearTimeout(timerId);
  }, [query, debounceMs, te]);

  return { suggestions, isLoading, error };
}

/**
 * Browser Geolocation + Photon reverse-geocoding.
 * Returns a `locate` callback that calls `onSuccess` with coords and name,
 * plus a loading flag and any user-visible error.
 */
function useGeolocation() {
  const t = useTranslations("BookingForm");
  const te = useTranslations("BookingForm.errors");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]         = useState<string | null>(null);

  const locate = useCallback(
    (onSuccess: (coords: [number, number], name: string) => void) => {
      if (!navigator.geolocation) {
        setError(te("geolocationUnsupported"));
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
            const name = [f.properties.name ?? t("currentLocation"), f.properties.city]
              .filter(Boolean)
              .join(", ");
            onSuccess([latitude, longitude], name);
          } catch {
            setError(te("reverseFailed"));
          } finally {
            setIsLoading(false);
          }
        },
        () => {
          setError(te("locationDenied"));
          setIsLoading(false);
        }
      );
    },
    [t, te]
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
    cityRideMode:    "cab",
    withDriver:      true,
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

/** Which choice the current service offers: Cab/Private, With driver/Self-drive, or neither. */
type TripChoice = "rideMode" | "driver" | null;

function tripChoiceFor(activeTab: TabId, serviceType: ServiceType): TripChoice {
  if (activeTab === "city") {
    if (serviceType === "inter_city") return "rideMode"; // City ride, A to B
    if (serviceType === "city_tour") return "driver";    // Full-day tour
    return null;                                         // Airport: flat rate, driver included
  }
  return "driver"; // Hourly hire and country trips
}

/**
 * The quote for the current form, from lib/pricing.ts.
 * null until there's enough to price (e.g. no destination picked yet).
 */
function useTripQuote(
  activeTab: TabId,
  formData:  FormData,
  pickup:    Coords | null,
  stops:     Waypoint[],
  dropoff:   Coords | null
): Quote | null {
  return useMemo(() => {
    const { returnTrip, withDriver } = formData;
    const days = serviceDays(formData.date, formData.returnDate, returnTrip);
    let trip: Trip | null = null;

    if (activeTab === "city") {
      if (formData.serviceType === "airport") {
        trip = trips.airport({ returnTrip });
      } else if (formData.serviceType === "city_tour") {
        trip = trips.destination("kigali", { withDriver, returnTrip, days });
      } else {
        // Real route distance once both ends are picked; a typical distance until then.
        const route =
          pickup && dropoff
            ? routeDistanceKm([pickup, ...stops.flatMap((w) => (w.coords ? [w.coords] : [])), dropoff])
            : null;
        trip = trips.cityRide(formData.cityRideMode, route, { returnTrip });
      }
    } else if (activeTab === "hourly") {
      trip = trips.hourly(parseInt(formData.hours, 10), { withDriver });
    } else if (activeTab === "country" && formData.selectedTripId) {
      trip = trips.destination(formData.selectedTripId, { withDriver, returnTrip, days });
    }

    return trip ? quote(trip, formData.vehicleId) : null;
  }, [activeTab, formData, pickup, stops, dropoff]);
}

/* ─────────────────────────────────────────────────────────
   SHARED STYLE TOKENS
   Centralising repeated Tailwind fragments prevents drift.
───────────────────────────────────────────────────────── */
const cx = {
  label:     "text-[10px] font-bold text-gray-400 uppercase tracking-widest",
  input:     "h-14 bg-white border border-gray-200 rounded-none text-xs font-bold text-[#0A1128] uppercase tracking-wider focus:ring-0 focus:border-[#125740] transition-all",
  iconSlot:  "absolute left-0 top-0 bottom-0 w-12 flex items-center justify-center bg-gray-50 border-r border-gray-100 z-10",
  amber:     "text-[#125740]",
  amberBorder: "border-[#125740] bg-[#125740]/5",
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
  const t = useTranslations("BookingForm");
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
            showDropdown ? "border-l-4 border-[#125740]" : ""
          }`}
          placeholder={t("searchPlaceholder", { label })}
        />
        {showGPS && (
          <button
            type="button"
            onClick={handleGPS}
            aria-label={t("useLocation")}
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
            aria-label={t("suggestionsLabel", { label })}
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
                className={`p-4 hover:bg-[#F9F8F6] cursor-pointer text-xs font-bold uppercase tracking-wider
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
  const t = useTranslations("BookingForm");
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
          aria-label={t("decrease", { label })}
          className="w-14 h-full flex items-center justify-center border-r border-gray-100
            hover:bg-gray-50 text-gray-400 hover:text-[#125740] transition-colors
            disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <output
          htmlFor={`${decrementId} ${incrementId}`}
          className="flex-1 text-center text-sm font-black text-[#0A1128] tracking-widest"
        >
          {value}
        </output>
        <button
          type="button"
          id={incrementId}
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          aria-label={t("increase", { label })}
          className="w-14 h-full flex items-center justify-center border-l border-gray-100
            hover:bg-gray-50 text-gray-400 hover:text-[#125740] transition-colors
            disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

/* ── ChoiceToggle (Cab / Private, With driver / Self-drive) ── */

interface ChoiceOption<T extends string> {
  id:        T;
  label:     string;
  hint:      string;
  disabled?: boolean;
}

interface ChoiceToggleProps<T extends string> {
  label:    string;
  value:    T;
  options:  ChoiceOption<T>[];
  onChange: (value: T) => void;
  /** Shown under the toggle, e.g. why an option is switched off. */
  note?:    string | null;
}

function ChoiceToggle<T extends string>({ label, value, options, onChange, note }: ChoiceToggleProps<T>) {
  const labelId = React.useId();
  return (
    <div className="space-y-2">
      <span id={labelId} className={`block ${cx.label}`}>{label}</span>
      <div
        role="radiogroup"
        aria-labelledby={labelId}
        className="grid grid-cols-2 gap-1 p-1 bg-gray-50/80 border border-gray-100"
      >
        {options.map((o) => {
          const selected = o.id === value;
          return (
            <button
              key={o.id}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={o.disabled}
              onClick={() => onChange(o.id)}
              className={`flex flex-col items-center justify-center gap-0.5 px-2 py-2.5 border transition-all
                disabled:opacity-40 disabled:cursor-not-allowed ${
                selected
                  ? "bg-white border-[#125740] text-[#125740] shadow-sm"
                  : "border-transparent text-gray-500 hover:text-[#0A1128] disabled:hover:text-gray-500"
              }`}
            >
              <span className="text-[10px] font-black uppercase tracking-widest">{o.label}</span>
              <span className={`text-[10px] font-semibold ${selected ? "text-[#125740]/80" : "text-gray-400"}`}>
                {o.hint}
              </span>
            </button>
          );
        })}
      </div>
      {note && <p className="text-[10px] font-semibold text-gray-500">{note}</p>}
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
  const t = useTranslations("BookingForm");
  const tw = useTranslations("BookingForm.whatsapp");
  const format = useFormatter();

  const tabs             = t.raw("tabs") as TabOption[];
  const vehicleLabels    = t.raw("vehicles") as Record<string, VehicleLabel>;
  const serviceTypes     = t.raw("serviceTypes") as ServiceTypeOption[];
  const luggageOptions   = t.raw("luggageOptions") as LuggageOption[];
  const siteLabels       = t.raw("sites") as Record<string, { title: string; region: string }>;

  // Destinations (distance, zone, coords) come from lib/pricing.ts; names from the messages.
  const sites: RwandaSite[] = useMemo(
    () =>
      DESTINATIONS.filter((d) => siteLabels[d.id]).map((d) => ({
        id: d.id,
        coords: d.coords,
        title: siteLabels[d.id].title,
        region: siteLabels[d.id].region,
      })),
    [siteLabels]
  );

  const [activeTab, setActiveTab]           = useState<TabId>("city");
  const [tripSearch, setTripSearch]         = useState("");
  const [showTripDropdown, setShowTripDropdown] = useState(false);
  const [waypoints, setWaypoints]           = useState<Waypoint[]>([]);
  const [pickupCoords, setPickupCoords]     = useState<Coords | null>(null);
  const [dropoffCoords, setDropoffCoords]   = useState<Coords | null>(null);

  const { formData, update } = useBookingForm();

  const selectedVehicle = getVehicle(formData.vehicleId);
  const vehicleName = (id: string) => vehicleLabels[id]?.name ?? id;

  const filteredTrips = useMemo(
    () =>
      sites.filter((s) =>
        s.title.toLowerCase().includes(tripSearch.toLowerCase())
      ),
    [tripSearch, sites]
  );

  const tripQuote = useTripQuote(activeTab, formData, pickupCoords, waypoints, dropoffCoords);
  const total = tripQuote?.total ?? null;

  /* ── Cab / Private and With driver / Self-drive ──── */
  const tripChoice = tripChoiceFor(activeTab, formData.serviceType);
  // Coach has no cab fares; Premium SUV, Luxury SUV and Coach are with-driver only.
  // The customer's own choice is kept and comes back if they switch to a class that offers it.
  const cabAllowed       = selectedVehicle.cab !== null;
  const selfDriveAllowed = selectedVehicle.selfDrive;
  const rideMode: CityRideMode = cabAllowed ? formData.cityRideMode : "private";
  const withDriver       = selfDriveAllowed ? formData.withDriver : true;

  // The note under the total says what the price covers. It follows the quote
  // (Airport/Cab = fixed fare); before a destination is picked, the driver choice.
  const noteKind: PriceNoteKind = tripQuote
    ? priceNoteKind(tripQuote)
    : withDriver ? "withDriver" : "selfDrive";
  const priceNote = t(`priceNotes.${noteKind}`);

  const chooseVehicle = (id: string) => {
    const v = getVehicle(id);
    update("vehicleId", v.id);
    // Keep the passenger count within what the new car can take.
    if (formData.passengers > v.maxPassengers) update("passengers", v.maxPassengers);
  };

  const rideModeToggle = (
    <ChoiceToggle<CityRideMode>
      label={t("rideMode.label")}
      value={rideMode}
      onChange={(mode) => update("cityRideMode", mode)}
      options={[
        { id: "cab",     label: t("rideMode.cab"),     hint: t("rideMode.cabHint"), disabled: !cabAllowed },
        { id: "private", label: t("rideMode.private"), hint: t("rideMode.privateHint") },
      ]}
      note={cabAllowed ? null : t("rideMode.cabUnavailable", { vehicle: vehicleName(selectedVehicle.id) })}
    />
  );

  const driverToggle = (
    <ChoiceToggle<"with" | "self">
      label={t("driverMode.label")}
      value={withDriver ? "with" : "self"}
      onChange={(choice) => update("withDriver", choice === "with")}
      options={[
        { id: "with", label: t("driverMode.withDriver"), hint: t("driverMode.withDriverHint") },
        { id: "self", label: t("driverMode.selfDrive"),  hint: t("driverMode.selfDriveHint"), disabled: !selfDriveAllowed },
      ]}
      note={selfDriveAllowed ? null : t("driverMode.chauffeurOnly", { vehicle: vehicleName(selectedVehicle.id) })}
    />
  );

  /* ── WhatsApp message builder ─────────────────────── */
  const filledStops = waypoints.filter((w) => w.name);

  const handleWhatsApp = () => {
    const selectedTrip = sites.find((s) => s.id === formData.selectedTripId);
    const dash = tw("empty");
    const dropoffLabel = formData.dropoff || selectedTrip?.title || dash;
    const serviceLabel =
      serviceTypes.find((x) => x.id === formData.serviceType)?.label ?? formData.serviceType;

    const service =
      activeTab === "city"   ? tw("serviceCity", { type: serviceLabel }) :
      activeTab === "hourly" ? tw("serviceHourly", { hours: formData.hours }) :
      tw("serviceCountry", { trip: selectedTrip?.title ?? formData.selectedTripId });

    const lines: (string | null)[] = [
      tw("header"),
      "",
      `${tw("service")}: ${service}`,
      `${tw("vehicle")}: ${vehicleName(selectedVehicle.id)}`,
      tripChoice === "rideMode"
        ? `${tw("rideType")}: ${t(`rideMode.${rideMode}`)}`
        : tripChoice === "driver"
          ? `${tw("driver")}: ${withDriver ? t("driverMode.withDriver") : t("driverMode.selfDrive")}`
          : null,
      `${tw("passengers")}: ${formData.passengers}`,
      `${tw("luggage")}: ${luggageOptions.find((l) => l.id === formData.luggage)?.label ?? dash}`,
      "",
      `${tw("pickup")}: ${formData.pickup || dash}`,
      filledStops.length
        ? `${tw("stops")}: ${filledStops.map((w) => w.name).join(" → ")}`
        : null,
      `${tw("dropoff")}: ${dropoffLabel}`,
      formData.hotelName ? `${tw("hotel")}: ${formData.hotelName}` : null,
      "",
      `${tw("date")}: ${formData.date || dash}  ${tw("time")}: ${formData.time || dash}`,
      formData.serviceType === "airport" && formData.flightNumber
        ? `${tw("flight")}: ${formData.flightNumber}`
        : null,
      formData.returnTrip
        ? `${tw("returnTrip")}: ${formData.returnDate || dash} @ ${formData.returnTime || dash}`
        : null,
      "",
      formData.contactName  ? `${tw("name")}: ${formData.contactName}`   : null,
      formData.contactPhone ? `${tw("phone")}: ${formData.contactPhone}` : null,
      formData.specialRequests ? `${tw("notes")}: ${formData.specialRequests}` : null,
      "",
      `${tw("total")}: ${total === null ? dash : `${format.number(total)} ${t("currency")}`}`,
      priceNote,
    ];

    const message = lines.filter((l): l is string => l !== null).join("\n");
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, "_blank");
  };

  /* ── Waypoint helpers ─────────────────────────────── */
  const addWaypoint    = () => setWaypoints((prev) => [...prev, { name: "", coords: null }]);
  const removeWaypoint = (index: number) =>
    setWaypoints((prev) => prev.filter((_, j) => j !== index));
  const updateWaypoint = (index: number, name: string, coords: Coords) =>
    setWaypoints((prev) => prev.map((w, j) => (j === index ? { name, coords } : w)));

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
        <Label className={cx.label}>{t("date")}</Label>
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
        <Label className={cx.label}>{t("time")}</Label>
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
        className="absolute inset-0 bg-gradient-to-br from-[#0A1128]/70 via-[#0A1128]/40 to-[#125740]/20 z-0"
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
              {tabs.map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="rounded-none h-10 text-[10px] font-black uppercase tracking-widest
                    data-[state=active]:bg-white data-[state=active]:text-[#125740]"
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {/* ── Scrollable body ── */}
          <div className="p-10 flex-1 space-y-8 overflow-y-auto custom-scrollbar min-h-0">

            {/* ══ VEHICLE SELECTOR ══ */}
            <div className="space-y-3">
              <Label className={cx.label}>{t("fleetLabel")}</Label>
              <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label={t("fleetGroupLabel")}>
                {VEHICLES.map((v) => {
                  const isSelected = formData.vehicleId === v.id;
                  const label = vehicleLabels[v.id];
                  return (
                    <button
                      key={v.id}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      onClick={() => chooseVehicle(v.id)}
                      className={`p-4 border text-left transition-all ${
                        isSelected ? cx.amberBorder : "border-gray-100 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className={`text-[10px] font-black uppercase tracking-widest ${
                          isSelected ? cx.amber : "text-gray-400"
                        }`}>
                          {label?.name ?? v.id}
                        </span>
                        {isSelected && (
                          <CheckCircle2 className={`w-3.5 h-3.5 ${cx.amber}`} aria-hidden="true" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-bold text-[#0A1128] mb-1">
                        <Users className="w-3 h-3" aria-hidden="true" />
                        {t("seats", { count: v.maxPassengers })}
                      </div>
                      <p className="text-[9px] text-gray-400 font-medium leading-tight">
                        {label?.models}
                      </p>
                      <p className="text-[9px] text-gray-400 font-medium leading-tight">
                        {t("comfort", { level: label?.comfort ?? "" })}
                      </p>
                      {!v.selfDrive && (
                        <p className={`mt-1.5 text-[8px] font-black uppercase tracking-widest ${cx.amber}`}>
                          {t("chauffeurOnlyBadge")}
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ══ CITY TAB ══ */}
            <TabsContent value="city" className="space-y-6 mt-0">
              {/* Service type selector */}
              <div className="grid grid-cols-3 gap-4" role="radiogroup" aria-label={t("serviceGroupLabel")}>
                {serviceTypes.map(({ id, label, icon }) => {
                  const Ico = getIcon(icon);
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
                          ? "border-[#125740] bg-[#125740]/5 text-[#125740]"
                          : "border-gray-100 text-gray-400 hover:border-gray-300"
                      }`}
                    >
                      <Ico className="w-5 h-5 mb-2" aria-hidden="true" />
                      <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
                    </button>
                  );
                })}
              </div>

              {/* A to B: Cab or Private · Tour: with a driver or self-drive */}
              {tripChoice === "rideMode" && rideModeToggle}
              {tripChoice === "driver" && driverToggle}

              <OSMInput
                label={t("pickup")}
                icon={MapPin}
                showGPS
                onSelect={(c, n) => { update("pickup", n); setPickupCoords(c); onRouteUpdate("pickup", c); }}
              />

              {/* Extra waypoints */}
              {waypoints.map((_, i) => (
                <div key={i} className="flex gap-2">
                  <div className="flex-1">
                    <OSMInput
                      label={t("stop", { number: i + 1 })}
                      icon={MapPin}
                      onSelect={(c, n) => updateWaypoint(i, n, c)}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeWaypoint(i)}
                    aria-label={t("removeStop", { number: i + 1 })}
                    className="mt-8 w-14 h-14 border border-gray-200 flex items-center justify-center
                      text-gray-400 hover:text-red-400 hover:border-red-200 transition-colors flex-shrink-0"
                  >
                    <Minus className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              ))}

              {formData.serviceType !== "city_tour" && (
                <OSMInput
                  label={t("destination")}
                  icon={Navigation}
                  onSelect={(c, n) => { update("dropoff", n); setDropoffCoords(c); onRouteUpdate("dropoff", c); }}
                />
              )}

              <button
                type="button"
                onClick={addWaypoint}
                className="w-full h-10 border border-dashed border-gray-200 flex items-center justify-center gap-2
                  text-[10px] font-black uppercase tracking-widest text-gray-400
                  hover:border-[#125740] hover:text-[#125740] transition-colors"
              >
                <Plus className="w-3.5 h-3.5" aria-hidden="true" /> {t("addStop")}
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
                    <Label className={cx.label}>{t("flightNumber")}</Label>
                    <div className="relative">
                      <IconSlot icon={Hash} />
                      <Input
                        value={formData.flightNumber}
                        onChange={(e) => update("flightNumber", e.target.value.toUpperCase())}
                        className={`${cx.input} pl-16`}
                        placeholder={t("flightPlaceholder")}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </TabsContent>

            {/* ══ HOURLY TAB ══ */}
            <TabsContent value="hourly" className="space-y-6 mt-0">
              <OSMInput
                label={t("pickup")}
                icon={MapPin}
                showGPS
                onSelect={(c, n) => { update("pickup", n); setPickupCoords(c); onRouteUpdate("pickup", c); }}
              />
              {driverToggle}
              <div className="space-y-2">
                <Label className={cx.label}>{t("duration")}</Label>
                <Select onValueChange={(v) => update("hours", v)} defaultValue="3">
                  <SelectTrigger className="h-14 bg-white border border-gray-200 rounded-none text-xs font-bold uppercase">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-none border border-gray-100">
                    {HIRE_HOUR_OPTIONS.map((h) => (
                      <SelectItem key={h} value={String(h)} className="uppercase font-bold text-xs">
                        {t("hours", { count: h })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <CollapsibleSection title={t("plannedActivities")}>
                <Textarea
                  value={formData.specialRequests}
                  onChange={(e) => update("specialRequests", e.target.value)}
                  className="min-h-[80px] bg-white border border-gray-200 rounded-none text-xs font-bold
                    text-[#0A1128] uppercase tracking-wide focus:ring-0 focus:border-[#125740] resize-none"
                  placeholder={t("activitiesPlaceholder")}
                />
              </CollapsibleSection>
            </TabsContent>

            {/* ══ COUNTRY (TRIPS) TAB ══ */}
            <TabsContent value="country" className="space-y-6 mt-0">
              <OSMInput
                label={t("pickup")}
                icon={MapPin}
                showGPS
                onSelect={(c, n) => { update("pickup", n); setPickupCoords(c); onRouteUpdate("pickup", c); }}
              />

              {/* Destination search */}
              <div className="space-y-2 relative">
                <Label className={cx.label}>{t("destination")}</Label>
                <div className="relative">
                  <IconSlot icon={Search} />
                  <Input
                    value={tripSearch}
                    onChange={(e) => setTripSearch(e.target.value)}
                    onFocus={() => setShowTripDropdown(true)}
                    onBlur={() => setTimeout(() => setShowTripDropdown(false), 200)}
                    aria-label={t("tripSearchLabel")}
                    className={`${cx.input} pl-16`}
                    placeholder={t("tripSearchPlaceholder")}
                  />
                </div>
                <AnimatePresence>
                  {showTripDropdown && (
                    <motion.ul
                      role="listbox"
                      aria-label={t("tripListLabel")}
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
                          className="p-4 hover:bg-[#F9F8F6] cursor-pointer border-b border-gray-50 last:border-0"
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-xs font-bold uppercase text-[#0A1128]">{s.title}</p>
                              <p className={`text-[9px] font-bold ${cx.amber} uppercase`}>{s.region}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-[9px] font-black text-gray-400">{t("from")}</p>
                              <p className="text-[10px] font-black text-[#0A1128]">
                                {format.number(destinationPrice(s.id, formData.vehicleId, { withDriver }) ?? 0)}
                                <span className={`${cx.amber} ml-1`}>{t("currency")}</span>
                              </p>
                            </div>
                          </div>
                        </li>
                      ))}
                    </motion.ul>
                  )}
                </AnimatePresence>
              </div>

              {driverToggle}
            </TabsContent>

            {/* ══ DATE & TIME (shared across tabs) ══ */}
            <div className="pt-6 border-t border-gray-100">
              {renderDateTime("date", "time")}
            </div>

            {/* ══ PASSENGERS & LUGGAGE ══ */}
            <div className="grid grid-cols-2 gap-4">
              <Stepper
                label={t("passengers")}
                value={formData.passengers}
                min={1}
                max={passengerMax}
                onChange={(v) => update("passengers", v)}
              />
              <div className="space-y-2">
                <Label className={cx.label}>{t("luggage")}</Label>
                <Select value={formData.luggage} onValueChange={(v) => update("luggage", v as LuggageId)}>
                  <SelectTrigger className="h-14 bg-white border border-gray-200 rounded-none text-xs font-bold uppercase">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-none border border-gray-100">
                    {luggageOptions.map((l) => (
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
                    {t("returnTrip")}
                  </span>
                </div>
                {/* Visual toggle */}
                <div
                  aria-hidden="true"
                  className={`w-10 h-5 rounded-full relative transition-colors ${
                    formData.returnTrip ? "bg-[#125740]" : "bg-gray-200"
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
            <CollapsibleSection title={t("accommodation")}>
              <div className="space-y-2">
                <Label className={cx.label}>{t("hotelLabel")}</Label>
                <div className="relative">
                  <IconSlot icon={Hotel} />
                  <Input
                    value={formData.hotelName}
                    onChange={(e) => update("hotelName", e.target.value)}
                    className={`${cx.input} pl-16`}
                    placeholder={t("hotelPlaceholder")}
                  />
                </div>
              </div>
            </CollapsibleSection>

            {/* ══ CONTACT ══ */}
            <CollapsibleSection title={t("contactSection")} defaultOpen>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className={cx.label}>{t("fullName")}</Label>
                  <div className="relative">
                    <IconSlot icon={User} />
                    <Input
                      value={formData.contactName}
                      onChange={(e) => update("contactName", e.target.value)}
                      className={`${cx.input} pl-16`}
                      placeholder={t("namePlaceholder")}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className={cx.label}>{t("phone")}</Label>
                  <div className="relative">
                    <IconSlot icon={Phone} />
                    <Input
                      type="tel"
                      value={formData.contactPhone}
                      onChange={(e) => update("contactPhone", e.target.value)}
                      className={`${cx.input} pl-16`}
                      placeholder={t("phonePlaceholder")}
                    />
                  </div>
                </div>
              </div>
            </CollapsibleSection>

            {/* ══ SPECIAL REQUESTS ══ */}
            <CollapsibleSection title={t("notesSection")}>
              <div className="space-y-2">
                <div className="relative">
                  <div className="absolute left-0 top-0 h-14 w-12 flex items-center justify-center bg-gray-50 border-r border-gray-100 z-10">
                    <MessageSquare className={`w-4 h-4 ${cx.amber}`} aria-hidden="true" />
                  </div>
                  <Textarea
                    value={formData.specialRequests}
                    onChange={(e) => update("specialRequests", e.target.value)}
                    className="pl-16 pt-4 min-h-[100px] bg-white border border-gray-200 rounded-none
                      text-xs font-bold text-[#0A1128] uppercase tracking-wide
                      focus:ring-0 focus:border-[#125740] resize-none"
                    placeholder={t("notesPlaceholder")}
                  />
                </div>
              </div>
            </CollapsibleSection>

          </div>{/* end scrollable body */}

          {/* ── Footer: price + CTA ── */}
          <div className="p-10 border-t border-gray-100 bg-[#F9F8F6] flex-shrink-0">
            {/* Grand total only — the cost make-up is never shown to customers */}
            <div className="flex justify-between items-end">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                {t("totalEstimate")}
              </span>
              {total === null ? (
                <span className="text-[11px] font-bold text-gray-400 text-right max-w-[60%]">
                  {t("chooseDestination")}
                </span>
              ) : (
                <span className="text-3xl font-black text-[#0A1128] tracking-tighter">
                  {format.number(total)}{" "}
                  <span className={`text-sm ${cx.amber}`}>{t("currency")}</span>
                </span>
              )}
            </div>
            <p className="mt-2 mb-5 text-[11px] font-semibold text-gray-500 text-right">{priceNote}</p>

            <Button
              onClick={handleWhatsApp}
              className="w-full h-14 bg-[#0A1128] hover:bg-[#125740] text-white font-black
                uppercase tracking-widest text-xs rounded-none shadow-lg transition-colors duration-300"
            >
              {t("submit")}
              <ArrowRight className="ml-3 w-4 h-4" aria-hidden="true" />
            </Button>
          </div>

        </Tabs>
      </div>
    </div>
  );
}