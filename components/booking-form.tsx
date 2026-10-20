"use client";

import React, {
  Suspense,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { useSearchParams } from "next/navigation";
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
  ArrowLeft,
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
  Map as MapIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useFormatter, useTranslations } from "next-intl";
import { getIcon } from "@/lib/icons";
import { optimizedBg } from "@/lib/optimized-bg";
import {
  DESTINATIONS,
  HIRE_HOUR_OPTIONS,
  VEHICLES,
  destinationPrice,
  getVehicle,
  priceNoteKind,
  type CityRideMode,
  type PriceNoteKind,
  type Quote,
} from "@/lib/pricing";
import {
  quoteRequest,
  type BookingRequest,
  type Place,
  type PricingFields,
  type Schedule,
} from "@/lib/booking-request";

/* ─────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────── */

type TabId = "city" | "hourly" | "country";
/** What the City tab offers. Airport and A to B are transfers; Tour has its own shape. */
type CityServiceId = "airport" | "inter_city" | "city_tour";
type TransferServiceId = Exclude<CityServiceId, "city_tour">;

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

/** A tour venue from the Tours page (messages: Tours.collections[].venues[]). */
interface TourVenue {
  id: string;
  title: string;
  location: string;
}

/** Words for a vehicle class (messages: BookingForm.vehicles.<id>). */
interface VehicleLabel {
  name: string;
  models: string;
  comfort: string;
}

type Coords = [number, number];

/** An extra stop. The id keeps each stop's input in place when another is removed. */
interface Stop extends Place {
  id: number;
}

interface LuggageOption {
  id: string;
  /** An emoji rendered next to the label, not a lucide icon name. */
  icon: string;
  label: string;
}

interface ServiceTypeOption {
  id: CityServiceId;
  icon: string;
  label: string;
}

interface TabOption {
  id: TabId;
  label: string;
}

/* ── Form state ───────────────────────────────────────────
   Each service has its own state shape, so a field that one service doesn't
   use (luggage on an hourly hire, a drop-off on a tour) can't be filled in,
   left behind or sent. Switching tabs starts the new service from scratch.
   Only the car (step 1) and the customer's details (step 3) are kept, as they
   don't depend on the service.
───────────────────────────────────────────────────────── */

/** Step 1: the car and how many travel in it. */
interface VehicleChoice {
  vehicleId: string;
  passengers: number;
}

/** Step 3: about the customer, not the trip. */
interface CustomerDetails {
  name: string;
  phone: string;
  hotel: string;
  /** Special requests. On an hourly hire this is also where planned activities go. */
  notes: string;
}

/** City → Airport or A to B: a ride from one place to another. */
interface TransferState extends Schedule {
  kind: "transfer";
  serviceType: TransferServiceId;
  /** A to B only: Cab or Private. */
  rideMode: CityRideMode;
  pickup: Place;
  dropoff: Place;
  stops: Stop[];
  /** Airport only. */
  flightNumber: string;
  luggage: string;
  returnTrip: boolean;
  returnDate: string;
  returnTime: string;
}

/** City → Tour: a day (or several) around Kigali. No luggage, no return leg. */
interface TourState extends Schedule {
  kind: "tour";
  /** A Tours venue id, when the customer came from a tour page; "" otherwise. */
  tourId: string;
  withDriver: boolean;
  pickup: Place;
  days: number;
}

/** Hourly: the car (and driver) for a few hours. No luggage, no return leg. */
interface HourlyState extends Schedule {
  kind: "hourly";
  hours: string;
  withDriver: boolean;
  pickup: Place;
}

/** Trips: a drive to a destination elsewhere in Rwanda. */
interface TripState extends Schedule {
  kind: "trip";
  destinationId: string;
  withDriver: boolean;
  pickup: Place;
  luggage: string;
  /** The car brings the customer back (priced both ways). */
  returnTrip: boolean;
  days: number;
}

type ServiceState = TransferState | TourState | HourlyState | TripState;
type ServiceKind = ServiceState["kind"];
type ServiceOf<K extends ServiceKind> = Extract<ServiceState, { kind: K }>;

interface BookingFormProps {
  /** Puts a pickup or drop-off on the map; null takes it off. */
  onRouteUpdate: (type: "pickup" | "dropoff", coords: Coords | null) => void;
}

/* ─────────────────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────── */

const WHATSAPP_NUMBER = "250788564000";
const SCENIC_BG = "/scenic/aerial-view.jpg";
const LAST_STEP = 2;
const MAX_DAYS = 30;
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
    if (query.length < 3) return;
    // Abort the request for an older query, so a slow answer can't replace a newer one.
    const controller = new AbortController();
    let superseded = false;
    const timerId = setTimeout(async () => {
      setIsLoading(true);
      setError(null);
      try {
        const url = new URL("https://photon.komoot.io/api/");
        url.searchParams.set("q",     query);
        url.searchParams.set("lat",   String(OSM_BIAS.lat));
        url.searchParams.set("lon",   String(OSM_BIAS.lon));
        url.searchParams.set("limit", "5");

        const giveUp = setTimeout(() => controller.abort(), 8000);
        const res = await fetch(url.toString(), { signal: controller.signal }).finally(() => clearTimeout(giveUp));
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
        if (superseded) return;
        // Unreachable, slow (8 s) or rate-limited: say so; the field still takes typed text.
        setError(te("searchUnavailable"));
        setSuggestions([]);
      } finally {
        if (!superseded) setIsLoading(false);
      }
    }, debounceMs);

    return () => {
      superseded = true;
      clearTimeout(timerId);
      controller.abort();
      setIsLoading(false);
    };
  }, [query, debounceMs, te]);

  // Too short to search: no suggestions, including any left from a longer query.
  return { suggestions: query.length < 3 ? [] : suggestions, isLoading, error };
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

/* ─────────────────────────────────────────────────────────
   SERVICE STATE
───────────────────────────────────────────────────────── */

const NO_PLACE: Place = { name: "", coords: null };

/** A blank service for a tab (and, on the City tab, a sub-service). */
function freshService(tab: TabId, cityService: CityServiceId = "airport"): ServiceState {
  const schedule: Schedule = { date: "", time: "" };
  if (tab === "hourly") {
    return { kind: "hourly", ...schedule, hours: "3", withDriver: true, pickup: NO_PLACE };
  }
  if (tab === "country") {
    return {
      kind: "trip", ...schedule, destinationId: "", withDriver: true, pickup: NO_PLACE,
      luggage: "none", returnTrip: false, days: 1,
    };
  }
  if (cityService === "city_tour") {
    return { kind: "tour", ...schedule, tourId: "", withDriver: true, pickup: NO_PLACE, days: 1 };
  }
  return {
    kind: "transfer", ...schedule, serviceType: cityService, rideMode: "cab",
    pickup: NO_PLACE, dropoff: NO_PLACE, stops: [], flightNumber: "",
    luggage: "none", returnTrip: false, returnDate: "", returnTime: "",
  };
}

function tabOf(service: ServiceState): TabId {
  if (service.kind === "hourly") return "hourly";
  if (service.kind === "trip") return "country";
  return "city";
}

function cityServiceOf(service: ServiceState): CityServiceId | null {
  if (service.kind === "transfer") return service.serviceType;
  if (service.kind === "tour") return "city_tour";
  return null;
}

/** Which choice the service offers: Cab/Private, With driver/Self-drive, or neither. */
type TripChoice = "rideMode" | "driver" | null;

function tripChoiceFor(service: ServiceState): TripChoice {
  if (service.kind !== "transfer") return "driver";
  return service.serviceType === "inter_city" ? "rideMode" : null; // Airport: flat rate, driver included
}

