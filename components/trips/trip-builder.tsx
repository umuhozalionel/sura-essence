"use client";

import React, { useMemo, useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { ArrowLeft, ArrowRight, Check, Download, Loader2, MessageCircle, Minus, Plus, Users } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSiteContact } from "@/components/site-settings-provider";
import { EMPTY_REQUEST, PHONE, bookingRef, saveBooking } from "@/components/booking-submit";
import { whatsAppHref } from "@/lib/cms/site-settings";
import { kigaliToday } from "@/lib/bookings";
import type { PricingConfig } from "@/lib/pricing";
import {
  GUEST_GROUPS, MAX_TRIP_GUESTS, TRIP_ACTIVITIES, carPrice, dayPlan, entryFee, lunchChoicesFor, noGuests, payingGuests, pickupTimes,
  quoteTrip, totalGuests, usdInRwf, vehicleSeats, vehiclesFor,
  type GuestGroup, type LunchChoice, type TripActivity, type TripGuests, type TripPackage, type TripRates, type TripSelection, type TripVehicle,
} from "@/lib/trips";
import { downloadTripPdf } from "./trip-pdf";

/**
 * The Akagera trip builder: six steps on one page, with the price beside them
 * (a bar at the bottom on phones). Prices here are for the customer; the server
 * works them out again from the same rules when the request is sent.
 * Words: messages/*.json, namespace "Trips".
 */
const STEPS = ["guests", "date", "vehicle", "meals", "activities", "review"] as const;
type StepId = (typeof STEPS)[number];

const field = "h-14 bg-card border border-border rounded-xl text-base sm:text-sm font-semibold";

