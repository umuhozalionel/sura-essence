"use client";

import React, { useMemo, useState } from "react";
import { MotionConfig, motion } from "framer-motion";
import Image from "next/image";
import { useFormatter, useTranslations } from "next-intl";
import { ArrowLeft, ArrowRight, Check, Download, Loader2, MessageCircle, Minus, Plus, Users, X } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useSolidHeader } from "@/components/chrome/brand-chrome";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSiteContact } from "@/components/site-settings-provider";
import { EMPTY_REQUEST, PHONE, bookingRef, saveBooking } from "@/components/booking-submit";
import { whatsAppHref } from "@/lib/cms/site-settings";
import { kigaliToday } from "@/lib/bookings";
import type { PricingConfig } from "@/lib/pricing";
import {
  GUEST_GROUPS, MAX_TRIP_GUESTS, TRIP_ACTIVITIES, activityMinimum, activityUsd, carPrice, dayPlan, entryFee, lunchChoicesFor, noGuests, payingGuests, pickupTimes,
  quoteTrip, totalGuests, usdInRwf, vehicleSeats, vehiclesFor,
  type GuestGroup, type LunchChoice, type TripActivity, type TripGuests, type TripPackage, type TripRates, type TripSelection, type TripVehicle,
} from "@/lib/trips";
import { downloadTripPdf } from "./trip-pdf";

/**
 * The Akagera trip page. First the packages, each explained with its own button;
 * then six short steps, with the price and the next step always beside them (a bar
 * at the bottom on phones). Prices here are for the customer; the server works them
 * out again from the same rules when the request is sent.
 * Words: messages/*.json, namespace "Trips".
 */
const STEPS = ["guests", "date", "vehicle", "meals", "activities", "review"] as const;
type StepId = (typeof STEPS)[number];

const field = "h-12 bg-background border border-border rounded-xl text-base sm:text-sm font-semibold";
const primaryButton = "rounded-xl bg-primary hover:bg-primary-hover text-white font-extrabold uppercase tracking-widest text-xs inline-flex items-center justify-center gap-2 transition-colors";

function Counter({ value, label, onChange }: { value: number; label: string; onChange: (n: number) => void }) {
  const t = useTranslations("Trips.builder");
  const button = "h-10 w-10 lg:h-8 lg:w-8 rounded-lg border border-border bg-card flex items-center justify-center hover:border-muted-foreground/50 transition-colors disabled:opacity-30";
  return (
    <div className="flex items-center gap-0.5" role="group" aria-label={label}>
      <button type="button" aria-label={`${t("fewer")}: ${label}`} disabled={value <= 0} onClick={() => onChange(value - 1)} className={button}>
        <Minus className="h-3.5 w-3.5" aria-hidden />
      </button>
      <span className="w-7 text-center text-sm font-extrabold tabular-nums" aria-live="polite">{value}</span>
      <button type="button" aria-label={`${t("more")}: ${label}`} disabled={value >= MAX_TRIP_GUESTS} onClick={() => onChange(value + 1)} className={button}>
        <Plus className="h-3.5 w-3.5" aria-hidden />
      </button>
    </div>
  );
}

function Choice({ selected, onClick, title, note, side, sideNote, disabled = false, role = "radio" }: { selected: boolean; onClick: () => void; title: string; note?: string; side?: string; sideNote?: string; disabled?: boolean; role?: "radio" | "checkbox" }) {
  return (
    <motion.button type="button" role={role} aria-checked={selected} onClick={onClick} disabled={disabled} whileTap={{ scale: 0.99 }}
      className={`w-full rounded-xl border px-4 py-3 text-left transition-colors flex items-center justify-between gap-4 disabled:opacity-50 ${selected ? "border-primary ring-1 ring-primary bg-primary/5" : "border-border bg-card hover:border-muted-foreground/40"}`}>
      <span className="min-w-0">
        <span className="block text-sm font-extrabold text-foreground">{title}</span>
        {note && <span className="mt-0.5 block text-xs text-muted-foreground leading-snug">{note}</span>}
      </span>
      <span className="shrink-0 flex items-center gap-3">
        {side && (
          <span className="text-right whitespace-nowrap">
            <span className="block text-xs font-extrabold text-foreground tabular-nums">{side}</span>
            {sideNote && <span className="block text-xs text-muted-foreground tabular-nums">{sideNote}</span>}
          </span>
        )}
        <span className={`h-5 w-5 rounded-full border flex items-center justify-center transition-colors ${selected ? "border-primary bg-primary text-white" : "border-border"}`}>
          {selected && <Check className="h-3 w-3" aria-hidden />}
        </span>
      </span>
    </motion.button>
  );
}