/** The last day of a service that starts on `date` and runs for `days` days. */
function lastDay(date: string, days: number): string | null {
  if (!date || days <= 1) return null;
  const start = Date.parse(`${date}T00:00:00Z`);
  if (!Number.isFinite(start)) return null;
  return new Date(start + (days - 1) * 86_400_000).toISOString().slice(0, 10);
}

/** What pricing needs from the current service (lib/booking-request.ts prices it). */
function pricingFieldsFor(service: ServiceState): PricingFields {
  const base = {
    pickup: service.pickup, stops: [], dropoff: null, rideMode: null, withDriver: true,
    hours: null, destinationId: null, days: null, returnTrip: false,
  };
  switch (service.kind) {
    case "transfer":
      return {
        ...base, service: service.serviceType, rideMode: service.rideMode, stops: service.stops,
        dropoff: service.dropoff, returnTrip: service.returnTrip,
      };
    case "tour":
      return { ...base, service: "city_tour", withDriver: service.withDriver, days: service.days };
    case "hourly":
      return { ...base, service: "hourly", withDriver: service.withDriver, hours: parseInt(service.hours, 10) };
    case "trip":
      return {
        ...base, service: "trip", withDriver: service.withDriver, destinationId: service.destinationId || null,
        returnTrip: service.returnTrip, days: service.days,
      };
  }
}

/**
 * The quote for the current service, from lib/pricing.ts.
 * null until there's enough to price (e.g. no destination picked yet).
 */
function quoteFor(service: ServiceState, vehicleId: string): Quote | null {
  return quoteRequest(pricingFieldsFor(service), vehicleId);
}

/* ─────────────────────────────────────────────────────────
   LINK PRE-SELECTION
   A link can open the form with a service already chosen and filled in:
     /book?tab=hourly&hours=3
     /book?tab=city&serviceType=airport&date=2026-11-02&passengers=2
     /book?tab=country&dest=musanze&vehicle=suv&driver=self
     /book?tour=gisozi&date=2026-11-02
     /book?tab=city&serviceType=inter_city&pickup=Kigali%20Heights&pickupLat=-1.95&pickupLon=30.09
   tab          city | hourly | country (also "trips")
   serviceType  airport | city_tour | inter_city → City tab
   tour         a venue id from Tours.collections (e.g. gisozi) → City tab, Tour
   hours        one of HIRE_HOUR_OPTIONS → Hourly tab
   dest         a destination id or name (e.g. musanze, "Musanze (Volcanoes)") → Trips tab
   vehicle      a class id from lib/pricing.ts VEHICLES (sedan, suv, premium_suv…)
   rideMode     cab | private          driver  with | self
   pickup, pickupLat, pickupLon     the pickup address (coords put it on the map)
   dropoff, dropoffLat, dropoffLon  the drop-off address (Airport / A to B)
   date         YYYY-MM-DD             time  HH:MM
   passengers   a number (capped by the vehicle)
   days         a number of days (tours and trips)
   Without `tab`, the tab follows from tour, serviceType, hours or dest. Anything
   unknown is ignored, so an old or mistyped link still opens a working form.
───────────────────────────────────────────────────────── */

type ReadableParams = { get(name: string): string | null };
type Preset = { vehicle: VehicleChoice; service: ServiceState; site: RwandaSite | null };

const TAB_ALIASES: Record<string, TabId> = { city: "city", hourly: "hourly", country: "country", trips: "country" };
const CITY_SERVICES: readonly CityServiceId[] = ["airport", "inter_city", "city_tour"];

const normalize = (s: string) =>
  s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

/** A destination by id ("musanze"), by its name, or by the first word that is an id ("Musanze (Volcanoes)"). */
function findSite(value: string, sites: RwandaSite[]): RwandaSite | null {
  const v = normalize(value);
  if (!v) return null;
  return (
    sites.find((s) => s.id === v.replace(/ /g, "_")) ??
    sites.find((s) => normalize(s.title) === v) ??
    v.split(" ").map((word) => sites.find((s) => s.id === word)).find(Boolean) ??
    null
  );
}

function readPreset(params: ReadableParams | null, sites: RwandaSite[], tours: TourVenue[]): Preset {
  const vehicle: VehicleChoice = { vehicleId: "sedan", passengers: 1 };
  if (!params) return { vehicle, service: freshService("city"), site: null };
  const get = (key: string) => params.get(key)?.trim() ?? "";
  const int = (key: string, min: number, max: number) => {
    const n = Number(get(key));
    return Number.isInteger(n) && n >= min ? Math.min(n, max) : null;
  };
  const place = (prefix: "pickup" | "dropoff"): Place => {
    const name = get(prefix);
    if (!name) return NO_PLACE;
    const lat = Number(get(`${prefix}Lat`));
    const lon = Number(get(`${prefix}Lon`));
    const hasCoords = get(`${prefix}Lat`) !== "" && get(`${prefix}Lon`) !== "" &&
      Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180;
    return { name, coords: hasCoords ? [lat, lon] : null };
  };

  // Step 1: the car and the head count.
  const vehicleId = get("vehicle");
  if (VEHICLES.some((v) => v.id === vehicleId)) vehicle.vehicleId = vehicleId;
  const passengers = int("passengers", 1, getVehicle(vehicle.vehicleId).maxPassengers);
  if (passengers) vehicle.passengers = passengers;

  // Which service.
  const tour = tours.find((v) => v.id === get("tour")) ?? null;
  const serviceType = get("serviceType") as CityServiceId;
  const cityService: CityServiceId | null =
    tour ? "city_tour" : CITY_SERVICES.includes(serviceType) ? serviceType : null;
  const hours = Number(get("hours"));
  const validHours = (HIRE_HOUR_OPTIONS as readonly number[]).includes(hours);
  const site = findSite(get("dest") || get("destination"), sites);
  const tab =
    TAB_ALIASES[get("tab").toLowerCase()] ??
    (cityService ? "city" : validHours ? "hourly" : site ? "country" : "city");

  const service = freshService(tab, cityService ?? "airport");

  // Shared by every service.
  service.pickup = place("pickup");
  if (/^\d{4}-\d{2}-\d{2}$/.test(get("date"))) service.date = get("date");
  if (/^\d{2}:\d{2}$/.test(get("time"))) service.time = get("time");

  // Service-specific.
  const driver = get("driver");
  if ((driver === "with" || driver === "self") && "withDriver" in service) {
    service.withDriver = driver === "with";
  }
  const days = int("days", 1, MAX_DAYS);
  if (days && "days" in service) service.days = days;

  switch (service.kind) {
    case "transfer": {
      const rideMode = get("rideMode");
      if (rideMode === "cab" || rideMode === "private") service.rideMode = rideMode;
      service.dropoff = place("dropoff");
      break;
    }
    case "tour":
      if (tour) service.tourId = tour.id;
      break;
    case "hourly":
      if (validHours) service.hours = String(hours);
      break;
    case "trip":
      if (site) service.destinationId = site.id;
      break;
  }

  return { vehicle, service, site: service.kind === "trip" ? site : null };
}