function Counter({ value, label, min = 0, onChange, max }: { value: number; label: string; min?: number; max: number; onChange: (n: number) => void }) {
  const t = useTranslations("Trips.builder");
  return (
    <div className="flex items-center gap-1" role="group" aria-label={label}>
      <button type="button" aria-label={`${t("fewer")}: ${label}`} disabled={value <= min} onClick={() => onChange(value - 1)}
        className="h-10 w-10 rounded-lg border border-border bg-card flex items-center justify-center disabled:opacity-30">
        <Minus className="h-4 w-4" aria-hidden />
      </button>
      <span className="w-8 text-center text-sm font-extrabold tabular-nums" aria-live="polite">{value}</span>
      <button type="button" aria-label={`${t("more")}: ${label}`} disabled={value >= max} onClick={() => onChange(value + 1)}
        className="h-10 w-10 rounded-lg border border-border bg-card flex items-center justify-center disabled:opacity-30">
        <Plus className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}

function Choice({ selected, onClick, title, note, side, role = "radio" }: { selected: boolean; onClick: () => void; title: string; note?: string; side?: string; role?: "radio" | "checkbox" }) {
  return (
    <button type="button" role={role} aria-checked={selected} onClick={onClick}
      className={`w-full rounded-xl border p-4 text-left transition-colors flex items-start justify-between gap-4 ${selected ? "border-primary ring-1 ring-primary bg-primary/5" : "border-border bg-card hover:border-muted-foreground/40"}`}>
      <span className="min-w-0">
        <span className="block text-sm font-extrabold text-foreground">{title}</span>
        {note && <span className="mt-1 block text-xs text-muted-foreground leading-relaxed">{note}</span>}
      </span>
      <span className="shrink-0 flex items-center gap-3">
        {side && <span className="text-xs font-extrabold text-foreground tabular-nums whitespace-nowrap">{side}</span>}
        <span className={`h-5 w-5 rounded-full border flex items-center justify-center ${selected ? "border-primary bg-primary text-white" : "border-border"}`}>
          {selected && <Check className="h-3 w-3" aria-hidden />}
        </span>
      </span>
    </button>
  );
}

export function TripBuilder({ rates, pricing }: { rates: TripRates; pricing: PricingConfig }) {
  const t = useTranslations("Trips.builder");
  const tTrip = useTranslations("Trips.akagera");
  const format = useFormatter();
  const contact = useSiteContact();

  const [step, setStep] = useState<StepId>("guests");
  const [pkg, setPkg] = useState<TripPackage>("basic");
  const [vehicle, setVehicle] = useState<TripVehicle>("comfort");
  const [guests, setGuests] = useState<TripGuests>(() => ({ ...noGuests(), citizen: { adults: 2, children: 0 } }));
  const [date, setDate] = useState("");
  const times = useMemo(() => pickupTimes(rates), [rates]);
  const [pickupTime, setPickupTime] = useState(times[times.length - 1] ?? "");
  const [pickupPlace, setPickupPlace] = useState("");
  const [lunch, setLunch] = useState<LunchChoice>("buffet");
  const [breakfast, setBreakfast] = useState(false);
  const [dinner, setDinner] = useState(false);
  const [guide, setGuide] = useState(false);
  const [activities, setActivities] = useState<TripActivity[]>([]);
  const [extraStops, setExtraStops] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<"idle" | "saving" | "sent">("idle");
  const [reference, setReference] = useState<string | null>(null);

  const rwf = (n: number) => `${format.number(n)} RWF`;
  const selection: TripSelection = {
    tripId: "akagera", pkg, vehicle, guests, date, pickupTime, pickupPlace: pickupPlace.trim(), lunch, breakfast, dinner, guide, activities, extraStops: extraStops.trim(),
  };
  const q = quoteTrip(selection, rates, pricing);
  const paying = payingGuests(guests);
  const everyone = totalGuests(guests);
  const plan = dayPlan(selection);
  const index = STEPS.indexOf(step);

  const choosePackage = (next: TripPackage) => {
    setPkg(next);
    setVehicle(vehiclesFor(next)[0]);
    setLunch(next === "basic" ? "buffet" : "chosen");
  };
  const setCount = (id: GuestGroup, age: "adults" | "children", n: number) =>
    setGuests((g) => ({ ...g, [id]: { ...g[id], [age]: n } }));

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

  const pdfData = (ref: string | null) => ({
    title: tTrip("name"),
    labels: {
      heading: t("pdf.heading"),
      reference: t("pdf.reference"),
      details: t("pdf.details"),
      date: t("fields.date"),
      pickup: t("fields.pickup"),
      package: t("pdf.package"),
      vehicle: t("steps.vehicle"),
      guests: t("steps.guests"),
      plan: t("summary.dayPlan"),
      included: t("summary.included"),
      toQuote: t("summary.toQuote"),
      price: t("summary.total"),
      perGuest: t("summary.perGuest"),
      note: t("pdf.note"),
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
      lunch === "none" ? null : t(`lunch.${lunch}.name`),
      guide && vehicle !== "safari" ? t("included.guide") : null,
    ].filter((l): l is string => l !== null);
  }
  function quotedLines() {
    return [
      breakfast ? t("meals.breakfast") : null,
      dinner ? t("meals.dinner") : null,
      lunch === "none" ? t("lunch.none.quoted") : null,
      ...activities.map((a) => t(`activities.${a}.name`)),
      extraStops.trim() ? `${t("activitiesStep.stops")}: ${extraStops.trim()}` : null,
    ].filter((l): l is string => l !== null);
  }

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
      ...quotedLines().map((l) => `${t("summary.toQuote")}: ${l}`),
      `${t("summary.total")}: ${rwf(total)}`,
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
    <div className="rounded-2xl bg-card ring-1 ring-black/5 shadow-xl shadow-black/5 p-6 space-y-4">
      <div>
        <p className="text-sm font-extrabold text-foreground">{t("summary.title")}</p>
        <p className="mt-1 text-xs text-muted-foreground">{t("summary.who", { guests: everyone, vehicle: t(`vehicles.${vehicle}.name`) })}</p>
      </div>
      <ul className="space-y-2 border-t border-border pt-4 text-xs font-semibold text-foreground">
        {includedLines().map((l) => (
          <li key={l} className="flex gap-2"><Check className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />{l}</li>
        ))}
      </ul>
      {quotedLines().length > 0 && (
        <div className="border-t border-border pt-4">
          <p className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground">{t("summary.toQuote")}</p>
          <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
            {quotedLines().map((l) => <li key={l}>{l}</li>)}
          </ul>
        </div>
      )}
      <div className="border-t border-border pt-4" aria-live="polite">
        <p className="text-xs font-semibold text-muted-foreground">{q.hasQuotedItems ? t("summary.perGuestFrom") : t("summary.perGuest")}</p>
        <p className="text-2xl font-extrabold tracking-tight text-foreground tabular-nums">{rwf(q.perGuest)}</p>
        <p className="mt-3 text-xs font-semibold text-muted-foreground">{q.hasQuotedItems ? t("summary.totalFrom") : t("summary.total")}</p>
        <p className="text-lg font-extrabold text-foreground tabular-nums">{rwf(q.total)}</p>
        <p className="mt-2 text-xs text-muted-foreground">{t("summary.usd", { usd: format.number(q.usd), rate: format.number(rates.usdToRwf) })}</p>
        {rates.rateUpdatedAt && (
          <p className="mt-1 text-xs text-muted-foreground">
            {t("summary.updated", { date: format.dateTime(new Date(rates.rateUpdatedAt), { dateStyle: "medium" }) })}
          </p>
        )}
      </div>
    </div>
  );

  if (state === "sent") {
    return (
      <div className="mx-auto max-w-2xl px-6 pb-24 pt-[calc(var(--header-h)+3rem)]">
        <div className="rounded-2xl bg-card ring-1 ring-black/5 shadow-xl p-8 text-center space-y-5">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10"><Check className="h-7 w-7 text-primary" aria-hidden /></div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">{t("sent.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("sent.text")}</p>
          {reference && <p className="font-mono text-xl font-bold text-foreground">{reference}</p>}
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button type="button" onClick={() => void downloadTripPdf(pdfData(reference))}
              className="h-14 px-6 rounded-xl bg-primary hover:bg-primary-hover text-white font-extrabold uppercase tracking-widest text-xs inline-flex items-center justify-center gap-2">
              <Download className="h-4 w-4" aria-hidden /> {t("sent.pdf")}
            </button>
            <Link href="/iwacu/trips" className="h-14 px-6 rounded-xl border border-border bg-card font-extrabold uppercase tracking-widest text-xs inline-flex items-center justify-center">
              {t("sent.back")}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-10 pb-40 lg:pb-24 pt-[calc(var(--header-h)+2rem)]">
      <Link href="/iwacu/trips" className="inline-flex min-h-12 items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" aria-hidden /> {t("back")}
      </Link>
      <h1 className="mt-2 text-3xl md:text-5xl font-extrabold tracking-tighter text-foreground">{tTrip("name")}</h1>
      <p className="mt-2 max-w-3xl text-sm md:text-base text-muted-foreground">{tTrip("intro")}</p>

      {/* Packages: a starting point; the steps below fill in the details. */}
      <div className="mt-6 grid gap-3 md:grid-cols-3" role="radiogroup" aria-label={t("packagesLabel")}>
        {(["basic", "standard"] as const).map((id) => (
          <Choice key={id} selected={pkg === id} onClick={() => choosePackage(id)} title={t(`packages.${id}.name`)} note={t(`packages.${id}.note`)} />
        ))}
        <a href={whatsAppHref(contact.whatsapp, t("packages.premium.whatsappText"))} target="_blank" rel="noopener noreferrer"
          className="rounded-xl border border-border bg-card p-4 hover:border-muted-foreground/40 transition-colors flex items-start justify-between gap-4">
          <span>
            <span className="block text-sm font-extrabold text-foreground">{t("packages.premium.name")}</span>
            <span className="mt-1 block text-xs text-muted-foreground leading-relaxed">{t("packages.premium.note")}</span>
          </span>
          <MessageCircle className="h-5 w-5 shrink-0 text-primary" aria-hidden />
        </a>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[180px_minmax(0,1fr)_320px] items-start">
        {/* The steps */}
        <nav aria-label={t("stepsLabel")} className="hidden lg:block lg:sticky lg:top-[calc(var(--header-h)+1rem)]">
          <ol className="space-y-1">
            {STEPS.map((s, i) => (
              <li key={s}>
                <button type="button" onClick={() => goTo(s)} aria-current={s === step ? "step" : undefined}
                  className={`w-full min-h-11 rounded-lg px-3 text-left text-xs font-extrabold transition-colors ${s === step ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/50"}`}>
                  {i + 1}&nbsp;&nbsp;{t(`steps.${s}`)}
                </button>
              </li>
            ))}
          </ol>
        </nav>

        <section className="rounded-2xl bg-card ring-1 ring-black/5 shadow-xl shadow-black/5 p-5 sm:p-8">
          <p className="lg:hidden text-xs font-extrabold uppercase tracking-widest text-primary">{t("stepOf", { step: index + 1, total: STEPS.length })}</p>
          <h2 className="mt-1 lg:mt-0 text-xl font-extrabold tracking-tight text-foreground">{t(`steps.${step}`)}</h2>
          {error && <p role="alert" className="mt-3 rounded-lg bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">{error}</p>}

          {step === "guests" && (
            <div className="mt-5 space-y-3">
              <p className="text-sm text-muted-foreground">{t("guestsStep.hint")}</p>
              {GUEST_GROUPS.map((id) => (
                <div key={id} className="rounded-xl border border-border p-4">
                  <p className="text-sm font-extrabold text-foreground">{t(`groups.${id}.name`)}</p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs font-semibold text-muted-foreground">{t("guestsStep.adults", { fee: rwf(entryFee(id, "adult", rates, pricing)) })}</span>
                      <Counter value={guests[id].adults} label={`${t(`groups.${id}.name`)}, ${t("guestsStep.adultsShort")}`} max={MAX_TRIP_GUESTS} onChange={(n) => setCount(id, "adults", n)} />
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs font-semibold text-muted-foreground">{t("guestsStep.children", { fee: rwf(entryFee(id, "child", rates, pricing)) })}</span>
                      <Counter value={guests[id].children} label={`${t(`groups.${id}.name`)}, ${t("guestsStep.childrenShort")}`} max={MAX_TRIP_GUESTS} onChange={(n) => setCount(id, "children", n)} />
                    </div>
                  </div>
                </div>
              ))}
              <div className="rounded-xl border border-border p-4 flex items-center justify-between gap-3">
                <span className="text-sm font-extrabold text-foreground">{t("guestsStep.infants")}</span>
                <Counter value={guests.infants} label={t("guestsStep.infants")} max={MAX_TRIP_GUESTS} onChange={(n) => setGuests((g) => ({ ...g, infants: n }))} />
              </div>
              <p className="text-xs text-muted-foreground">{t("guestsStep.papers")}</p>
            </div>
          )}

          {step === "date" && (
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
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
          )}

          {step === "vehicle" && (
            <div className="mt-5 space-y-3" role="radiogroup" aria-label={t("steps.vehicle")}>
              <p className="text-sm text-muted-foreground">{t("vehicleStep.hint")}</p>
              {vehiclesFor(pkg).map((v) => (
                <Choice key={v} selected={vehicle === v} onClick={() => setVehicle(v)} title={t(`vehicles.${v}.name`)}
                  note={`${t(`vehicles.${v}.note`)} ${t("vehicleStep.seats", { seats: vehicleSeats(v) })}`}
                  side={rwf(carPrice(v, rates, pricing))} />
              ))}
              {!q.fits && <p role="alert" className="text-sm font-semibold text-destructive">{t("errors.vehicleSeats")}</p>}
              {vehicle !== "safari" && (
                <Choice role="checkbox" selected={guide} onClick={() => setGuide(!guide)} title={t("vehicleStep.guide")} note={t("vehicleStep.guideNote")} side={rwf(usdInRwf(rates.guideUsd, rates, pricing))} />
              )}
            </div>
          )}

          {step === "meals" && (
            <div className="mt-5 space-y-3">
              <div className="space-y-3" role="radiogroup" aria-label={t("meals.lunch")}>
                {lunchChoicesFor(pkg).map((c) => (
                  <Choice key={c} selected={lunch === c} onClick={() => setLunch(c)} title={t(`lunch.${c}.name`)} note={t(`lunch.${c}.note`)}
                    side={c === "none" ? undefined : t("perGuestPrice", { price: rwf(c === "buffet" ? rates.lunchBuffet : rates.lunchChosen) })} />
                ))}
              </div>
              <Choice role="checkbox" selected={breakfast} onClick={() => setBreakfast(!breakfast)} title={t("meals.breakfast")} note={t("meals.quoted")} />
              <Choice role="checkbox" selected={dinner} onClick={() => setDinner(!dinner)} title={t("meals.dinner")} note={t("meals.quoted")} />
            </div>
          )}

          {step === "activities" && (
            <div className="mt-5 space-y-3">
              <p className="text-sm text-muted-foreground">{t("activitiesStep.hint")}</p>
              {TRIP_ACTIVITIES.map((a) => (
                <Choice key={a} role="checkbox" selected={activities.includes(a)} title={t(`activities.${a}.name`)} note={t(`activities.${a}.note`)}
                  onClick={() => setActivities((list) => (list.includes(a) ? list.filter((x) => x !== a) : [...list, a]))} />
              ))}
              {pkg === "standard" && (
                <div className="space-y-2 pt-2">
                  <Label htmlFor="trip-stops">{t("activitiesStep.stops")}</Label>
                  <Textarea id="trip-stops" value={extraStops} maxLength={300} placeholder={t("activitiesStep.stopsPlaceholder")} onChange={(e) => setExtraStops(e.target.value)} />
                </div>
              )}
            </div>
          )}

          {step === "review" && (
            <div className="mt-5 space-y-6">
              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground">{t("summary.dayPlan")}</h3>
                <ol className="mt-3 space-y-2">
                  {plan.map((s) => (
                    <li key={s.id} className="flex gap-4 text-sm"><span className="w-12 shrink-0 font-extrabold tabular-nums text-primary">{s.time}</span><span className="text-foreground">{t(`plan.${s.id}`)}</span></li>
                  ))}
                </ol>
                <p className="mt-3 text-xs text-muted-foreground">{t("reviewStep.planNote")}</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="trip-name">{t("fields.name")}</Label>
                  <Input id="trip-name" value={name} maxLength={80} autoComplete="name" onChange={(e) => setName(e.target.value)} className={field} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="trip-phone">{t("fields.phone")}</Label>
                  <Input id="trip-phone" type="tel" value={phone} maxLength={30} autoComplete="tel" placeholder="+250 7…" onChange={(e) => setPhone(e.target.value)} className={field} />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="trip-notes">{t("fields.notes")}</Label>
                  <Textarea id="trip-notes" value={notes} maxLength={600} onChange={(e) => setNotes(e.target.value)} />
                </div>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <button type="button" disabled={!date} onClick={() => void downloadTripPdf(pdfData(null))}
                  className="h-14 px-6 rounded-xl border border-border bg-card font-extrabold uppercase tracking-widest text-xs inline-flex items-center justify-center gap-2 disabled:opacity-50">
                  <Download className="h-4 w-4" aria-hidden /> {t("reviewStep.pdf")}
                </button>
                <button type="button" disabled={state === "saving"} onClick={() => void submit()}
                  className="flex-1 h-14 px-6 rounded-xl bg-primary hover:bg-primary-hover text-white font-extrabold uppercase tracking-widest text-xs inline-flex items-center justify-center gap-2 disabled:opacity-70">
                  {state === "saving" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <MessageCircle className="h-4 w-4" aria-hidden />}
                  {state === "saving" ? t("reviewStep.sending") : t("reviewStep.send")}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">{t("reviewStep.confirmNote")}</p>
            </div>
          )}

          {step !== "review" && (
            <div className="hidden lg:flex justify-between gap-3 mt-8">
              <button type="button" disabled={index === 0} onClick={() => goTo(STEPS[index - 1])}
                className="h-14 px-5 rounded-xl border border-border bg-card font-extrabold uppercase tracking-widest text-xs inline-flex items-center gap-2 disabled:opacity-0">
                <ArrowLeft className="h-4 w-4" aria-hidden /> {t("backStep")}
              </button>
              <button type="button" onClick={() => goTo(STEPS[index + 1])}
                className="h-14 px-8 rounded-xl bg-primary hover:bg-primary-hover text-white font-extrabold uppercase tracking-widest text-xs inline-flex items-center gap-2">
                {t("next", { step: t(`steps.${STEPS[index + 1]}`) })} <ArrowRight className="h-4 w-4" aria-hidden />
              </button>
            </div>
          )}
          {step === "review" && (
            <button type="button" onClick={() => goTo("activities")} className="hidden lg:inline-flex mt-6 min-h-11 items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-muted-foreground">
              <ArrowLeft className="h-4 w-4" aria-hidden /> {t("backStep")}
            </button>
          )}
        </section>

        <aside className="hidden lg:block lg:sticky lg:top-[calc(var(--header-h)+1rem)]">{summary}</aside>
      </div>

      {/* Phones: the price per guest and the next step stay at the bottom of the screen. */}
      <div className="lg:hidden fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 backdrop-blur-sm px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5"><Users className="h-3.5 w-3.5" aria-hidden />{q.hasQuotedItems ? t("summary.perGuestFrom") : t("summary.perGuest")}</p>
            <p className="text-lg font-extrabold tabular-nums text-foreground">{rwf(q.perGuest)}</p>
          </div>
          <div className="flex gap-2">
            {index > 0 && (
              <button type="button" aria-label={t("backStep")} onClick={() => goTo(STEPS[index - 1])} className="h-12 w-12 rounded-xl border border-border bg-card inline-flex items-center justify-center">
                <ArrowLeft className="h-4 w-4" aria-hidden />
              </button>
            )}
            {step !== "review" && (
              <button type="button" onClick={() => goTo(STEPS[index + 1])} className="h-12 px-5 rounded-xl bg-primary text-white font-extrabold uppercase tracking-widest text-xs inline-flex items-center gap-2">
                {t("nextShort")} <ArrowRight className="h-4 w-4" aria-hidden />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
