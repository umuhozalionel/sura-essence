"use client";

import React, { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, MapPin, Car, Map as MapIcon, Users, ChevronDown, Clock, Loader2, Search, X, Tag, Star, Calendar } from "lucide-react";
import { useScrollLock } from "@/lib/use-scroll-lock";
import { useFormatter, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  HERO_DESTINATION_IDS,
  HIRE_HOUR_OPTIONS,
  VEHICLES,
  getDestination,
  getVehicle,
  priceNoteKind,
  quote,
  roadDistanceKm,
  trips,
  type CityRideMode,
  type PriceNoteKind,
  type Trip,
} from "@/lib/pricing";
import { usePricing } from "@/components/pricing-provider";

/*
 * The Movana quick quote: pick a trip, see a live fare (rates from
 * PricingProvider), then carry every choice on to /movana/book.
 * Used by the SURA Essence hub hero and the Movana home.
 *
 * Words live in messages/*.json under Hero.tabs, Hero.form, Hero.modes,
 * Hero.estimate, Hero.sites, Hero.vehicles and Hero.passengerOptions.
 */

// Tab labels live in messages/*.json under Hero.tabs.<id>
type TabId = "cityRide" | "interCity" | "driver";
const TABS: TabId[] = ["cityRide", "interCity", "driver"];

// Option labels live in messages/*.json under Hero.passengerOptions.<id>
const PASSENGER_OPTIONS = ["oneAdult", "twoAdults", "group"];
type QuotePlace = { coords: [number, number] | null; name: string };
const NO_PLACE: QuotePlace = { coords: null, name: "" };

/** A picked place as booking-form link parameters, e.g. pickup, pickupLat, pickupLon. */
const placeParams = (prefix: "pickup" | "dropoff", place: QuotePlace): Record<string, string> =>
  place.coords && place.name
    ? { [prefix]: place.name, [`${prefix}Lat`]: place.coords[0].toFixed(5), [`${prefix}Lon`]: place.coords[1].toFixed(5) }
    : {};

/** The head count each passenger option passes on to the booking form. */
const PASSENGER_COUNT: Record<string, number> = { oneAdult: 1, twoAdults: 2, group: 3 };

/** Below lg the on-screen keyboard can cover a focused field and its suggestions. */
const NARROW_SCREEN = "(max-width: 1023.98px)";