/* ─────────────────────────────────────────────────────────
   SHARED STYLE TOKENS
   Centralising repeated Tailwind fragments prevents drift.
───────────────────────────────────────────────────────── */
const cx = {
  label:     "text-xs 2xl:text-xs font-bold text-muted-foreground uppercase tracking-wider",
  input:     "h-14 2xl:h-16 bg-card border border-border rounded-xl text-sm 2xl:text-base font-semibold text-foreground placeholder:text-muted-foreground placeholder:font-medium shadow-sm shadow-black/[0.02] hover:border-muted-foreground/40 focus-visible:ring-4 focus-visible:ring-primary/10 focus-visible:ring-offset-0 focus-visible:border-primary transition-all",
  iconSlot:  "absolute left-0 top-0 bottom-0 w-12 flex items-center justify-center pointer-events-none z-10",
  amber:     "text-primary",
  amberBorder: "border-primary bg-primary/5 ring-1 ring-primary/20",
} as const;

/* ─────────────────────────────────────────────────────────
   SUB-COMPONENTS
───────────────────────────────────────────────────────── */

interface OSMInputProps {
  label:    string;
  onSelect: (coords: [number, number], name: string) => void;
  icon:     React.ElementType;
  showGPS?: boolean;
  /** Text to start with, e.g. an address passed in the link. */
  defaultValue?: string;
}