/** A figure that lifts in whenever it changes. */
function Price({ value, className }: { value: string; className: string }) {
  return (
    <motion.p key={value} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }} className={className}>
      {value}
    </motion.p>
  );
}

export function TripBuilder({ rates, pricing }: { rates: TripRates; pricing: PricingConfig }) {
  const t = useTranslations("Trips.builder");
  const tTrip = useTranslations("Trips.akagera");
  const format = useFormatter();
  const contact = useSiteContact();

  const [stage, setStage] = useState<"packages" | "build">("packages");
  const [preview, setPreview] = useState<TripPackage | "premium" | null>(null);
  const [step, setStep] = useState<StepId>("guests");
  const [pkg, setPkg] = useState<TripPackage>("basic");
  const [vehicle, setVehicle] = useState<TripVehicle>("comfort");
  const [guests, setGuests] = useState<TripGuests>(noGuests);
  const [date, setDate] = useState("");
  const times = useMemo(() => pickupTimes(rates), [rates]);
  const [pickupTime, setPickupTime] = useState(times[times.length - 1] ?? "");
  const [pickupPlace, setPickupPlace] = useState("");
  const [lunch, setLunch] = useState<LunchChoice>("none");
  const [breakfast, setBreakfast] = useState(false);
  const [dinner, setDinner] = useState(false);
  const [guide, setGuide] = useState(false);
  const [activities, setActivities] = useState<TripActivity[]>([]);
  const [stops, setStops] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<"idle" | "saving" | "sent">("idle");
  const [reference, setReference] = useState<string | null>(null);

  // The hero sits under a clear header; the steps need a solid one.
  useSolidHeader(stage === "build" || state === "sent");

  const rwf = (n: number) => `${format.number(n)} RWF`;
  const approxUsd = (n: number) => t("approxUsd", { usd: format.number(Math.round(n / rates.usdToRwf)) });
  const backStep = () => {
    if (index === 0) {
      setStage("packages");
      setPreview(pkg);
      setError(null);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else goTo(STEPS[index - 1]);
  };
  const selection: TripSelection = {
    tripId: "akagera", pkg, vehicle, guests, date, pickupTime, pickupPlace: pickupPlace.trim(), lunch, breakfast, dinner, guide, activities: activities.filter((a) => activityUsd(a, guests) !== null), extraStops: stops.map((x) => x.trim()).filter(Boolean).join("; "),
  };
  const q = quoteTrip(selection, rates, pricing);
  const paying = payingGuests(guests);
  const everyone = totalGuests(guests);
  // A change of guests can put an activity below the park's minimum.
  const allowedActivities = activities.filter((a) => activityUsd(a, guests) !== null);
  const plan = dayPlan(selection);
  const index = STEPS.indexOf(step);

  const startPackage = (next: TripPackage) => {
    if (next !== pkg || stage === "packages") {
      setPkg(next);
      setVehicle(vehiclesFor(next)[0]);
      setLunch(next === "basic" ? "none" : "chosen");
    }
    setStage("build");
    setStep("guests");
    setError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const setCount = (id: GuestGroup, age: "adults" | "children", n: number) => {
    setError(null);
    setGuests((g) => ({ ...g, [id]: { ...g[id], [age]: n } }));
  };

  const stepProblem = (id: StepId): string | null => {
    if (id === "guests") {
      if (paying < 1) return t("errors.guests");
      if (!vehiclesFor(pkg).some((v) => vehicleSeats(v) >= everyone)) return t("errors.tooMany");
    }
    if (id === "date") {
      if (!date) return t("errors.date");
      if (!pickupPlace.trim()) return t("errors.pickup");
    }
    if (id === "vehicle" && !q.fits) return t("errors.vehicleSeats");
    return null;
  };
  const goTo = (next: StepId) => {
    // Forward steps must have what they need; going back is always fine.
    for (const s of STEPS.slice(0, STEPS.indexOf(next))) {
      const problem = stepProblem(s);
      if (problem) {
        setStep(s);
        setError(problem);
        return;
      }
    }
    setError(null);
    setStep(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  function guestLines() {
    return GUEST_GROUPS.flatMap((id) => {
      const { adults, children } = guests[id];
      if (!adults && !children) return [];
      return [`${t(`groups.${id}.name`)}: ${t("guestCount", { adults, children })}`];
    }).concat(guests.infants ? [t("infantsCount", { count: guests.infants })] : []);
  }
  function includedLines() {
    return [
      t("included.vehicle", { vehicle: t(`vehicles.${vehicle}.name`) }),
      t("included.entry"),
      vehicle === "safari" ? t("included.safari") : t("included.fuel"),
      vehicle === "safari" ? null : t("included.snacks"),
      vehicle === "safari" || pkg === "basic" ? null : t("included.viewing"),
      lunch === "none" ? null : t(`lunch.${lunch}.name`),
      pkg === "basic" || (guide && vehicle !== "safari") ? t("included.guide") : null,
      ...allowedActivities.map((a) => t(`activities.${a}.name`)),
    ].filter((l): l is string => l !== null);
  }
  function quotedLines() {
    return [
      breakfast ? t("meals.breakfast") : null,
      dinner ? t("meals.dinner") : null,
      lunch === "none" && pkg !== "basic" ? t("lunch.none.quoted") : null,
      selection.extraStops ? `${t("activitiesStep.stops")}: ${selection.extraStops}` : null,
    ].filter((l): l is string => l !== null);
  }

  const pdfData = (ref: string | null) => ({
    title: tTrip("name"),
    labels: {
      heading: t("pdf.heading"), reference: t("pdf.reference"), details: t("pdf.details"), date: t("fields.date"), pickup: t("fields.pickup"),
      package: t("pdf.package"), vehicle: t("steps.vehicle"), guests: t("steps.guests"), plan: t("summary.dayPlan"), included: t("summary.included"),
      toQuote: t("summary.toQuote"), price: t("summary.total"), perGuest: t("summary.perGuest"), note: t("pdf.note"),
    },
    reference: ref,
    details: {
      date: format.dateTime(new Date(`${date}T12:00:00Z`), { dateStyle: "long", timeZone: "UTC" }),
      pickup: `${pickupTime}, ${pickupPlace.trim()}`,
      package: t(`packages.${pkg}.name`),
      vehicle: t(`vehicles.${vehicle}.name`),
      guests: guestLines(),
    },
    plan: plan.map((s) => ({ time: s.time, label: t(`plan.${s.id}`) })),
    included: includedLines(),
    toQuote: quotedLines(),
    total: rwf(q.total),
    perGuest: rwf(q.perGuest),
    usd: t("summary.usd", { usd: format.number(q.usd), rate: format.number(rates.usdToRwf) }),
    contact: `${contact.phone}  |  ${contact.email}`,
    fileName: `SURA-Akagera-itinerary-${date || "trip"}.pdf`,
  });

  const submit = async () => {
    if (state === "saving") return;
    if (!name.trim()) return setError(t("errors.name"));
    if (!PHONE.test(phone.trim())) return setError(t("errors.phone"));
    setError(null);
    setState("saving");
    // Opened now, while it still counts as the customer's click (pop-up blockers).
    const waTab = window.open("", "_blank");
    const saved = await saveBooking({
      ...EMPTY_REQUEST,
      service: "tailored_trip",
      tripPlan: selection,
      destination: tTrip("name"),
      pickup: { name: pickupPlace.trim(), coords: null },
      startDate: date,
      time: pickupTime,
      passengers: everyone,
      guests: everyone,
      clientName: name.trim(),
      clientPhone: phone.trim(),
      notes: notes.trim(),
      grandTotal: q.total,
    });
    const ref = saved ? bookingRef(saved.id) : null;
    const total = saved?.total ?? q.total;
    const message = [
      t("whatsapp.header"),
      ref ? `${t("pdf.reference")}: ${ref}` : null,
      "",
      `${t("pdf.package")}: ${t(`packages.${pkg}.name`)}`,
      `${t("steps.vehicle")}: ${t(`vehicles.${vehicle}.name`)}`,
      `${t("fields.date")}: ${date}`,
      `${t("fields.pickup")}: ${pickupTime}, ${pickupPlace.trim()}`,
      ...guestLines(),
      "",
      ...includedLines().map((l) => `${t("summary.included")}: ${l}`),
      ...quotedLines().map((l) => `${t("summary.toQuote")}: ${l}`),
      `${q.hasQuotedItems ? t("summary.totalFrom") : t("summary.total")}: ${rwf(total)}`,
      "",
      `${t("fields.name")}: ${name.trim()}`,
      `${t("fields.phone")}: ${phone.trim()}`,
      notes.trim() ? `${t("fields.notes")}: ${notes.trim()}` : null,
    ].filter((l): l is string => l !== null).join("\n");
    const url = whatsAppHref(contact.whatsapp, message);
    if (waTab) waTab.location.assign(url);
    else window.location.assign(url);
    setReference(ref);
    setState("sent");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const summary = (
    <div className="rounded-2xl bg-card ring-1 ring-black/5 shadow-xl shadow-black/5 p-5 space-y-3">
      <div>
        <p className="text-sm font-extrabold text-foreground">{t("summary.title")}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{t("summary.who", { guests: everyone, vehicle: t(`vehicles.${vehicle}.name`) })}</p>
      </div>
      <ul className="space-y-1 border-t border-border pt-3 text-xs font-semibold text-foreground">
        {includedLines().map((l) => (
          <li key={l} className="flex gap-2"><Check className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />{l}</li>
        ))}
      </ul>
      {quotedLines().length > 0 && (
        <div className="border-t border-border pt-3">
          <p className="text-xs font-extrabold text-muted-foreground">{t("summary.toQuote")}</p>
          <p className="mt-1 text-xs text-muted-foreground">{quotedLines().join(", ")}</p>
        </div>
      )}
      {step !== "review" ? (
        <p className="border-t border-border pt-3 text-xs font-semibold text-muted-foreground">{t("summary.totalLater")}</p>
      ) : <div className="border-t border-border pt-3" aria-live="polite">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-xs font-semibold text-muted-foreground">{q.hasQuotedItems ? t("summary.perGuestFrom") : t("summary.perGuest")}</p>
          <Price value={rwf(q.perGuest)} className="text-xl font-extrabold tracking-tight text-foreground tabular-nums" />
        </div>
        <div className="mt-1 flex items-baseline justify-between gap-3">
          <p className="text-xs font-semibold text-muted-foreground">{q.hasQuotedItems ? t("summary.totalFrom") : t("summary.total")}</p>
          <Price value={rwf(q.total)} className="text-sm font-extrabold text-foreground tabular-nums" />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {t("summary.usd", { usd: format.number(q.usd), rate: format.number(rates.usdToRwf) })}
          {rates.rateUpdatedAt && <> · {t("summary.updated", { date: format.dateTime(new Date(rates.rateUpdatedAt), { dateStyle: "medium" }) })}</>}
        </p>
      </div>}
    </div>
  );

  const content = () => {
    if (state === "sent") {
      return (
        <motion.div key="sent" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-2xl rounded-2xl bg-card ring-1 ring-black/5 shadow-xl p-8 text-center space-y-5">
          <motion.div initial={{ scale: 0.6 }} animate={{ scale: 1 }} className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10"><Check className="h-7 w-7 text-primary" aria-hidden /></motion.div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">{t("sent.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("sent.text")}</p>
          {!reference && <p role="status" className="rounded-lg bg-muted px-4 py-3 text-sm font-semibold text-foreground">{t("sent.notSaved")}</p>}
          {reference && <p className="font-mono text-xl font-bold text-foreground">{reference}</p>}
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button type="button" onClick={() => void downloadTripPdf(pdfData(reference))} className={`h-14 px-6 ${primaryButton}`}>
              <Download className="h-4 w-4" aria-hidden /> {t("sent.pdf")}
            </button>
            <Link href="/iwacu/trips" className="h-14 px-6 rounded-xl border border-border bg-card font-extrabold uppercase tracking-widest text-xs inline-flex items-center justify-center">
              {t("sent.back")}
            </Link>
          </div>
        </motion.div>
      );
    }

    if (stage === "packages") {
      const ids = ["basic", "standard", "premium"] as const;
      return (
        <motion.div key="packages" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {/* The same opening as the other Iwacu pages. */}
          <section className="relative -mt-[calc(var(--header-h)+1rem)] short:-mt-[calc(var(--header-h)+0.5rem)] left-1/2 w-screen -translate-x-1/2 h-[65vh] min-h-[460px] pt-[var(--header-h)] pb-14 flex items-center justify-center overflow-hidden bg-foreground">
            <Image src="/backgrounds/akagera.jpg" alt="" fill priority sizes="100vw" className="object-cover" />
            <span aria-hidden className="absolute inset-0 bg-black/45" />
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: "easeOut" }} className="relative z-10 text-center px-6 max-w-4xl flex flex-col items-center gap-4">
              <Link href="/iwacu/trips" className="inline-flex min-h-10 items-center gap-2 px-4 border border-white/20 bg-black/50 backdrop-blur-md rounded-2xl text-xs font-bold uppercase tracking-widest text-white">
                <ArrowLeft className="h-3.5 w-3.5" aria-hidden /> {t("back")}
              </Link>
              <h1 className="text-4xl md:text-7xl font-extrabold text-white uppercase tracking-tighter leading-[0.95]">{tTrip("name")}</h1>
              <p className="text-white font-medium text-sm md:text-lg max-w-2xl">{tTrip("intro")}</p>
            </motion.div>
          </section>

          {/* Each card stays selected, and what it includes opens underneath. */}
          <div className="relative z-10 -mt-14 grid gap-4 md:grid-cols-3" role="radiogroup" aria-label={t("packagesLabel")}>
            {ids.map((id, i) => {
              const selected = preview === id;
              return (
                <motion.button key={id} type="button" role="radio" aria-checked={selected} onClick={() => setPreview(id)} whileHover={{ y: -6 }} whileTap={{ scale: 0.99 }}
                  initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: i * 0.1, ease: "easeOut" }}
                  className="group relative flex min-h-56 flex-col overflow-hidden rounded-2xl bg-foreground p-6 text-left text-white shadow-2xl shadow-black/30">
                  {/* A soft gold light in the corner, and a gold rule that fills when selected. */}
                  <span aria-hidden="true" className={`pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-secondary blur-3xl transition-opacity duration-500 ${selected ? "opacity-40" : "opacity-15 group-hover:opacity-30"}`} />
                  {selected && <motion.span layoutId="trip-package-ring" aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-2xl ring-2 ring-inset ring-secondary" />}
                  <span className="relative flex items-center justify-between gap-3">
                    <span className="text-xs font-extrabold uppercase tracking-[0.25em] text-secondary">{t(`packages.${id}.tier`)}</span>
                    <span className={`h-6 w-6 shrink-0 rounded-full border flex items-center justify-center transition-colors ${selected ? "border-secondary bg-secondary text-secondary-foreground" : "border-white/30"}`}>
                      {selected && <Check className="h-3.5 w-3.5" aria-hidden />}
                    </span>
                  </span>
                  <span className="relative mt-5 block text-4xl font-extrabold uppercase tracking-tighter leading-none">{t(`packages.${id}.name`)}</span>
                  <span className="relative mt-3 block text-sm leading-relaxed text-white/75">{t(`packages.${id}.note`)}</span>
                  <span className="relative mt-auto pt-5">
                    <span className={`block h-px origin-left bg-secondary transition-transform duration-500 ${selected ? "scale-x-100" : "scale-x-[0.2] group-hover:scale-x-50"}`} />
                    <span className="mt-3 block text-xs font-bold uppercase tracking-widest text-white/85">{t(`packages.${id}.vehicleLine`)}</span>
                  </span>
                </motion.button>
              );
            })}
          </div>

          {preview ? (
            <motion.section key={preview} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }}
              aria-live="polite" className="mt-4 rounded-2xl bg-card ring-1 ring-black/5 shadow-xl shadow-black/5 p-5 sm:p-6">
              <h2 className="text-xs font-extrabold uppercase tracking-widest text-primary">{t("packagePreview", { name: t(`packages.${preview}.name`) })}</h2>
              <div className="mt-3 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
                <ul className="grid flex-1 gap-x-8 gap-y-2 text-sm font-semibold text-foreground sm:grid-cols-2">
                  {(t.raw(`packages.${preview}.includes`) as string[]).map((line) => (
                    <li key={line} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />{line}</li>
                  ))}
                </ul>
                {preview === "premium" ? (
                  <a href={whatsAppHref(contact.whatsapp, t("packages.premium.whatsappText"))} target="_blank" rel="noopener noreferrer" className={`h-12 shrink-0 px-6 ${primaryButton}`}>
                    <MessageCircle className="h-4 w-4" aria-hidden /> {t("packages.premium.cta")}
                  </a>
                ) : (
                  <button type="button" onClick={() => startPackage(preview)} className={`h-12 shrink-0 px-6 ${primaryButton}`}>
                    {t(`packages.${preview}.cta`)} <ArrowRight className="h-4 w-4" aria-hidden />
                  </button>
                )}
              </div>
            </motion.section>
          ) : (
            <p className="mt-4 text-center text-sm font-semibold text-muted-foreground">{t("packagePrompt")}</p>
          )}

          {/* How a reservation goes, so nobody wonders what happens after the button. */}
          <section className="mt-6" aria-labelledby="route-heading">
            <h2 id="route-heading" className="text-xs font-extrabold uppercase tracking-widest text-primary">{t("route.title")}</h2>
            <ol className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {(["choose", "build", "send", "confirm"] as const).map((id, i) => (
                <li key={id} className="rounded-xl bg-card ring-1 ring-black/5 p-4">
                  <p className="text-xs font-extrabold text-primary tabular-nums">{i + 1}</p>
                  <p className="mt-1 text-sm font-extrabold text-foreground">{t(`route.${id}.title`)}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{t(`route.${id}.text`)}</p>
                </li>
              ))}
            </ol>
          </section>
        </motion.div>
      );
    }

    return (
      <motion.div key="build" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        {/* One slim line: where you are, and a way back to the packages. */}
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
          <h1 className="text-xl font-extrabold tracking-tight text-foreground">
            {tTrip("name")} <span className="text-primary">· {t(`packages.${pkg}.name`)}</span>
          </h1>
          <button type="button" onClick={() => setStage("packages")} className="min-h-10 text-xs font-extrabold uppercase tracking-widest text-muted-foreground hover:text-foreground">
            {t("changePackage")}
          </button>
        </div>

        <nav aria-label={t("stepsLabel")} className="mt-2">
          <ol className="grid grid-cols-6 gap-1.5">
            {STEPS.map((s, i) => (
              <li key={s}>
                <button type="button" onClick={() => goTo(s)} aria-current={s === step ? "step" : undefined} className="w-full text-left">
                  <span className="relative block h-1 rounded-full bg-muted overflow-hidden">
                    {i < index && <span className="absolute inset-0 bg-primary" />}
                    {i === index && <motion.span layoutId="trip-step" className="absolute inset-0 bg-primary" />}
                  </span>
                  <span className={`mt-1.5 hidden sm:block truncate text-xs font-extrabold ${i === index ? "text-primary" : "text-muted-foreground"}`}>
                    {i + 1} {t(`steps.${s}`)}
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </nav>

        <div className="mt-3 short:mt-2 grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px] items-start">
          <section className="rounded-2xl bg-card ring-1 ring-black/5 shadow-xl shadow-black/5 p-4 sm:p-5 short:py-3 overflow-hidden">
            <p className="sm:hidden text-xs font-extrabold uppercase tracking-widest text-primary">{t("stepOf", { step: index + 1, total: STEPS.length })}</p>
            <motion.div key={step} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }}>
              <h2 className="text-lg font-extrabold tracking-tight text-foreground">{t(`stepTitles.${step}`)}</h2>
              {error && <p role="alert" className="mt-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm font-semibold text-destructive">{error}</p>}
              {stepBody()}
            </motion.div>
          </section>

          <aside className="hidden lg:block lg:sticky lg:top-[calc(var(--header-h)+0.75rem)] space-y-3">
            {summary}
            <div className="flex gap-2">
              <button type="button" aria-label={index === 0 ? t("changePackage") : t("backStep")} onClick={backStep} className="h-12 w-12 shrink-0 rounded-xl border border-border bg-card inline-flex items-center justify-center">
                <ArrowLeft className="h-4 w-4" aria-hidden />
              </button>
              {step !== "review" && (
                <button type="button" onClick={() => goTo(STEPS[index + 1])} className={`h-12 flex-1 px-3 ${primaryButton}`}>
                  {t("next", { step: t(`steps.${STEPS[index + 1]}`) })} <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
                </button>
              )}
            </div>
          </aside>
        </div>

        {/* Phones: the price per guest and the next step stay at the bottom of the screen. */}
        <div className="lg:hidden fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 backdrop-blur-sm px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            {step === "review" ? (
              <div className="min-w-0">
                <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5"><Users className="h-3.5 w-3.5" aria-hidden />{q.hasQuotedItems ? t("summary.perGuestFrom") : t("summary.perGuest")}</p>
                <Price value={rwf(q.perGuest)} className="text-lg font-extrabold tabular-nums text-foreground" />
              </div>
            ) : (
              <p className="min-w-0 text-xs font-semibold text-muted-foreground">{t("summary.totalLater")}</p>
            )}
            <div className="flex gap-2">
              <button type="button" aria-label={index === 0 ? t("changePackage") : t("backStep")} onClick={backStep} className="h-12 w-12 rounded-xl border border-border bg-card inline-flex items-center justify-center">
                <ArrowLeft className="h-4 w-4" aria-hidden />
              </button>
              {step !== "review" && (
                <button type="button" onClick={() => goTo(STEPS[index + 1])} className={`h-12 px-5 ${primaryButton}`}>
                  {t("nextShort")} <ArrowRight className="h-4 w-4" aria-hidden />
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  function stepBody() {
    switch (step) {
      case "guests":
        return (
          <div className="mt-3 short:mt-1">
            {/* One slim row per nationality group, so they all fit at once. */}
            <div className="hidden sm:grid grid-cols-[minmax(0,1fr)_auto_auto] gap-x-6 px-1 text-xs font-extrabold text-muted-foreground">
              <span>{t("guestsStep.nationality")}</span>
              <span className="w-32 lg:w-[116px] text-center">{t("guestsStep.adultsShort")}</span>
              <span className="w-32 lg:w-[116px] text-center">{t("guestsStep.childrenShort")}</span>
            </div>
            <ul className="mt-1 divide-y divide-border">
              {GUEST_GROUPS.map((id) => (
                <li key={id} className="grid gap-2 py-2 short:py-1 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center sm:gap-x-6 px-1">
                  <div className="min-w-0">
                    <p className="text-sm font-extrabold text-foreground">{t(`groups.${id}.name`)}</p>
                    <p className="text-xs text-muted-foreground tabular-nums">
                      {t("guestsStep.entry", { adult: rwf(entryFee(id, "adult", rates, pricing)), child: rwf(entryFee(id, "child", rates, pricing)) })}
                    </p>
                  </div>
                  <div className="flex items-center justify-between sm:justify-center sm:w-32 lg:w-[116px]">
                    <span className="sm:hidden text-xs font-semibold text-muted-foreground">{t("guestsStep.adultsShort")}</span>
                    <Counter value={guests[id].adults} label={`${t(`groups.${id}.name`)}, ${t("guestsStep.adultsShort")}`} onChange={(n) => setCount(id, "adults", n)} />
                  </div>
                  <div className="flex items-center justify-between sm:justify-center sm:w-32 lg:w-[116px]">
                    <span className="sm:hidden text-xs font-semibold text-muted-foreground">{t("guestsStep.childrenShort")}</span>
                    <Counter value={guests[id].children} label={`${t(`groups.${id}.name`)}, ${t("guestsStep.childrenShort")}`} onChange={(n) => setCount(id, "children", n)} />
                  </div>
                </li>
              ))}
              <li className="flex items-center justify-between gap-3 py-2 short:py-1 px-1">
                <span className="text-sm font-extrabold text-foreground">{t("guestsStep.infants")}</span>
                <Counter value={guests.infants} label={t("guestsStep.infants")} onChange={(n) => { setError(null); setGuests((g) => ({ ...g, infants: n })); }} />
              </li>
            </ul>
            <p className="mt-2 short:mt-1 text-xs text-muted-foreground">{t("guestsStep.papers")}</p>
          </div>
        );
      case "date":
        return (
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="trip-date">{t("fields.date")}</Label>
              <Input id="trip-date" type="date" min={kigaliToday()} value={date} onChange={(e) => setDate(e.target.value)} className={field} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="trip-time">{t("fields.pickupTime")}</Label>
              <select id="trip-time" value={pickupTime} onChange={(e) => setPickupTime(e.target.value)} className={`${field} w-full px-4`}>
                {times.map((x) => <option key={x} value={x}>{x}</option>)}
              </select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="trip-place">{t("fields.pickup")}</Label>
              <Input id="trip-place" value={pickupPlace} maxLength={120} placeholder={t("fields.pickupPlaceholder")} onChange={(e) => setPickupPlace(e.target.value)} className={field} />
              <p className="text-xs text-muted-foreground">{t("dateStep.hint", { time: rates.latestPickup })}</p>
            </div>
          </div>
        );
      case "vehicle":
        return (
          <div className="mt-3 space-y-2" role="radiogroup" aria-label={t("steps.vehicle")}>
            <p className="text-sm text-muted-foreground">{t("vehicleStep.hint")}</p>
            {vehiclesFor(pkg).map((v) => (
              <Choice key={v} selected={vehicle === v} onClick={() => setVehicle(v)} title={t(`vehicles.${v}.name`)}
                note={`${t(`vehicles.${v}.note`)} ${t("vehicleStep.seats", { seats: vehicleSeats(v) })}`}
                side={rwf(carPrice(v, rates, pricing))} sideNote={approxUsd(carPrice(v, rates, pricing))} />
            ))}
            {!q.fits && <p role="alert" className="text-sm font-semibold text-destructive">{t("errors.vehicleSeats")}</p>}
            {pkg !== "basic" && vehicle !== "safari" && (
              <Choice role="checkbox" selected={guide} onClick={() => setGuide(!guide)} title={t("vehicleStep.guide")} note={t("vehicleStep.guideNote")} side={rwf(usdInRwf(rates.guideUsd, rates, pricing))} sideNote={approxUsd(usdInRwf(rates.guideUsd, rates, pricing))} />
            )}
          </div>
        );
      case "meals":
        return (
          <div className="mt-3 space-y-2">
            {pkg !== "basic" && <div className="space-y-2" role="radiogroup" aria-label={t("meals.lunch")}>
              {lunchChoicesFor(pkg).map((c) => (
                <Choice key={c} selected={lunch === c} onClick={() => setLunch(c)} title={t(`lunch.${c}.name`)} note={t(`lunch.${c}.note`)}
                  side={c === "none" ? undefined : t("perGuestPrice", { price: rwf(c === "buffet" ? rates.lunchBuffet : rates.lunchChosen) })} />
              ))}
            </div>}
            <div className="grid gap-2 sm:grid-cols-2">
              <Choice role="checkbox" selected={breakfast} onClick={() => setBreakfast(!breakfast)} title={t("meals.breakfast")} note={t("meals.quoted")} />
              <Choice role="checkbox" selected={dinner} onClick={() => setDinner(!dinner)} title={t("meals.dinner")} note={t("meals.quoted")} />
            </div>
          </div>
        );
      case "activities":
        return (
          <div className="mt-3 space-y-2">
            <p className="text-sm text-muted-foreground">{t("activitiesStep.hint")}</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {TRIP_ACTIVITIES.map((a) => {
                  const usd = activityUsd(a, guests);
                  const price = usd === null ? null : usdInRwf(usd, rates, pricing);
                  return (
                    <Choice key={a} role="checkbox" selected={allowedActivities.includes(a)} disabled={price === null} title={t(`activities.${a}.name`)} note={t(`activities.${a}.note`)}
                      side={price === null ? t("activitiesStep.minGuests", { count: activityMinimum(a) }) : rwf(price)} sideNote={price === null ? undefined : `$${format.number(usd ?? 0)}`}
                      onClick={() => setActivities((list) => (list.includes(a) ? list.filter((x) => x !== a) : [...list, a]))} />
                  );
              })}
            </div>
            {pkg === "standard" && (
              <div className="space-y-2 pt-1">
                <p className="text-sm font-extrabold text-foreground">{t("activitiesStep.stops")}</p>
                {stops.map((stop, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex gap-2">
                    <Input value={stop} maxLength={60} aria-label={`${t("activitiesStep.stop")} ${i + 1}`} placeholder={t("activitiesStep.stopsPlaceholder")}
                      onChange={(e) => setStops((list) => list.map((x, j) => (j === i ? e.target.value : x)))} className={field} />
                    <button type="button" aria-label={`${t("activitiesStep.removeStop")} ${i + 1}`} onClick={() => setStops((list) => list.filter((_, j) => j !== i))}
                      className="h-12 w-12 shrink-0 rounded-xl border border-border bg-card inline-flex items-center justify-center hover:text-destructive">
                      <X className="h-4 w-4" aria-hidden />
                    </button>
                  </motion.div>
                ))}
                {stops.length < 4 && (
                  <button type="button" onClick={() => setStops((list) => [...list, ""])}
                    className="min-h-11 px-4 rounded-xl border border-dashed border-border font-extrabold uppercase tracking-widest text-xs inline-flex items-center gap-2 hover:border-muted-foreground/50">
                    <Plus className="h-4 w-4" aria-hidden /> {t("activitiesStep.addStop")}
                  </button>
                )}
                <p className="text-xs text-muted-foreground">{t("activitiesStep.stopsHint")}</p>
              </div>
            )}
          </div>
        );
      case "review":
        return (
          <div className="mt-3 grid gap-5 xl:grid-cols-2">
            <div>
              <h3 className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground">{t("summary.dayPlan")}</h3>
              <ol className="mt-2 space-y-1">
                {plan.map((s) => (
                  <li key={s.id} className="flex gap-3 text-sm"><span className="w-12 shrink-0 font-extrabold tabular-nums text-primary">{s.time}</span><span className="text-foreground">{t(`plan.${s.id}`)}</span></li>
                ))}
              </ol>
              <p className="mt-2 text-xs text-muted-foreground">{t("reviewStep.planNote")}</p>
              <div className="mt-4 lg:hidden">{summary}</div>
            </div>
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="trip-name">{t("fields.name")}</Label>
                  <Input id="trip-name" value={name} maxLength={80} autoComplete="name" onChange={(e) => setName(e.target.value)} className={field} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="trip-phone">{t("fields.phone")}</Label>
                  <Input id="trip-phone" type="tel" value={phone} maxLength={30} autoComplete="tel" placeholder="+250 7…" onChange={(e) => setPhone(e.target.value)} className={field} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="trip-notes">{t("fields.notes")}</Label>
                <Textarea id="trip-notes" rows={2} value={notes} maxLength={600} onChange={(e) => setNotes(e.target.value)} />
              </div>
              <button type="button" disabled={state === "saving"} onClick={() => void submit()} className={`w-full h-12 px-6 disabled:opacity-70 ${primaryButton}`}>
                {state === "saving" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <MessageCircle className="h-4 w-4" aria-hidden />}
                {state === "saving" ? t("reviewStep.sending") : t("reviewStep.send")}
              </button>
              <button type="button" onClick={() => void downloadTripPdf(pdfData(null))}
                className="w-full h-12 px-6 rounded-xl border border-border bg-card font-extrabold uppercase tracking-widest text-xs inline-flex items-center justify-center gap-2">
                <Download className="h-4 w-4" aria-hidden /> {t("reviewStep.pdf")}
              </button>
              <p className="text-xs text-muted-foreground">{t("reviewStep.confirmNote")}</p>
            </div>
          </div>
        );
    }
  }

  return (
    <MotionConfig reducedMotion="user">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-10 pb-32 lg:pb-12 pt-[calc(var(--header-h)+1rem)] short:pt-[calc(var(--header-h)+0.5rem)]">
        {content()}
      </div>
    </MotionConfig>
  );
}
