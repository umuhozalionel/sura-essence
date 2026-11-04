"use client";

import React, { useMemo, useState } from "react";
import { MotionConfig, motion } from "framer-motion";
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

function Choice({ selected, onClick, title, note, side, role = "radio" }: { selected: boolean; onClick: () => void; title: string; note?: string; side?: string; role?: "radio" | "checkbox" }) {
  return (
    <motion.button type="button" role={role} aria-checked={selected} onClick={onClick} whileTap={{ scale: 0.99 }}
      className={`w-full rounded-xl border px-4 py-3 text-left transition-colors flex items-center justify-between gap-4 ${selected ? "border-primary ring-1 ring-primary bg-primary/5" : "border-border bg-card hover:border-muted-foreground/40"}`}>
      <span className="min-w-0">
        <span className="block text-sm font-extrabold text-foreground">{title}</span>
        {note && <span className="mt-0.5 block text-xs text-muted-foreground leading-snug">{note}</span>}
      </span>
      <span className="shrink-0 flex items-center gap-3">
        {side && <span className="text-xs font-extrabold text-foreground tabular-nums whitespace-nowrap">{side}</span>}
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
  const [step, setStep] = useState<StepId>("guests");
  const [pkg, setPkg] = useState<TripPackage>("basic");
  const [vehicle, setVehicle] = useState<TripVehicle>("comfort");
  const [guests, setGuests] = useState<TripGuests>(noGuests);
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

  const startPackage = (next: TripPackage) => {
    if (next !== pkg || stage === "packages") {
      setPkg(next);
      setVehicle(vehiclesFor(next)[0]);
      setLunch(next === "basic" ? "buffet" : "chosen");
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
      <div className="border-t border-border pt-3" aria-live="polite">
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
      </div>
    </div>
  );

  const content = () => {
    if (state === "sent") {
      return (
        <motion.div key="sent" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-2xl rounded-2xl bg-card ring-1 ring-black/5 shadow-xl p-8 text-center space-y-5">
          <motion.div initial={{ scale: 0.6 }} animate={{ scale: 1 }} className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10"><Check className="h-7 w-7 text-primary" aria-hidden /></motion.div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">{t("sent.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("sent.text")}</p>
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
      const cards = [
        { id: "basic" as const, from: carPrice("comfort", rates, pricing) },
        { id: "standard" as const, from: Math.min(...vehiclesFor("standard").map((v) => carPrice(v, rates, pricing))) },
        { id: "premium" as const, from: null },
      ];
      return (
        <motion.div key="packages" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Link href="/iwacu/trips" className="inline-flex min-h-11 items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" aria-hidden /> {t("back")}
          </Link>
          <h1 className="mt-1 text-3xl md:text-5xl font-extrabold tracking-tighter text-foreground">{tTrip("name")}</h1>
          <p className="mt-2 max-w-3xl text-sm md:text-base text-muted-foreground">{tTrip("intro")}</p>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {cards.map(({ id, from }, i) => (
              <motion.article key={id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} whileHover={{ y: -4 }}
                className={`flex flex-col rounded-2xl p-6 shadow-xl shadow-black/5 ${id === "premium" ? "bg-foreground text-white" : "bg-card ring-1 ring-black/5"}`}>
                <h2 className="text-2xl font-extrabold tracking-tight">{t(`packages.${id}.name`)}</h2>
                <p className={`mt-1 text-sm ${id === "premium" ? "text-white/75" : "text-muted-foreground"}`}>{t(`packages.${id}.note`)}</p>
                <ul className="mt-4 flex-1 space-y-2 text-sm font-semibold">
                  {(t.raw(`packages.${id}.includes`) as string[]).map((line) => (
                    <li key={line} className="flex gap-2"><Check className={`mt-0.5 h-4 w-4 shrink-0 ${id === "premium" ? "text-secondary" : "text-primary"}`} aria-hidden />{line}</li>
                  ))}
                </ul>
                <p className={`mt-5 text-xs font-semibold ${id === "premium" ? "text-white/75" : "text-muted-foreground"}`}>{t(`packages.${id}.priceLabel`)}</p>
                <p className="text-lg font-extrabold tabular-nums">{from === null ? t("packages.premium.price") : rwf(from)}</p>
                {id === "premium" ? (
                  <a href={whatsAppHref(contact.whatsapp, t("packages.premium.whatsappText"))} target="_blank" rel="noopener noreferrer" className={`mt-4 h-12 ${primaryButton}`}>
                    <MessageCircle className="h-4 w-4" aria-hidden /> {t("packages.premium.cta")}
                  </a>
                ) : (
                  <button type="button" onClick={() => startPackage(id)} className={`mt-4 h-12 ${primaryButton}`}>
                    {t(`packages.${id}.cta`)} <ArrowRight className="h-4 w-4" aria-hidden />
                  </button>
                )}
              </motion.article>
            ))}
          </div>

          {/* How a reservation goes, so nobody wonders what happens after the button. */}
          <section className="mt-8" aria-labelledby="route-heading">
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
              {index > 0 && (
                <button type="button" aria-label={t("backStep")} onClick={() => goTo(STEPS[index - 1])} className="h-12 w-12 shrink-0 rounded-xl border border-border bg-card inline-flex items-center justify-center">
                  <ArrowLeft className="h-4 w-4" aria-hidden />
                </button>
              )}
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
            <div className="min-w-0">
              <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5"><Users className="h-3.5 w-3.5" aria-hidden />{q.hasQuotedItems ? t("summary.perGuestFrom") : t("summary.perGuest")}</p>
              <Price value={rwf(q.perGuest)} className="text-lg font-extrabold tabular-nums text-foreground" />
            </div>
            <div className="flex gap-2">
              {index > 0 && (
                <button type="button" aria-label={t("backStep")} onClick={() => goTo(STEPS[index - 1])} className="h-12 w-12 rounded-xl border border-border bg-card inline-flex items-center justify-center">
                  <ArrowLeft className="h-4 w-4" aria-hidden />
                </button>
              )}
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
                side={rwf(carPrice(v, rates, pricing))} />
            ))}
            {!q.fits && <p role="alert" className="text-sm font-semibold text-destructive">{t("errors.vehicleSeats")}</p>}
            {vehicle !== "safari" && (
              <Choice role="checkbox" selected={guide} onClick={() => setGuide(!guide)} title={t("vehicleStep.guide")} note={t("vehicleStep.guideNote")} side={rwf(usdInRwf(rates.guideUsd, rates, pricing))} />
            )}
          </div>
        );
      case "meals":
        return (
          <div className="mt-3 space-y-2">
            <div className="space-y-2" role="radiogroup" aria-label={t("meals.lunch")}>
              {lunchChoicesFor(pkg).map((c) => (
                <Choice key={c} selected={lunch === c} onClick={() => setLunch(c)} title={t(`lunch.${c}.name`)} note={t(`lunch.${c}.note`)}
                  side={c === "none" ? undefined : t("perGuestPrice", { price: rwf(c === "buffet" ? rates.lunchBuffet : rates.lunchChosen) })} />
              ))}
            </div>
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
              {TRIP_ACTIVITIES.map((a) => (
                <Choice key={a} role="checkbox" selected={activities.includes(a)} title={t(`activities.${a}.name`)} note={t(`activities.${a}.note`)}
                  onClick={() => setActivities((list) => (list.includes(a) ? list.filter((x) => x !== a) : [...list, a]))} />
              ))}
            </div>
            {pkg === "standard" && (
              <div className="space-y-2 pt-1">
                <Label htmlFor="trip-stops">{t("activitiesStep.stops")}</Label>
                <Textarea id="trip-stops" value={extraStops} maxLength={300} placeholder={t("activitiesStep.stopsPlaceholder")} onChange={(e) => setExtraStops(e.target.value)} />
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