function OSMInput({ label, onSelect, icon: Icon, showGPS = false, defaultValue = "" }: OSMInputProps) {
  const t = useTranslations("BookingForm");
  const [query, setQuery]           = useState(defaultValue);
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
          role="combobox"
          aria-autocomplete="list"
          aria-controls={showDropdown ? listId : undefined}
          aria-expanded={showDropdown}
          className={`${cx.input} pl-12 ${showGPS ? "pr-12" : "pr-4"} ${
            showDropdown ? "border-primary" : ""
          }`}
          placeholder={t("searchPlaceholder", { label })}
        />
        {showGPS && (
          <button
            type="button"
            onClick={handleGPS}
            aria-label={t("useLocation")}
            className="absolute right-1 top-1 bottom-1 w-11 rounded-lg flex items-center justify-center hover:bg-muted/70 transition-colors z-20"
          >
            {isLoading ? (
              <Loader2 className={`w-4 h-4 animate-spin ${cx.amber}`} />
            ) : (
              <Crosshair className="w-4 h-4 text-muted-foreground" />
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
            className="absolute z-50 w-full bg-card rounded-xl ring-1 ring-black/5 shadow-xl shadow-black/10 mt-2 p-1 max-h-52 overflow-y-auto"
          >
            {suggestions.map((s, i) => (
              <li
                key={i}
                role="option"
                aria-selected={false}
                onMouseDown={() => handleSelect(s)}
                className={`px-3 py-3 rounded-lg hover:bg-primary/5 cursor-pointer text-sm font-medium
                  transition-colors text-muted-foreground hover:text-primary`}
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
      <div className="flex items-center h-14 rounded-xl border border-border bg-card shadow-sm shadow-black/[0.02] overflow-hidden" role="group" aria-label={label}>
        <button
          type="button"
          id={decrementId}
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          aria-label={t("decrease", { label })}
          className="w-14 h-full flex items-center justify-center border-r border-border
            hover:bg-muted/40 text-muted-foreground hover:text-primary transition-colors
            disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <output
          htmlFor={`${decrementId} ${incrementId}`}
          className="flex-1 text-center text-sm font-extrabold text-foreground tracking-widest"
        >
          {value}
        </output>
        <button
          type="button"
          id={incrementId}
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          aria-label={t("increase", { label })}
          className="w-14 h-full flex items-center justify-center border-l border-border
            hover:bg-muted/40 text-muted-foreground hover:text-primary transition-colors
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
        className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-muted/70"
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
              className={`flex flex-col items-center justify-center gap-0.5 px-2 py-2.5 rounded-lg border transition-all
                disabled:opacity-40 disabled:cursor-not-allowed ${
                selected
                  ? "bg-card border-primary/30 text-primary shadow-sm"
                  : "border-transparent text-muted-foreground hover:text-foreground disabled:hover:text-muted-foreground"
              }`}
            >
              <span className="text-xs font-extrabold uppercase tracking-widest">{o.label}</span>
              <span className={`text-xs font-semibold ${selected ? "text-primary/80" : "text-muted-foreground"}`}>
                {o.hint}
              </span>
            </button>
          );
        })}
      </div>
      {note && <p className="text-xs font-semibold text-muted-foreground">{note}</p>}
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
    <div className="rounded-xl border border-border/80 bg-card overflow-hidden">
      <button
        type="button"
        id={headingId}
        aria-expanded={open}
        aria-controls={contentId}
        onClick={() => setOpen((prev) => !prev)}
        className="w-full flex items-center justify-between px-4 py-3.5 bg-muted/40 hover:bg-muted/70 transition-colors"
      >
        <span className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground">{title}</span>
        {open
          ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" />
          : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" />
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

/**
 * The booking form. /book is pre-rendered once for everyone, so the URL query
 * (?tab=…) is only known in the browser: the server sends the form with its
 * defaults, and on load the browser swaps in the one pre-selected from the link.
 */
export default function BookingForm(props: BookingFormProps) {
  return (
    <Suspense fallback={<BookingFormView {...props} params={null} />}>
      <BookingFormFromUrl {...props} />
    </Suspense>
  );
}

function BookingFormFromUrl(props: BookingFormProps) {
  const params = useSearchParams();
  return <BookingFormView {...props} params={params} />;
}

const whatsAppUrl = (message: string) => `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

/** How long to wait for the database before opening WhatsApp anyway. */
const SAVE_TIMEOUT_MS = 8000;

/**
 * Saves the request in MongoDB through /api/bookings. Returns the booking id,
 * or null if it couldn't be saved; never throws, so WhatsApp always follows.
 */
async function saveBooking(request: BookingRequest): Promise<string | null> {
  try {
    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
      signal: AbortSignal.timeout(SAVE_TIMEOUT_MS),
    });
    if (!res.ok) {
      console.warn("[booking] not saved:", res.status, await res.text().catch(() => ""));
      return null;
    }
    const data = (await res.json()) as { id?: unknown };
    return typeof data.id === "string" ? data.id : null;
  } catch (err) {
    console.warn("[booking] not saved:", err);
    return null;
  }
}

/** A short reference the customer and the team can quote ("A1B2C3"). */
const bookingRef = (id: string) => id.slice(-6).toUpperCase();

/** Same rule as the admin check (lib/bookings.ts). */
const PHONE = /^[+\d][\d\s().-]{5,}$/;

function BookingFormView({ onRouteUpdate, params }: BookingFormProps & { params: ReadableParams | null }) {
  const t = useTranslations("BookingForm");
  const tw = useTranslations("BookingForm.whatsapp");
  const tTours = useTranslations("Tours");
  const format = useFormatter();

  const tabs             = t.raw("tabs") as TabOption[];
  const vehicleLabels    = t.raw("vehicles") as Record<string, VehicleLabel>;
  const serviceTypes     = t.raw("serviceTypes") as ServiceTypeOption[];
  const luggageOptions   = t.raw("luggageOptions") as LuggageOption[];
  const siteLabels       = t.raw("sites") as Record<string, { title: string; region: string }>;
  const tourCollections  = tTours.raw("collections") as { venues: TourVenue[] }[];

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
  const tours: TourVenue[] = useMemo(() => tourCollections.flatMap((c) => c.venues), [tourCollections]);

  // What the link pre-selected — read once, on the first load.
  const [preset] = useState(() => readPreset(params, sites, tours));

  const [vehicle, setVehicle]               = useState<VehicleChoice>(preset.vehicle);
  const [service, setService]               = useState<ServiceState>(preset.service);
  const [customer, setCustomer]             = useState<CustomerDetails>({ name: "", phone: "", hotel: "", notes: "" });
  const [tripSearch, setTripSearch]         = useState(preset.site?.title ?? "");
  const [showTripDropdown, setShowTripDropdown] = useState(false);
  const [step, setStep]                     = useState(0);
  const [formError, setFormError]           = useState<string | null>(null);
  const [submitState, setSubmitState]       = useState<"idle" | "saving" | "saved" | "notSaved">("idle");
  const [savedRef, setSavedRef]             = useState<string | null>(null);
  const bodyRef                             = React.useRef<HTMLDivElement>(null);
  const panelRef                            = React.useRef<HTMLDivElement>(null);
  const nextStopId                          = React.useRef(0);

  const activeTab = tabOf(service);

  // Whatever the link pre-filled also goes on the map.
  useEffect(() => {
    const { service: s, site } = preset;
    if (s.pickup.coords) onRouteUpdate("pickup", s.pickup.coords);
    if (site) onRouteUpdate("dropoff", site.coords);
    if (s.kind === "transfer" && s.dropoff.coords) onRouteUpdate("dropoff", s.dropoff.coords);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once, on first load
  }, []);

  /* ── State updates ───────────────────────────────── */

  /** Change fields of the current service, if it is still of that kind. */
  const patch = useCallback(
    <K extends ServiceKind>(kind: K, changes: Partial<ServiceOf<K>>) =>
      setService((prev) => (prev.kind === kind ? ({ ...prev, ...changes } as ServiceState) : prev)),
    []
  );
  const setPickup   = (place: Place) => setService((prev) => ({ ...prev, pickup: place }));
  const setSchedule = (changes: Partial<Schedule>) => setService((prev) => ({ ...prev, ...changes }));
  const setCustomerField = (key: keyof CustomerDetails, value: string) =>
    setCustomer((prev) => ({ ...prev, [key]: value }));

  /** A new tab is a new service: nothing typed for the old one is kept or sent. */
  const switchTab = (tab: TabId) => {
    if (tab === activeTab) return;
    setService(freshService(tab));
    setTripSearch("");
    onRouteUpdate("pickup", null);
    onRouteUpdate("dropoff", null);
  };

  /**
   * Airport, Tour and A to B share the City tab's pickup and date, so those stay.
   * Airport ↔ A to B also keep the drop-off and stops; a tour has neither.
   */
  const chooseCityService = (id: CityServiceId) => {
    if (cityServiceOf(service) === id) return;
    if (id === "city_tour") onRouteUpdate("dropoff", null);
    setService((prev) => {
      if (prev.kind !== "transfer" && prev.kind !== "tour") return prev;
      const keep = { pickup: prev.pickup, date: prev.date, time: prev.time };
      if (id !== "city_tour" && prev.kind === "transfer") {
        return { ...prev, serviceType: id, flightNumber: id === "airport" ? prev.flightNumber : "" };
      }
      return { ...freshService("city", id), ...keep };
    });
  };

  const selectedVehicle = getVehicle(vehicle.vehicleId);
  const vehicleName = (id: string) => vehicleLabels[id]?.name ?? id;

  const chooseVehicle = (id: string) => {
    const v = getVehicle(id);
    // Keep the passenger count within what the new car can take.
    setVehicle((prev) => ({ vehicleId: v.id, passengers: Math.min(prev.passengers, v.maxPassengers) }));
  };

  const filteredTrips = useMemo(
    () =>
      sites.filter((s) =>
        s.title.toLowerCase().includes(tripSearch.toLowerCase())
      ),
    [tripSearch, sites]
  );

  const tripQuote = useMemo(() => quoteFor(service, vehicle.vehicleId), [service, vehicle.vehicleId]);
  const total = tripQuote?.total ?? null;

  /* ── Cab / Private and With driver / Self-drive ──── */
  const tripChoice = tripChoiceFor(service);
  // Coach has no cab fares; Premium SUV, Luxury SUV and Coach are with-driver only.
  // The customer's own choice is kept and comes back if they switch to a class that offers it.
  const cabAllowed       = selectedVehicle.cab !== null;
  const selfDriveAllowed = selectedVehicle.selfDrive;
  const rideMode: CityRideMode = !cabAllowed ? "private" : service.kind === "transfer" ? service.rideMode : "cab";
  const withDriver       = !selfDriveAllowed || ("withDriver" in service ? service.withDriver : true);

  // The note under the total says what the price covers. It follows the quote
  // (Airport/Cab = fixed fare); before a destination is picked, the driver choice.
  const noteKind: PriceNoteKind = tripQuote
    ? priceNoteKind(tripQuote)
    : withDriver ? "withDriver" : "selfDrive";
  const priceNote = t(`priceNotes.${noteKind}`);

  const rideModeToggle = (
    <ChoiceToggle<CityRideMode>
      label={t("rideMode.label")}
      value={rideMode}
      onChange={(mode) => patch("transfer", { rideMode: mode })}
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
      onChange={(choice) =>
        setService((prev) => ("withDriver" in prev ? { ...prev, withDriver: choice === "with" } : prev))
      }
      options={[
        { id: "with", label: t("driverMode.withDriver"), hint: t("driverMode.withDriverHint") },
        { id: "self", label: t("driverMode.selfDrive"),  hint: t("driverMode.selfDriveHint"), disabled: !selfDriveAllowed },
      ]}
      note={selfDriveAllowed ? null : t("driverMode.chauffeurOnly", { vehicle: vehicleName(selectedVehicle.id) })}
    />
  );

  /* ── Submission ───────────────────────────────────── */

  const serviceTypeLabel = (id: CityServiceId) => serviceTypes.find((x) => x.id === id)?.label ?? id;
  const tourTitle = (id: string) => tours.find((v) => v.id === id)?.title ?? "";
  const siteTitle = (id: string) => sites.find((s) => s.id === id)?.title ?? id;

  /** The request as plain data, built only from the fields the current service has. */
  const buildBookingRequest = (): BookingRequest => {
    const s = service;
    const base = {
      tripType:    tripQuote?.method ?? null,
      vehicleId:   selectedVehicle.id,
      withDriver:  tripChoice === "driver" ? withDriver : true,
      rideMode:    tripChoice === "rideMode" ? rideMode : null,
      passengers:  vehicle.passengers,
      pickup:      s.pickup,
      startDate:   s.date,
      time:        s.time,
      clientName:  customer.name.trim(),
      clientPhone: customer.phone.trim(),
      hotel:       customer.hotel.trim(),
      notes:       customer.notes.trim(),
      grandTotal:  total,
      priceNote:   noteKind,
    };
    const none = {
      luggage: null, stops: [], dropoff: null, destinationId: null, tourId: null, endDate: null,
      days: null, hours: null, flightNumber: null, returnTrip: false, returnLeg: null,
    };

    switch (s.kind) {
      case "transfer":
        return {
          ...base, ...none,
          service:      s.serviceType,
          luggage:      s.luggage,
          stops:        s.stops.filter((w) => w.name).map(({ name, coords }) => ({ name, coords })),
          dropoff:      s.dropoff,
          destination:  s.dropoff.name,
          flightNumber: s.serviceType === "airport" ? s.flightNumber.trim() || null : null,
          returnTrip:   s.returnTrip,
          returnLeg:    s.returnTrip ? { date: s.returnDate, time: s.returnTime } : null,
          endDate:      s.returnTrip && s.returnDate && s.returnDate !== s.date ? s.returnDate : null,
        };
      case "tour":
        return {
          ...base, ...none,
          service:     "city_tour",
          destination: s.tourId ? tourTitle(s.tourId) : "",
          tourId:      s.tourId || null,
          days:        s.days,
          endDate:     lastDay(s.date, s.days),
        };
      case "hourly":
        return { ...base, ...none, service: "hourly", destination: "", hours: parseInt(s.hours, 10) };
      case "trip":
        return {
          ...base, ...none,
          service:       "trip",
          destinationId: s.destinationId || null,
          destination:   s.destinationId ? siteTitle(s.destinationId) : "",
          luggage:     s.luggage,
          returnTrip:  s.returnTrip,
          days:        s.days,
          endDate:     lastDay(s.date, s.days),
        };
    }
  };

  /** The WhatsApp text for a request, in the customer's language, with its reference once saved. */
  const formatWhatsAppMessage = (r: BookingRequest, ref: string | null): string => {
    const dash = tw("empty");
    const service =
      r.service === "hourly" ? tw("serviceHourly", { hours: r.hours ?? "" }) :
      r.service === "trip"   ? tw("serviceCountry", { trip: r.destination || dash }) :
      tw("serviceCity", { type: serviceTypeLabel(r.service) });

    const lines: (string | null)[] = [
      tw("header"),
      ref ? `${tw("reference")}: ${ref}` : null,
      "",
      `${tw("service")}: ${service}`,
      `${tw("vehicle")}: ${vehicleName(r.vehicleId)}`,
      r.rideMode
        ? `${tw("rideType")}: ${t(`rideMode.${r.rideMode}`)}`
        : tripChoice === "driver"
          ? `${tw("driver")}: ${r.withDriver ? t("driverMode.withDriver") : t("driverMode.selfDrive")}`
          : null,
      `${tw("passengers")}: ${r.passengers}`,
      r.luggage ? `${tw("luggage")}: ${luggageOptions.find((l) => l.id === r.luggage)?.label ?? dash}` : null,
      "",
      `${tw("pickup")}: ${r.pickup.name || dash}`,
      r.stops.length ? `${tw("stops")}: ${r.stops.map((w) => w.name).join(" → ")}` : null,
      r.service === "city_tour"
        ? (r.destination ? `${tw("tour")}: ${r.destination}` : null)
        : r.service === "hourly" ? null
        : `${tw("dropoff")}: ${r.destination || dash}`,
      r.hotel ? `${tw("hotel")}: ${r.hotel}` : null,
      "",
      `${tw("date")}: ${r.startDate || dash}  ${tw("time")}: ${r.time || dash}`,
      r.days !== null ? `${tw("days")}: ${r.days}${r.endDate ? ` (${r.startDate} → ${r.endDate})` : ""}` : null,
      r.flightNumber ? `${tw("flight")}: ${r.flightNumber}` : null,
      r.returnLeg
        ? `${tw("returnTrip")}: ${r.returnLeg.date || dash} @ ${r.returnLeg.time || dash}`
        : r.returnTrip ? `${tw("returnTrip")}: ${tw("returnToPickup")}` : null,
      "",
      r.clientName  ? `${tw("name")}: ${r.clientName}`   : null,
      r.clientPhone ? `${tw("phone")}: ${r.clientPhone}` : null,
      r.notes       ? `${tw("notes")}: ${r.notes}`       : null,
      "",
      `${tw("total")}: ${r.grandTotal === null ? dash : `${format.number(r.grandTotal)} ${t("currency")}`}`,
      t(`priceNotes.${r.priceNote}`),
    ];

    // Drop empty fields, and the blank line left by a section with nothing in it.
    return lines
      .filter((l): l is string => l !== null)
      .filter((l, i, all) => l !== "" || (i > 0 && all[i - 1] !== ""))
      .join("\n");
  };

  /** The first thing a booking can't go without, and the step that has it. */
  const missingField = (): { step: number; key: string } | null => {
    if (service.kind === "trip" && !service.destinationId) return { step: 1, key: "destination" };
    if (!service.date) return { step: 1, key: "date" };
    if (!customer.name.trim()) return { step: 2, key: "name" };
    if (!PHONE.test(customer.phone.trim())) return { step: 2, key: customer.phone.trim() ? "phoneInvalid" : "phone" };
    return null;
  };

  /**
   * Sends the booking: saves it in MongoDB (/api/bookings), then opens WhatsApp
   * so the team hears about it straight away. WhatsApp opens even when the save
   * fails, so no booking is lost; the message carries the reference when it worked.
   */
  const handleWhatsApp = async () => {
    if (submitState === "saving") return;
    const missing = missingField();
    if (missing) {
      setFormError(t(`required.${missing.key}`));
      if (missing.step !== step) goToStep(missing.step);
      return;
    }
    setFormError(null);
    setSubmitState("saving");

    // Open the tab now, while this still counts as the customer's click:
    // browsers block pop-ups opened after waiting for the network.
    const waTab = window.open("", "_blank");
    const request = buildBookingRequest();
    const id = await saveBooking(request);
    const ref = id ? bookingRef(id) : null;
    const url = whatsAppUrl(formatWhatsAppMessage(request, ref));

    setSavedRef(ref);
    setSubmitState(id ? "saved" : "notSaved");
    if (waTab) waTab.location.assign(url);
    else window.location.assign(url); // pop-ups blocked: open WhatsApp here instead
  };

  /* ── Stop helpers (Airport / A to B) ──────────────── */
  const addStop = () =>
    setService((prev) =>
      prev.kind === "transfer"
        ? { ...prev, stops: [...prev.stops, { id: nextStopId.current++, ...NO_PLACE }] }
        : prev
    );
  const removeStop = (id: number) =>
    setService((prev) => (prev.kind === "transfer" ? { ...prev, stops: prev.stops.filter((s) => s.id !== id) } : prev));
  const updateStop = (id: number, name: string, coords: Coords) =>
    setService((prev) =>
      prev.kind === "transfer"
        ? { ...prev, stops: prev.stops.map((s) => (s.id === id ? { ...s, name, coords } : s)) }
        : prev
    );

  /* ── Passenger cap from selected vehicle ─────────── */
  const passengerMax = selectedVehicle.maxPassengers;

  /* ── Steps: vehicle → route & time → your details ── */
  const stepLabels = [t("steps.vehicle"), t("steps.route"), t("steps.details")];
  const goToStep = (next: number) => {
    setStep(Math.max(0, Math.min(LAST_STEP, next)));
    bodyRef.current?.scrollTo({ top: 0 });
    // On phones the page itself scrolls, so bring the form back into view.
    if (window.matchMedia("(max-width: 1023px)").matches) {
      panelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  /* ── Shared field blocks ─────────────────────────── */
  const pickupInput = (
    <OSMInput
      label={t("pickup")}
      icon={MapPin}
      showGPS
      defaultValue={service.pickup.name}
      onSelect={(c, n) => { setPickup({ name: n, coords: c }); onRouteUpdate("pickup", c); }}
    />
  );

  const renderDateTime = (
    value: Schedule,
    onChange: (changes: Partial<Schedule>) => void
  ) => (
    <div className="grid grid-cols-2 gap-4">
      {/* Date */}
      <div className="space-y-2">
        <Label className={cx.label}>{t("date")}</Label>
        <div className="relative">
          <IconSlot icon={Calendar} />
          <Input
            type="date"
            aria-label={t("date")}
            value={value.date}
            onChange={(e) => onChange({ date: e.target.value })}
            className={`${cx.input} pl-12 h-12 2xl:h-14`}
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
            aria-label={t("time")}
            value={value.time}
            onChange={(e) => onChange({ time: e.target.value })}
            className={`${cx.input} pl-12 h-12 2xl:h-14`}
          />
        </div>
      </div>
    </div>
  );

  const renderLuggage = (value: string, onChange: (id: string) => void) => (
    <div className="space-y-2">
      <Label htmlFor="bf-luggage" className={cx.label}>{t("luggage")}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id="bf-luggage" className="h-14 bg-card border border-border rounded-xl text-sm font-semibold shadow-sm shadow-black/[0.02] hover:border-muted-foreground/40 focus:ring-4 focus:ring-primary/10 focus:border-primary">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="rounded-xl border border-border shadow-xl shadow-black/10">
          {luggageOptions.map((l) => (
            <SelectItem key={l.id} value={l.id} className="rounded-lg font-medium text-sm">
              {l.icon} {l.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  const renderReturnSwitch = (on: boolean, onToggle: () => void) => (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onToggle}
      className={`w-full flex items-center justify-between px-5 h-14 rounded-xl border transition-all ${
        on ? cx.amberBorder : "border-border/80 bg-muted/40 hover:border-muted-foreground/40"
      }`}
    >
      <div className="flex items-center gap-3">
        <Repeat2 className={`w-4 h-4 ${on ? cx.amber : "text-muted-foreground"}`} aria-hidden="true" />
        <span className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground">
          {t("returnTrip")}
        </span>
      </div>
      {/* Visual toggle */}
      <div
        aria-hidden="true"
        className={`w-10 h-5 rounded-full relative transition-colors ${on ? "bg-primary" : "bg-muted"}`}
      >
        <div
          className={`absolute top-0.5 w-4 h-4 rounded-full bg-card shadow transition-transform ${
            on ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </div>
    </button>
  );

  const renderDays = (days: number, date: string, onChange: (days: number) => void) => {
    const end = lastDay(date, days);
    return (
      <div className="space-y-2">
        <Stepper label={t("days")} value={days} min={1} max={MAX_DAYS} onChange={onChange} />
        {end && (
          <p className="text-xs font-semibold text-muted-foreground">
            {t("daysUntil", { date: format.dateTime(new Date(`${end}T00:00:00`), { dateStyle: "medium" }) })}
          </p>
        )}
      </div>
    );
  };

  const isHourly = service.kind === "hourly";
  // A "missing field" note disappears as soon as the field is filled in.
  const shownError = formError && missingField() ? formError : null;

  /* ── Render ───────────────────────────────────────── */
  return (
    <div
      ref={panelRef}
      className="@container relative flex flex-col h-full w-full bg-cover bg-center bg-no-repeat rounded-b-2xl lg:rounded-none scroll-mt-4"
      style={{ backgroundImage: optimizedBg(SCENIC_BG) }}
    >
      {/* Atmospheric overlay */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-br from-foreground/70 via-foreground/40 to-primary/20 z-0 rounded-b-2xl lg:rounded-none"
      />
      {/* Vignette */}
      <div
        aria-hidden="true"
        className="absolute inset-0 z-0 rounded-b-2xl lg:rounded-none"
        style={{ background: "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.45) 100%)" }}
      />

      {/* Form panel */}
      <div className="relative z-10 flex flex-col h-full w-full bg-white/[0.96] backdrop-blur-sm rounded-b-2xl lg:rounded-none">
        <Tabs
          value={activeTab}
          className="flex-1 flex flex-col min-h-0"
          onValueChange={(v) => switchTab(v as TabId)}
        >
          {/* ── Tab bar ── */}
          <div className="px-6 sm:px-10 pt-6 sm:pt-8 flex-shrink-0">
            <TabsList className="grid w-full grid-cols-3 h-auto bg-muted/70 p-1 rounded-full">
              {tabs.map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="rounded-full h-12 text-xs 2xl:text-xs font-extrabold uppercase tracking-widest text-muted-foreground
                    data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm"
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {/* ── Step progress ── */}
          <nav aria-label={t("steps.label")} className="px-6 sm:px-10 pt-5 flex-shrink-0">
            <ol className="grid grid-cols-3 gap-2 sm:gap-3">
              {stepLabels.map((label, i) => (
                <li key={label}>
                  <button
                    type="button"
                    onClick={() => goToStep(i)}
                    aria-current={i === step ? "step" : undefined}
                    className="w-full text-left rounded-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15"
                  >
                    <span
                      aria-hidden="true"
                      className={`block h-1 rounded-full transition-colors duration-300 ${
                        i <= step ? "bg-primary" : "bg-muted"
                      }`}
                    />
                    <span
                      className={`mt-2 flex items-center gap-1.5 text-xs 2xl:text-xs font-extrabold uppercase tracking-widest ${
                        i === step ? "text-primary" : "text-muted-foreground"
                      }`}
                    >
                      <span className="tabular-nums">{i + 1}</span>
                      <span className="truncate">{label}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          </nav>

          {/* ── Step body (scrolls inside the card on large screens) ── */}
          <div
            ref={bodyRef}
            className="px-6 py-8 sm:p-10 flex-1 overflow-y-auto custom-scrollbar min-h-0"
          >

            {/* ══ STEP 1 · VEHICLE ══ */}
            <div hidden={step !== 0}>
              <div className="space-y-8">
                {/* ══ VEHICLE SELECTOR ══ */}
                <div className="space-y-3">
                  <Label className={cx.label}>{t("fleetLabel")}</Label>
                  <div className="grid grid-cols-2 @xl:grid-cols-3 @4xl:grid-cols-4 gap-3" role="radiogroup" aria-label={t("fleetGroupLabel")}>
                    {VEHICLES.map((v) => {
                      const isSelected = vehicle.vehicleId === v.id;
                      const label = vehicleLabels[v.id];
                      return (
                        <button
                          key={v.id}
                          type="button"
                          role="radio"
                          aria-checked={isSelected}
                          onClick={() => chooseVehicle(v.id)}
                          className={`p-4 rounded-xl border text-left transition-all ${
                            isSelected ? cx.amberBorder : "border-border/80 bg-card hover:border-muted-foreground/40 hover:shadow-sm"
                          }`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <span className={`text-xs font-extrabold uppercase tracking-widest ${
                              isSelected ? cx.amber : "text-muted-foreground"
                            }`}>
                              {label?.name ?? v.id}
                            </span>
                            {isSelected && (
                              <CheckCircle2 className={`w-3.5 h-3.5 ${cx.amber}`} aria-hidden="true" />
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs font-bold text-foreground mb-1">
                            <Users className="w-3 h-3" aria-hidden="true" />
                            {t("seats", { count: v.maxPassengers })}
                          </div>
                          <p className="text-xs @3xl:text-xs 2xl:text-xs text-muted-foreground font-medium leading-tight">
                            {label?.models}
                          </p>
                          <p className="text-xs @3xl:text-xs 2xl:text-xs text-muted-foreground font-medium leading-tight">
                            {t("comfort", { level: label?.comfort ?? "" })}
                          </p>
                          {!v.selfDrive && (
                            <p className={`mt-1.5 text-xs font-extrabold uppercase tracking-widest ${cx.amber}`}>
                              {t("chauffeurOnlyBadge")}
                            </p>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* ══ PASSENGERS ══ */}
                <div className="grid grid-cols-2 gap-4">
                  <Stepper
                    label={t("passengers")}
                    value={vehicle.passengers}
                    min={1}
                    max={passengerMax}
                    onChange={(n) => setVehicle((prev) => ({ ...prev, passengers: n }))}
                  />
                </div>
              </div>
            </div>

            {/* ══ STEP 2 · ROUTE & TIME ══ */}
            {/* Steps stay mounted when hidden, so typed places are kept when going back. */}
            <div hidden={step !== 1}>
              <div className="grid gap-8 @3xl:grid-cols-2 @3xl:gap-10 items-start">
                <div className="space-y-6">
                  {/* ══ CITY TAB: Airport · Tour · A to B ══ */}
                  <TabsContent value="city" className="space-y-6 mt-0">
                    {(service.kind === "transfer" || service.kind === "tour") && (
                      <>
                        {/* Service type selector */}
                        <div className="grid grid-cols-3 gap-4" role="radiogroup" aria-label={t("serviceGroupLabel")}>
                          {serviceTypes.map(({ id, label, icon }) => {
                            const Ico = getIcon(icon);
                            const isSelected = cityServiceOf(service) === id;
                            return (
                              <button
                                key={id}
                                type="button"
                                role="radio"
                                aria-checked={isSelected}
                                onClick={() => chooseCityService(id)}
                                className={`flex flex-col items-center justify-center p-4 border rounded-xl transition-all ${
                                  isSelected
                                    ? "border-primary bg-primary/5 text-primary"
                                    : "border-border/80 bg-card text-muted-foreground hover:border-muted-foreground/40 hover:shadow-sm"
                                }`}
                              >
                                <Ico className="w-5 h-5 mb-2" aria-hidden="true" />
                                <span className="text-xs font-extrabold uppercase tracking-widest">{label}</span>
                              </button>
                            );
                          })}
                        </div>

                        {/* A to B: Cab or Private · Tour: with a driver or self-drive */}
                        {tripChoice === "rideMode" && rideModeToggle}
                        {tripChoice === "driver" && driverToggle}

                        {/* Tour picked on the Tours page */}
                        {service.kind === "tour" && service.tourId && (
                          <div className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl ${cx.amberBorder}`}>
                            <div className="flex items-center gap-3 min-w-0">
                              <MapIcon className={`w-4 h-4 flex-shrink-0 ${cx.amber}`} aria-hidden="true" />
                              <div className="min-w-0">
                                <p className={cx.label}>{t("selectedTour")}</p>
                                <p className="text-sm font-bold text-foreground truncate">{tourTitle(service.tourId)}</p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => patch("tour", { tourId: "" })}
                              aria-label={t("removeTour")}
                              className="w-12 h-12 flex-shrink-0 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-card transition-colors"
                            >
                              <Minus className="w-4 h-4" aria-hidden="true" />
                            </button>
                          </div>
                        )}

                        {pickupInput}

                        {service.kind === "transfer" && (
                          <>
                            {/* Extra stops */}
                            {service.stops.map((stop, i) => (
                              <div key={stop.id} className="flex gap-2">
                                <div className="flex-1">
                                  <OSMInput
                                    label={t("stop", { number: i + 1 })}
                                    icon={MapPin}
                                    onSelect={(c, n) => updateStop(stop.id, n, c)}
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeStop(stop.id)}
                                  aria-label={t("removeStop", { number: i + 1 })}
                                  className="mt-8 w-14 h-14 rounded-xl border border-border bg-card flex items-center justify-center
                                    text-muted-foreground hover:text-destructive hover:border-destructive/30 transition-colors flex-shrink-0"
                                >
                                  <Minus className="w-4 h-4" aria-hidden="true" />
                                </button>
                              </div>
                            ))}

                            <OSMInput
                              label={t("destination")}
                              icon={Navigation}
                              defaultValue={service.dropoff.name}
                              onSelect={(c, n) => { patch("transfer", { dropoff: { name: n, coords: c } }); onRouteUpdate("dropoff", c); }}
                            />

                            <button
                              type="button"
                              onClick={addStop}
                              className="w-full h-11 rounded-xl border border-dashed border-muted-foreground/40 flex items-center justify-center gap-2
                                text-xs font-extrabold uppercase tracking-widest text-muted-foreground
                                hover:border-primary hover:text-primary transition-colors"
                            >
                              <Plus className="w-3.5 h-3.5" aria-hidden="true" /> {t("addStop")}
                            </button>

                            {/* Airport: flight number */}
                            <AnimatePresence>
                              {service.serviceType === "airport" && (
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
                                      value={service.flightNumber}
                                      onChange={(e) => patch("transfer", { flightNumber: e.target.value.toUpperCase() })}
                                      className={`${cx.input} pl-12`}
                                      placeholder={t("flightPlaceholder")}
                                    />
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </>
                        )}
                      </>
                    )}
                  </TabsContent>

                  {/* ══ HOURLY TAB ══ */}
                  <TabsContent value="hourly" className="space-y-6 mt-0">
                    {service.kind === "hourly" && (
                      <>
                        {pickupInput}
                        {driverToggle}
                        <div className="space-y-2">
                          <Label htmlFor="bf-duration" className={cx.label}>{t("duration")}</Label>
                          <Select value={service.hours} onValueChange={(v) => patch("hourly", { hours: v })}>
                            <SelectTrigger id="bf-duration" className="h-14 bg-card border border-border rounded-xl text-sm font-semibold shadow-sm shadow-black/[0.02] hover:border-muted-foreground/40 focus:ring-4 focus:ring-primary/10 focus:border-primary">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border border-border shadow-xl shadow-black/10">
                              {HIRE_HOUR_OPTIONS.map((h) => (
                                <SelectItem key={h} value={String(h)} className="rounded-lg font-medium text-sm">
                                  {t("hours", { count: h })}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </>
                    )}
                  </TabsContent>

                  {/* ══ COUNTRY (TRIPS) TAB ══ */}
                  <TabsContent value="country" className="space-y-6 mt-0">
                    {service.kind === "trip" && (
                      <>
                        {pickupInput}

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
                              className={`${cx.input} pl-12`}
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
                                className="absolute z-50 w-full bg-card rounded-xl ring-1 ring-black/5 shadow-xl shadow-black/10 mt-2 p-1 max-h-60 overflow-y-auto"
                              >
                                {filteredTrips.map((s) => (
                                  <li
                                    key={s.id}
                                    role="option"
                                    aria-selected={service.destinationId === s.id}
                                    onMouseDown={() => {
                                      setTripSearch(s.title);
                                      patch("trip", { destinationId: s.id });
                                      onRouteUpdate("dropoff", s.coords);
                                      setShowTripDropdown(false);
                                    }}
                                    className="px-3 py-3 rounded-lg hover:bg-primary/5 cursor-pointer transition-colors"
                                  >
                                    <div className="flex justify-between items-center">
                                      <div>
                                        <p className="text-xs font-bold uppercase text-foreground">{s.title}</p>
                                        <p className={`text-xs font-bold ${cx.amber} uppercase`}>{s.region}</p>
                                      </div>
                                      <div className="text-right">
                                        <p className="text-xs font-extrabold text-muted-foreground">{t("from")}</p>
                                        <p className="text-xs font-extrabold text-foreground">
                                          {format.number(destinationPrice(s.id, vehicle.vehicleId, { withDriver }) ?? 0)}
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
                      </>
                    )}
                  </TabsContent>
                </div>

                {/* ══ WHEN, AND WHAT EACH SERVICE NEEDS ══ */}
                <div className="space-y-8">
                  {renderDateTime(service, setSchedule)}

                  {(service.kind === "tour" || service.kind === "trip") &&
                    renderDays(service.days, service.date, (days) => patch(service.kind, { days }))}

                  {(service.kind === "transfer" || service.kind === "trip") &&
                    renderLuggage(service.luggage, (luggage) => patch(service.kind, { luggage }))}

                  {/* Airport / A to B: a return ride at its own date and time */}
                  {service.kind === "transfer" && (
                    <div className="space-y-4">
                      {renderReturnSwitch(service.returnTrip, () => patch("transfer", { returnTrip: !service.returnTrip }))}
                      <AnimatePresence>
                        {service.returnTrip && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                          >
                            {renderDateTime(
                              { date: service.returnDate, time: service.returnTime },
                              (c) => patch("transfer", {
                                ...(c.date !== undefined && { returnDate: c.date }),
                                ...(c.time !== undefined && { returnTime: c.time }),
                              })
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                  {/* Trips: the car brings the customer back at the end */}
                  {service.kind === "trip" &&
                    renderReturnSwitch(service.returnTrip, () => patch("trip", { returnTrip: !service.returnTrip }))}
                </div>
              </div>
            </div>

            {/* ══ STEP 3 · YOUR DETAILS ══ */}
            <div hidden={step !== 2}>
              <div className="grid gap-6 @3xl:grid-cols-2 @3xl:gap-10 items-start">
                <div className="space-y-6">
                  {/* ══ CONTACT ══ */}
                  <CollapsibleSection title={t("contactSection")} defaultOpen>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className={cx.label}>{t("fullName")}</Label>
                        <div className="relative">
                          <IconSlot icon={User} />
                          <Input
                            value={customer.name}
                            onChange={(e) => setCustomerField("name", e.target.value)}
                            className={`${cx.input} pl-12`}
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
                            value={customer.phone}
                            onChange={(e) => setCustomerField("phone", e.target.value)}
                            className={`${cx.input} pl-12`}
                            placeholder={t("phonePlaceholder")}
                          />
                        </div>
                      </div>
                    </div>
                  </CollapsibleSection>
                </div>
                <div className="space-y-6">
                  {/* ══ ACCOMMODATION ══ */}
                  <CollapsibleSection title={t("accommodation")}>
                    <div className="space-y-2">
                      <Label className={cx.label}>{t("hotelLabel")}</Label>
                      <div className="relative">
                        <IconSlot icon={Hotel} />
                        <Input
                          value={customer.hotel}
                          onChange={(e) => setCustomerField("hotel", e.target.value)}
                          className={`${cx.input} pl-12`}
                          placeholder={t("hotelPlaceholder")}
                        />
                      </div>
                    </div>
                  </CollapsibleSection>

                  {/* ══ SPECIAL REQUESTS (on an hourly hire: planned activities too) ══ */}
                  <CollapsibleSection
                    key={isHourly ? "hourly-notes" : "notes"}
                    title={isHourly ? t("hourlyNotesSection") : t("notesSection")}
                    defaultOpen={isHourly}
                  >
                    <div className="space-y-2">
                      <div className="relative">
                        <div className="absolute left-0 top-0 h-14 w-12 flex items-center justify-center pointer-events-none z-10">
                          <MessageSquare className={`w-4 h-4 ${cx.amber}`} aria-hidden="true" />
                        </div>
                        <Textarea
                          value={customer.notes}
                          onChange={(e) => setCustomerField("notes", e.target.value)}
                          aria-label={isHourly ? t("hourlyNotesSection") : t("notesSection")}
                          className="pl-12 pt-4 min-h-[100px] bg-card border border-border rounded-xl
                            text-sm font-medium text-foreground placeholder:text-muted-foreground
                            focus-visible:ring-4 focus-visible:ring-primary/10 focus-visible:ring-offset-0 focus-visible:border-primary resize-none"
                          placeholder={isHourly ? t("activitiesPlaceholder") : t("notesPlaceholder")}
                        />
                      </div>
                    </div>
                  </CollapsibleSection>
                </div>
              </div>
            </div>

          </div>{/* end step body */}

          {/* ── Footer: price + step controls (sticks to the bottom of the screen on phones) ── */}
          <div className="sticky bottom-0 lg:static z-20 px-6 py-5 sm:px-10 sm:py-6 border-t border-border bg-background/95 backdrop-blur-sm flex-shrink-0 rounded-b-2xl lg:rounded-none">
            <div className="flex flex-col gap-4 @2xl:flex-row @2xl:items-center @2xl:gap-8">
              {/* Grand total only — the cost make-up is never shown to customers */}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-end gap-4 @2xl:justify-start @2xl:items-baseline">
                  <span className="text-xs 2xl:text-xs font-extrabold text-muted-foreground uppercase tracking-widest">
                    {t("totalEstimate")}
                  </span>
                  {total === null ? (
                    <span className="text-xs 2xl:text-xs font-bold text-muted-foreground text-right @2xl:text-left max-w-[60%] @2xl:max-w-none">
                      {t("chooseDestination")}
                    </span>
                  ) : (
                    <span className="text-2xl @2xl:text-3xl 2xl:text-4xl font-extrabold text-foreground tracking-tighter">
                      {format.number(total)}{" "}
                      <span className={`text-sm ${cx.amber}`}>{t("currency")}</span>
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs font-semibold text-muted-foreground text-right @2xl:text-left">{priceNote}</p>
              </div>

              <div className="flex gap-3 @2xl:flex-shrink-0">
                {step > 0 && (
                  <button
                    type="button"
                    onClick={() => goToStep(step - 1)}
                    className="h-14 px-5 inline-flex items-center justify-center rounded-xl border border-border bg-card
                      text-foreground font-extrabold uppercase tracking-widest text-xs hover:border-muted-foreground/40 transition-colors
                      focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15"
                  >
                    <ArrowLeft className="mr-2 w-4 h-4" aria-hidden="true" />
                    {t("steps.back")}
                  </button>
                )}
                {step < LAST_STEP ? (
                  <button
                    type="button"
                    onClick={() => goToStep(step + 1)}
                    className="flex-1 @2xl:flex-none @2xl:min-w-[220px] h-14 px-6 inline-flex items-center justify-center rounded-xl
                      bg-primary hover:bg-primary-hover text-white font-extrabold uppercase tracking-widest text-xs
                      shadow-lg shadow-black/10 transition-colors duration-300
                      focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30"
                  >
                    {t("steps.next")}: {stepLabels[step + 1]}
                    <ArrowRight className="ml-3 w-4 h-4" aria-hidden="true" />
                  </button>
                ) : (
                  <Button
                    onClick={handleWhatsApp}
                    disabled={submitState === "saving"}
                    className="flex-1 @2xl:flex-none @2xl:min-w-[260px] h-14 bg-foreground hover:bg-primary text-white font-extrabold
                      uppercase tracking-widest text-xs rounded-xl shadow-lg shadow-black/10 transition-colors duration-300
                      focus-visible:ring-4 focus-visible:ring-primary/30 focus-visible:ring-offset-0"
                  >
                    {submitState === "saving" ? t("submitting") : t("submit")}
                    {submitState === "saving"
                      ? <Loader2 className="ml-3 w-4 h-4 animate-spin" aria-hidden="true" />
                      : <ArrowRight className="ml-3 w-4 h-4" aria-hidden="true" />}
                  </Button>
                )}
              </div>
            </div>

            {/* What's missing, or how the last send went */}
            <div aria-live="polite" className="empty:hidden mt-3 text-xs font-semibold">
              {shownError ? (
                <p className="text-destructive">{shownError}</p>
              ) : submitState === "saved" && savedRef ? (
                <p className={cx.amber}>{t("submitSaved", { ref: savedRef })}</p>
              ) : submitState === "notSaved" ? (
                <p className="text-muted-foreground">{t("submitNotSaved")}</p>
              ) : null}
            </div>
          </div>

        </Tabs>
      </div>
    </div>
  );
}