/** Two-way segmented switch: Cab / Private, or With Driver / Self-Drive. */
function ChoiceSwitch<T extends string>({ label, value, options, onChange, hint }: {
  label: string;
  value: T;
  options: { id: T; label: string; disabled?: boolean }[];
  onChange: (value: T) => void;
  hint: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <div role="radiogroup" aria-label={label} className="inline-flex rounded-2xl border border-muted-foreground/40 bg-background p-0.5">
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
              className={`min-h-12 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                selected ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {o.label}
            </button>
          );
        })}
      </div>
      <span className="text-xs font-semibold text-muted-foreground">{hint}</span>
    </div>
  );
}

function LocationInput({ label, placeholder, zIndex, onSelect }: { label: string, placeholder: string, zIndex: string, onSelect: (coords: [number, number] | null, name: string) => void }) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<{ name: string; lat: number; lon: number }[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const fieldRef = useRef<HTMLDivElement>(null);
  // The name of the suggestion just picked: no new search for it, or the list would reopen over the next field.
  const picked = useRef<string | null>(null);

  useEffect(() => {
    // Photon is a free public service and is sometimes slow, rate-limited or
    // unreachable (offline, ad blockers). Then the field just shows no
    // suggestions: the visitor can keep typing, and nothing is logged as an error.
    const controller = new AbortController();
    const delay = setTimeout(async () => {
      if (query.length < 3 || query === picked.current) return;
      setLoading(true);
      try {
        const url = new URL("https://photon.komoot.io/api/");
        url.searchParams.set("q", query);
        url.searchParams.set("lat", "-1.9441");
        url.searchParams.set("lon", "30.0619");
        url.searchParams.set("limit", "5");
        const giveUp = setTimeout(() => controller.abort(), 8000);
        const res = await fetch(url, { signal: controller.signal }).finally(() => clearTimeout(giveUp));
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        type PhotonFeature = { properties: { name?: string; city?: string }; geometry: { coordinates: [number, number] } };
        setSuggestions(((data.features ?? []) as PhotonFeature[]).map((f) => ({
            name: [f.properties.name, f.properties.city].filter(Boolean).join(", "),
            lat: f.geometry.coordinates[1],
            lon: f.geometry.coordinates[0]
        })));
        setShowDropdown(true);
      } catch {
        // Aborted means the visitor typed more and a newer search is on its way.
        if (!controller.signal.aborted) setSuggestions([]);
      }
      setLoading(false);
    }, 500);
    return () => {
      clearTimeout(delay);
      controller.abort(); // drop the answer to an older query
    };
  }, [query]);

  // On phones and tablets, bring the field to the top once the keyboard is up,
  // so its suggestions have room below it instead of hiding behind the keys.
  const keepInView = () => {
    if (!window.matchMedia(NARROW_SCREEN).matches) return;
    setTimeout(() => fieldRef.current?.scrollIntoView({ block: "start", behavior: "smooth" }), 300);
  };

  return (
    <div ref={fieldRef} className={`flex flex-col relative ${zIndex} group scroll-mt-[calc(var(--header-h)+0.75rem)]`}>
        <label className="text-xs text-muted-foreground mb-1 font-bold uppercase tracking-wider group-focus-within:text-primary transition-colors">{label}</label>
        <div className="relative border border-muted-foreground/40 rounded-2xl overflow-hidden focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all bg-card h-12">
            <input
                suppressHydrationWarning
                type="text" value={query} onChange={(e) => { setQuery(e.target.value); onSelect(null, ""); }}
                onFocus={() => { keepInView(); if (query.length > 2) setShowDropdown(true); }} onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                placeholder={placeholder} aria-label={label} autoComplete="off" enterKeyHint="search"
                className="w-full h-full px-3 py-2 text-base md:text-xs text-foreground font-bold outline-none bg-transparent placeholder:text-muted-foreground placeholder:font-medium"
            />
            {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 animate-spin text-primary" />}
        </div>
        <AnimatePresence>
            {showDropdown && suggestions.length > 0 && (
                <motion.ul initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="absolute top-[100%] left-0 w-full bg-card border border-border shadow-2xl rounded-2xl max-h-52 md:max-h-60 overflow-y-auto overscroll-contain mt-1 z-50">
                    {suggestions.map((s, idx) => (
                        <li key={idx} onClick={() => { picked.current = s.name; setQuery(s.name); onSelect([s.lat, s.lon], s.name); setShowDropdown(false); }} className="flex min-h-12 items-center px-3 py-2.5 text-xs leading-snug font-bold text-foreground [overflow-wrap:anywhere] hover:bg-muted/40 hover:text-primary cursor-pointer border-b border-border last:border-0 transition-colors">
                            {s.name}
                        </li>
                    ))}
                </motion.ul>
            )}
        </AnimatePresence>
    </div>
  );
}

/** A labelled select with an icon, the same height and border as the place fields. */
function SelectField({ label, icon: Icon, value, onChange, className = "", children }: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  value?: string;
  onChange: (value: string) => void;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`flex flex-col group ${className}`}>
      <label className="text-xs text-muted-foreground mb-1 font-bold uppercase tracking-wider group-focus-within:text-primary transition-colors">{label}</label>
      <div className="relative border border-muted-foreground/40 rounded-2xl overflow-hidden focus-within:border-primary focus-within:ring-1 focus-within:ring-primary bg-card h-12 transition-all">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <select suppressHydrationWarning aria-label={label} value={value} onChange={(e) => onChange(e.target.value)} className="w-full h-full px-3 pl-9 py-2 text-base md:text-xs text-foreground font-bold outline-none appearance-none bg-transparent">
          {children}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
      </div>
    </div>
  );
}

/**
 * `layout`: "wide" lays the fields out in one 12-column row (a full-width
 * section); "compact" stacks them two by two for a card in a half-width column,
 * without the promo code and "Learn more".
 */
export function QuoteSearch({ layout = "wide", className = "" }: { layout?: "wide" | "compact"; className?: string }) {
  const t = useTranslations("Hero");
  const format = useFormatter();
  const compact = layout === "compact";
  const [activeTab, setActiveTab] = useState<TabId>("cityRide");

  // What was picked from the address search: the name is passed on to the booking form.
  const [pickup, setPickup] = useState<QuotePlace>(NO_PLACE);
  const [dropoff, setDropoff] = useState<QuotePlace>(NO_PLACE);
  const pickupCoords = pickup.coords;
  const dropoffCoords = dropoff.coords;
  const [departureDate, setDepartureDate] = useState("");
  const [selectedSite, setSelectedSite] = useState<string>("");
  const [duration, setDuration] = useState("3");
  const [passengers, setPassengers] = useState("oneAdult");
  const [vehicleId, setVehicleId] = useState("sedan");
  const pricing = usePricing();
  const [promoCode, setPromoCode] = useState("");
  // City Ride: Cab or Private. Inter-City and Hourly: with a driver or self-drive.
  const [rideMode, setRideMode] = useState<CityRideMode>("cab");
  const [withDriver, setWithDriver] = useState(true);

  // Coach has no cab fares; Premium SUV, Luxury SUV and Coach are with-driver only.
  // The visitor's own choice comes back if they switch to a class that offers it.
  const vehicle = getVehicle(vehicleId);
  const cabAllowed = vehicle.cab !== null;
  const selfDriveAllowed = vehicle.selfDrive;
  const effectiveRideMode: CityRideMode = cabAllowed ? rideMode : "private";
  const effectiveWithDriver = selfDriveAllowed ? withDriver : true;

  const [showModal, setShowModal] = useState(false);
  // Raw numbers; they're formatted for the current language when the modal renders.
  const [estimate, setEstimate] = useState<{ distKm: number | null; minutes: number; price: number; title: string; vehicleId: string; option: string; note: PriceNoteKind; bookHref: string } | null>(null);
  useScrollLock(showModal && estimate !== null);

  const handleShowFleet = () => {
    // Build the trip, then let lib/pricing.ts price it.
    let trip: Trip | null = null;
    let minutes = 0;
    let title = "";
    // The same choices as URL parameters, so "Proceed to Booking" opens the
    // booking form with this trip already selected (see booking-form.tsx).
    let booking: Record<string, string> = {};
    const driver = effectiveWithDriver ? "with" : "self";

    if (activeTab === "cityRide") {
      if (!pickupCoords || !dropoffCoords) return alert(t("errors.pickupAndDestination"));
      const km = roadDistanceKm(pickupCoords, dropoffCoords);
      trip = trips.cityRide(effectiveRideMode, km);
      minutes = Math.round(km * 3.5);
      title = t("estimate.cityTitle");
      booking = { tab: "city", serviceType: "inter_city", rideMode: effectiveRideMode };
    }
    else if (activeTab === "interCity") {
      if (!pickupCoords || !selectedSite) return alert(t("errors.pickupAndSite"));
      const site = getDestination(selectedSite);
      trip = trips.destination(selectedSite, { withDriver: effectiveWithDriver });
      if (!site || !trip) return;
      minutes = Math.round(site.km * 1.5);
      title = t("estimate.siteTitle", { site: t(`sites.${site.id}`) });
      booking = { tab: "country", dest: site.id, driver };
    }
    else if (activeTab === "driver") {
      if (!pickupCoords) return alert(t("errors.pickup"));
      const hours = parseInt(duration, 10);
      trip = trips.hourly(hours, { withDriver: effectiveWithDriver });
      minutes = hours * 60;
      title = t("estimate.driverTitle", { hours });
      booking = { tab: "hourly", hours: String(hours), driver };
    }
    if (!trip) return;

    const result = quote(trip, vehicleId, pricing);
    setEstimate({
      distKm: activeTab === "driver" ? null : result.distanceKm,
      minutes,
      price: result.total,
      title,
      vehicleId,
      option:
        activeTab === "cityRide"
          ? t(`modes.${result.method === "cab" ? "cab" : "private"}`)
          : t(result.withDriver ? "modes.withDriver" : "modes.selfDrive"),
      // What the total covers: fixed fare (Cab), vehicle + fuel (self-drive), or + service fee (with a driver).
      note: priceNoteKind(result),
      // Everything typed here goes along, so it needn't be typed again on /book.
      bookHref: `/movana/book?${new URLSearchParams({
        ...booking,
        vehicle: vehicleId,
        ...placeParams("pickup", pickup),
        ...(activeTab === "cityRide" ? placeParams("dropoff", dropoff) : {}),
        ...(departureDate ? { date: departureDate } : {}),
        passengers: String(Math.min(PASSENGER_COUNT[passengers] ?? 1, vehicle.maxPassengers)),
      }).toString()}`,
    });
    setShowModal(true);
  };

  // Field spans: one 12-column row when wide, two per row when compact.
  const span = compact ? "" : "md:col-span-3";
  const grid = compact ? "grid grid-cols-1 sm:grid-cols-2 gap-3" : "grid grid-cols-1 md:grid-cols-12 gap-3";

  return (
    <>
      {/* No overflow-hidden here: the place-search dropdowns must be able to hang below the card. */}
      <div data-quote-search={layout} className={`w-full bg-card text-foreground shadow-[0_20px_50px_rgba(0,0,0,0.15)] rounded-2xl border border-border ${className}`}>

          <div role="tablist" className="flex w-full bg-background border-b border-border rounded-t-2xl overflow-hidden">
              {TABS.map((tab) => (
                  <button
                      key={tab} type="button" role="tab" aria-selected={activeTab === tab} aria-label={t(`tabs.${tab}`)}
                      onClick={() => { setActiveTab(tab); setPickup(NO_PLACE); setDropoff(NO_PLACE); }}
                      className={`flex-1 min-h-12 py-3.5 md:py-4 text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 relative
                      ${activeTab === tab ? "bg-card text-primary" : "text-muted-foreground hover:text-foreground"}`}
                  >
                      {tab === "cityRide" && <MapPin className="w-3.5 h-3.5" />}
                      {tab === "interCity" && <MapIcon className="w-3.5 h-3.5" />}
                      {tab === "driver" && <Car className="w-3.5 h-3.5" />}
                      <span className={compact ? "text-[11px] sm:text-xs" : "hidden sm:inline"}>{t(`tabs.${tab}`)}</span>
                      {activeTab === tab && <motion.div layoutId={`quoteTab-${layout}`} className="absolute top-0 left-0 w-full h-[2px] md:h-[3px] bg-primary" />}
                  </button>
              ))}
          </div>

          <div className="p-4 md:p-5 flex flex-col gap-3 bg-card rounded-b-2xl">

              {/* City Ride: Cab / Private · Inter-City and Hourly: With Driver / Self-Drive */}
              {activeTab === "cityRide" ? (
                  <ChoiceSwitch<CityRideMode>
                      label={t("modes.rideLabel")}
                      value={effectiveRideMode}
                      onChange={setRideMode}
                      options={[
                          { id: "cab", label: t("modes.cab"), disabled: !cabAllowed },
                          { id: "private", label: t("modes.private") },
                      ]}
                      hint={
                          cabAllowed
                              ? t(effectiveRideMode === "cab" ? "modes.cabHint" : "modes.privateHint")
                              : t("modes.cabUnavailable", { vehicle: t(`vehicles.${vehicle.id}`) })
                      }
                  />
              ) : (
                  <ChoiceSwitch<"with" | "self">
                      label={t("modes.driverLabel")}
                      value={effectiveWithDriver ? "with" : "self"}
                      onChange={(choice) => setWithDriver(choice === "with")}
                      options={[
                          { id: "with", label: t("modes.withDriver") },
                          { id: "self", label: t("modes.selfDrive"), disabled: !selfDriveAllowed },
                      ]}
                      hint={
                          selfDriveAllowed
                              ? t(effectiveWithDriver ? "modes.withDriverHint" : "modes.selfDriveHint")
                              : t("modes.chauffeurOnly", { vehicle: t(`vehicles.${vehicle.id}`) })
                      }
                  />
              )}

              <div className={grid}>
                  <div className={`${span} relative z-50`}>
                      <LocationInput label={t("form.from")} placeholder={t("form.departurePlaceholder")} zIndex="z-50" onSelect={(coords, name) => setPickup({ coords, name })} />
                  </div>

                  <div className={`${span} relative z-40 group`}>
                      <AnimatePresence mode="wait">
                          <motion.div key={activeTab} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.2 }}>
                              {activeTab === "cityRide" && (
                                  <LocationInput label={t("form.to")} placeholder={t("form.destinationPlaceholder")} zIndex="z-40" onSelect={(coords, name) => setDropoff({ coords, name })} />
                              )}
                              {activeTab === "interCity" && (
                                  <SelectField label={t("form.destinationSite")} icon={Search} onChange={setSelectedSite}>
                                      <option value="" className="font-medium text-muted-foreground">{t("form.selectSite")}</option>
                                      {HERO_DESTINATION_IDS.map(id => <option key={id} value={id}>{t(`sites.${id}`)}</option>)}
                                  </SelectField>
                              )}
                              {activeTab === "driver" && (
                                  <SelectField label={t("form.duration")} icon={Clock} value={duration} onChange={setDuration}>
                                      {HIRE_HOUR_OPTIONS.map(h => <option key={h} value={h}>{t("form.hours", { count: h })}</option>)}
                                  </SelectField>
                              )}
                          </motion.div>
                      </AnimatePresence>
                  </div>

                  <div className={`${span} flex flex-col group z-30`}>
                      <label className="text-xs text-muted-foreground mb-1 font-bold uppercase tracking-wider group-focus-within:text-primary transition-colors">{t("form.departureDate")}</label>
                      <div className="relative border border-muted-foreground/40 rounded-2xl overflow-hidden focus-within:border-primary focus-within:ring-1 focus-within:ring-primary bg-card h-12 transition-all">
                          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                          <input suppressHydrationWarning type="date" aria-label={t("form.departureDate")} value={departureDate} onChange={(e) => setDepartureDate(e.target.value)} className="w-full h-full px-3 pl-9 py-2 text-base md:text-xs text-foreground font-bold outline-none bg-transparent" />
                      </div>
                  </div>

                  <SelectField label={t("form.class")} icon={Star} value={vehicleId} onChange={setVehicleId} className={`${span} z-20`}>
                      {VEHICLES.map(v => (
                          <option key={v.id} value={v.id}>{t(`vehicles.${v.id}`)}</option>
                      ))}
                  </SelectField>
              </div>

              <div className={`${grid} items-end`}>
                  <SelectField label={t("form.passengers")} icon={Users} value={passengers} onChange={setPassengers} className={`${span} z-10`}>
                      {PASSENGER_OPTIONS.map(p => (
                          <option key={p} value={p}>{t(`passengerOptions.${p}`)}</option>
                      ))}
                  </SelectField>

                  {!compact && (
                      <div className={`${span} flex flex-col group z-10`}>
                          <label className="text-xs text-muted-foreground mb-1 font-bold uppercase tracking-wider group-focus-within:text-primary transition-colors">{t("form.promoCode")}</label>
                          <div className="relative border border-muted-foreground/40 rounded-2xl overflow-hidden focus-within:border-primary focus-within:ring-1 focus-within:ring-primary bg-card h-12 transition-all">
                              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                              <input
                                  suppressHydrationWarning
                                  type="text" value={promoCode} onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                                  placeholder={t("form.enterCode")}
                                  className="w-full h-full px-3 pl-9 py-2 text-base md:text-xs text-foreground font-bold uppercase outline-none bg-transparent placeholder:text-muted-foreground placeholder:font-medium"
                              />
                          </div>
                      </div>
                  )}

                  <div className={`${compact ? "" : "md:col-span-6"} flex gap-3 h-12 z-10`}>
                      <motion.button
                          type="button"
                          whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                          onClick={handleShowFleet}
                          className="flex-1 bg-primary hover:bg-primary-hover text-primary-foreground flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider transition-colors rounded-2xl shadow-sm"
                      >
                          {t("form.showFleet")}
                          {compact && <ArrowRight className="w-4 h-4" aria-hidden="true" />}
                      </motion.button>
                      {!compact && (
                          <motion.div className="flex-1" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                              <Link href="/iwacu/kigali-guide" className="w-full h-full bg-card border border-muted-foreground/40 hover:border-primary hover:text-primary text-foreground flex items-center justify-center text-xs font-bold uppercase tracking-wider transition-colors rounded-2xl">
                                  {t("form.learnMore")}
                              </Link>
                          </motion.div>
                      )}
                  </div>
              </div>

          </div>
      </div>

      {/* ───────────────────── FLEET ESTIMATE ───────────────────── */}
      <AnimatePresence>
        {showModal && estimate && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowModal(false)} className="absolute inset-0 bg-foreground/60 backdrop-blur-sm" />

            <motion.div role="dialog" aria-modal="true" aria-label={estimate.title} initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-card text-foreground w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">
                <div className="bg-primary p-5 text-primary-foreground flex justify-between items-center">
                    <div>
                        <h3 className="text-base font-extrabold uppercase tracking-widest">{estimate.title}</h3>
                        <p className="text-xs opacity-80 mt-1 uppercase tracking-widest flex items-center gap-2">
                           <Star size={10} className="fill-current" /> {t(`vehicles.${estimate.vehicleId}`)} · {estimate.option}
                           {promoCode && <span className="ml-2 bg-secondary text-secondary-foreground px-2 py-0.5 rounded-2xl">{t("estimate.promo")}</span>}
                        </p>
                    </div>
                    <button type="button" onClick={() => setShowModal(false)} aria-label={t("estimate.close")} className="flex h-12 w-12 items-center justify-center hover:bg-white/10 rounded-full transition-colors"><X size={18} /></button>
                </div>

                <div className="p-6">
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        {estimate.distKm !== null && (
                            <div className="flex flex-col border-b border-border pb-3">
                                <span className="text-xs text-muted-foreground uppercase tracking-widest mb-1 font-bold">{t("estimate.distance")}</span>
                                <span className="text-xl font-extrabold text-foreground">{format.number(estimate.distKm, { maximumFractionDigits: 1, minimumFractionDigits: 1 })} km</span>
                            </div>
                        )}
                        <div className="flex flex-col border-b border-border pb-3">
                            <span className="text-xs text-muted-foreground uppercase tracking-widest mb-1 font-bold">{t("estimate.duration")}</span>
                            <span className="text-xl font-extrabold text-foreground">
                                {estimate.minutes > 60
                                    ? t("estimate.hoursMinutes", { hours: Math.floor(estimate.minutes / 60), minutes: estimate.minutes % 60 })
                                    : t("estimate.minutes", { minutes: estimate.minutes })}
                            </span>
                        </div>
                        <div className="flex flex-col col-span-2 bg-muted/40 p-4 rounded-2xl border border-border relative overflow-hidden mt-2">
                            <div className="absolute top-0 left-0 w-1 h-full bg-secondary" />
                            <span className="text-xs text-muted-foreground uppercase tracking-widest mb-1 font-bold">{t("estimate.price")}</span>
                            <span className="text-3xl font-extrabold text-primary">{format.number(estimate.price)} RWF</span>
                            <span className="mt-2 text-xs font-semibold text-muted-foreground">{t(`estimate.notes.${estimate.note}`)}</span>
                        </div>
                    </div>

                    <Link href={estimate.bookHref} className="w-full h-12 bg-secondary hover:bg-secondary-hover text-secondary-foreground flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest transition-colors rounded-2xl shadow-md">
                        {t("estimate.proceed")} <ArrowRight size={14} />
                    </Link>
                </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
