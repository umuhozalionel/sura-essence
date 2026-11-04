"use client";

import React, { useId, useMemo, useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { ArrowRight, Building2, Calendar, Loader2, Minus, Plus, Sparkles, Ticket, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "@/i18n/navigation";
import { useSiteContact } from "@/components/site-settings-provider";
import { whatsAppHref } from "@/lib/cms/site-settings";
import { BOOKING_LIMITS } from "@/lib/bookings";
import { BUDGET_BANDS, type BookingBrand, type BudgetBand } from "@/lib/types";
import type { BookingRequest } from "@/lib/booking-request";
import type { ReservableExperience } from "@/lib/cms/site-data";
import { EMPTY_REQUEST, PHONE, bookingRef, confirmationHref, saveBooking } from "./booking-submit";

/*
 * The booking requests that aren't a car on a route, shown in place of the
 * booking steps when their tab is picked:
 *   corporate         SURA Movana: company transport. No price; the team quotes.
 *   package           SURA Iwacu: an experience's package for some guests. The
 *                     server prices it from the package's tier × guests.
 *   custom_itinerary  SURA Iwacu: a trip planned around them. No price; the team quotes.
 * Like the car form, each saves through /api/bookings, opens WhatsApp with the
 * reference and the server's total, then goes to the brand's confirmation page.
 * Words: BookingForm.requests.
 */

export type RequestKind = "corporate" | "package" | "custom_itinerary";

type ReadableParams = { get(name: string): string | null };

const cx = {
  label: "text-xs font-bold text-muted-foreground uppercase tracking-wider",
  input:
    "h-14 bg-card border border-border rounded-xl text-base sm:text-sm font-semibold text-foreground placeholder:text-muted-foreground placeholder:font-medium shadow-sm shadow-black/[0.02] hover:border-muted-foreground/40 focus-visible:ring-4 focus-visible:ring-primary/10 focus-visible:ring-offset-0 focus-visible:border-primary transition-all",
  select:
    "h-14 w-full appearance-none bg-card border border-border rounded-xl px-4 text-base sm:text-sm font-semibold text-foreground shadow-sm shadow-black/[0.02] hover:border-muted-foreground/40 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/10 focus-visible:border-primary transition-all",
} as const;

const ICONS: Record<RequestKind, React.ElementType> = { corporate: Building2, package: Ticket, custom_itinerary: Sparkles };

const isoDate = (v: string | null) => (v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : "");

export function BookingRequestForm({
  kind,
  brand,
  experiences = [],
  params,
}: {
  kind: RequestKind;
  brand: BookingBrand;
  /** Packages the Iwacu form can book (lib/cms/site-data.ts getReservableExperiences). */
  experiences?: ReservableExperience[];
  /** The page's query: ?experience=<slug>&package=<id>&guests=2 pre-select a package. */
  params: ReadableParams | null;
}) {
  const t = useTranslations("BookingForm.requests");
  const tf = useTranslations("BookingForm");
  const format = useFormatter();
  const router = useRouter();
  const contact = useSiteContact();
  const baseId = useId();
  const Icon = ICONS[kind];

  // A link can pre-select the experience and package (from an experience page).
  const [experienceId, setExperienceId] = useState(() => {
    const wanted = params?.get("experience") ?? params?.get("event") ?? "";
    if (experiences.some((e) => e.slug === wanted)) return wanted;
    // A link to a trip that can't be reserved here: the visitor chooses, never a different trip by default.
    return wanted ? "" : experiences[0]?.slug ?? "";
  });
  const experience = experiences.find((e) => e.slug === experienceId) ?? null;
  const [packageId, setPackageId] = useState(() => {
    const wanted = params?.get("package") ?? "";
    const e = experiences.find((x) => x.slug === experienceId);
    return e?.packages.some((p) => p.id === wanted) ? wanted : e?.packages[0]?.id ?? "";
  });
  const pkg = experience?.packages.find((p) => p.id === packageId) ?? experience?.packages[0] ?? null;

  const [form, setForm] = useState(() => ({
    company: "",
    vehicles: "",
    trips: "",
    startDate: isoDate(params?.get("date") ?? null),
    endDate: "",
    guests: Math.max(1, Math.min(Number(params?.get("guests")) || 2, 50)),
    interests: "",
    budget: "" as BudgetBand | "",
    name: "",
    phone: "",
    notes: "",
  }));
  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => setForm((f) => ({ ...f, [key]: value }));
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<"idle" | "saving" | "notSaved">("idle");

  // The price shown before sending; the server works it out again from the same tier.
  const estimate = kind === "package" && pkg ? { amount: pkg.amount * form.guests, currency: pkg.currency } : null;
  const date = kind === "package" ? experience?.startDate ?? form.startDate : form.startDate;

  const missing = (): string | null => {
    if (kind === "corporate" && !form.company.trim()) return "company";
    if (kind === "package" && (!experience || !pkg)) return "package";
    if (!date) return "date";
    if (form.endDate && form.endDate < date) return "endDate";
    if (!form.name.trim()) return "name";
    if (!PHONE.test(form.phone.trim())) return form.phone.trim() ? "phoneInvalid" : "phone";
    return null;
  };

  const buildRequest = (): BookingRequest => {
    const count = (v: string) => (/^\d+$/.test(v) && Number(v) > 0 ? Number(v) : null);
    const shared = {
      ...EMPTY_REQUEST,
      startDate: date,
      endDate: kind !== "package" && form.endDate && form.endDate !== date ? form.endDate : null,
      clientName: form.name.trim(),
      clientPhone: form.phone.trim(),
      notes: form.notes.trim(),
    };
    switch (kind) {
      case "corporate":
        return {
          ...shared, service: "corporate", company: form.company.trim(),
          vehicles: count(form.vehicles), tripsCount: count(form.trips), destination: form.company.trim(),
        };
      case "package":
        return {
          ...shared, service: "package", experienceId: experience?.slug ?? null, packageId: pkg?.id ?? null,
          guests: form.guests, passengers: form.guests, destination: experience?.title ?? "",
          grandTotal: estimate && estimate.currency === "RWF" ? estimate.amount : null,
        };
      case "custom_itinerary":
        return {
          ...shared, service: "custom_itinerary", passengers: form.guests, interests: form.interests.trim(),
          budget: form.budget || null,
        };
    }
  };

  const message = (r: BookingRequest, ref: string | null, total: number | null) => {
    const tw = (key: string, values?: Record<string, string | number>) => tf(`whatsapp.${key}`, values);
    const dash = tw("empty");
    const lines: (string | null)[] = [
      t(`${kind}.whatsappHeader`),
      ref ? `${tw("reference")}: ${ref}` : null,
      "",
      r.company ? `${t("fields.company")}: ${r.company}` : null,
      r.vehicles ? `${t("fields.vehicles")}: ${r.vehicles}` : null,
      r.tripsCount ? `${t("fields.trips")}: ${r.tripsCount}` : null,
      kind === "package" && experience ? `${t("fields.experience")}: ${experience.title}` : null,
      kind === "package" && pkg ? `${t("fields.package")}: ${pkg.title}` : null,
      kind !== "corporate" ? `${t("fields.guests")}: ${r.guests ?? r.passengers}` : null,
      r.interests ? `${t("fields.interests")}: ${r.interests}` : null,
      r.budget ? `${t("fields.budget")}: ${t(`budget.${r.budget}`)}` : null,
      `${tw("date")}: ${r.startDate || dash}${r.endDate ? ` → ${r.endDate}` : ""}`,
      "",
      `${tw("name")}: ${r.clientName}`,
      `${tw("phone")}: ${r.clientPhone}`,
      r.notes ? `${tw("notes")}: ${r.notes}` : null,
      "",
      kind === "package" && estimate
        ? `${tw("total")}: ${format.number(total ?? estimate.amount)} ${estimate.currency}`
        : `${tw("total")}: ${t("quoteOnRequest")}`,
    ];
    return lines
      .filter((l): l is string => l !== null)
      .filter((l, i, all) => l !== "" || (i > 0 && all[i - 1] !== ""))
      .join("\n");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (state === "saving") return;
    const gap = missing();
    if (gap) {
      setError(t(`required.${gap}`));
      return;
    }
    setError(null);
    setState("saving");
    // Opened now, while it still counts as the customer's click (pop-up blockers).
    const waTab = window.open("", "_blank");
    const request = buildRequest();
    const saved = await saveBooking(request);
    const ref = saved ? bookingRef(saved.id) : null;
    const url = whatsAppHref(contact.whatsapp, message(request, ref, saved?.total ?? null));
    if (waTab) {
      waTab.location.assign(url);
      if (saved) {
        router.push(confirmationHref(brand, ref, request.service, request.startDate));
        return;
      }
      setState("notSaved");
    } else {
      window.location.assign(url); // pop-ups blocked: WhatsApp opens here instead
    }
  };

  const field = (name: string) => `${baseId}-${name}`;
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const shownError = error && missing() ? error : null;

  return (
    <form onSubmit={submit} noValidate className="flex flex-1 flex-col min-h-0">
      <div className="px-6 py-8 sm:p-10 short:px-6 short:py-3 flex-1 space-y-6 short:space-y-3">
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Icon className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-xl font-extrabold tracking-tight text-foreground">{t(`${kind}.title`)}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t(`${kind}.intro`)}</p>
          </div>
        </div>

        {kind === "corporate" && (
          <div className="grid gap-4 @xl:grid-cols-2">
            <div className="space-y-2 @xl:col-span-2">
              <Label htmlFor={field("company")} className={cx.label}>{t("fields.company")} *</Label>
              <Input id={field("company")} value={form.company} onChange={(e) => set("company", e.target.value)} maxLength={BOOKING_LIMITS.company} autoComplete="organization" className={cx.input} />
            </div>
            <div className="space-y-2">
              <Label htmlFor={field("vehicles")} className={cx.label}>{t("fields.vehicles")}</Label>
              <Input id={field("vehicles")} type="number" inputMode="numeric" min={1} max={BOOKING_LIMITS.maxCount} value={form.vehicles} onChange={(e) => set("vehicles", e.target.value)} className={cx.input} />
            </div>
            <div className="space-y-2">
              <Label htmlFor={field("trips")} className={cx.label}>{t("fields.trips")}</Label>
              <Input id={field("trips")} type="number" inputMode="numeric" min={1} max={BOOKING_LIMITS.maxCount} value={form.trips} onChange={(e) => set("trips", e.target.value)} className={cx.input} />
            </div>
          </div>
        )}

        {kind === "package" && (
          experiences.length === 0 ? (
            <p className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">{t("package.none")}</p>
          ) : (
            <div className="grid gap-4 @xl:grid-cols-2">
              <div className="space-y-2 @xl:col-span-2">
                <Label htmlFor={field("experience")} className={cx.label}>{t("fields.experience")} *</Label>
                <select
                  id={field("experience")}
                  value={experienceId}
                  onChange={(e) => {
                    setExperienceId(e.target.value);
                    setPackageId(experiences.find((x) => x.slug === e.target.value)?.packages[0]?.id ?? "");
                  }}
                  className={cx.select}
                >
                  {!experience && <option value="" disabled>{t("package.choose")}</option>}
                  {experiences.map((x) => (
                    <option key={x.slug} value={x.slug}>{x.title}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2 @xl:col-span-2">
                <p className={cx.label}>{t("fields.package")} *</p>
                <div role="radiogroup" aria-label={t("fields.package")} className="grid gap-3 @xl:grid-cols-2">
                  {experience?.packages.map((p) => {
                    const on = p.id === pkg?.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        role="radio"
                        aria-checked={on}
                        onClick={() => setPackageId(p.id)}
                        className={`min-h-14 rounded-xl border p-4 text-left transition-colors ${on ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-border bg-card hover:border-muted-foreground/40"}`}
                      >
                        <span className="block text-sm font-extrabold text-foreground">{p.title}</span>
                        <span className="mt-1 block text-xs font-semibold text-muted-foreground">
                          {t("package.perGuest", { price: `${format.number(p.amount)} ${p.currency}` })}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )
        )}

        {/* When, and how many */}
        <div className="grid gap-4 @xl:grid-cols-2">
          {kind === "package" && experience?.startDate ? (
            <div className="space-y-2">
              <p className={cx.label}>{t("fields.date")}</p>
              <p className="flex h-14 items-center gap-3 rounded-xl border border-border bg-muted/40 px-4 text-sm font-semibold text-foreground">
                <Calendar className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                {format.dateTime(new Date(`${experience.startDate}T12:00:00Z`), { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor={field("startDate")} className={cx.label}>{t(kind === "custom_itinerary" ? "fields.arrival" : "fields.date")} *</Label>
              <Input id={field("startDate")} type="date" min={today} value={form.startDate} onChange={(e) => set("startDate", e.target.value)} className={cx.input} />
            </div>
          )}
          {kind !== "package" && (
            <div className="space-y-2">
              <Label htmlFor={field("endDate")} className={cx.label}>{t(kind === "custom_itinerary" ? "fields.departure" : "fields.endDate")}</Label>
              <Input id={field("endDate")} type="date" min={form.startDate || today} value={form.endDate} onChange={(e) => set("endDate", e.target.value)} className={cx.input} />
            </div>
          )}
          {kind !== "corporate" && (
            <div className="space-y-2">
              <p id={field("guests")} className={cx.label}>{t(kind === "package" ? "fields.guests" : "fields.travellers")} *</p>
              <div role="group" aria-labelledby={field("guests")} className="flex h-14 items-center justify-between rounded-xl border border-border bg-card px-2">
                <button type="button" onClick={() => set("guests", Math.max(1, form.guests - 1))} aria-label={t("fewer")} className="flex h-12 w-12 items-center justify-center rounded-lg text-muted-foreground hover:text-primary">
                  <Minus className="h-4 w-4" aria-hidden="true" />
                </button>
                <span className="flex items-center gap-2 text-base font-extrabold tabular-nums text-foreground">
                  <Users className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  {form.guests}
                </span>
                <button type="button" onClick={() => set("guests", Math.min(50, form.guests + 1))} aria-label={t("more")} className="flex h-12 w-12 items-center justify-center rounded-lg text-muted-foreground hover:text-primary">
                  <Plus className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          )}
          {kind === "custom_itinerary" && (
            <div className="space-y-2">
              <Label htmlFor={field("budget")} className={cx.label}>{t("fields.budget")}</Label>
              <select id={field("budget")} value={form.budget} onChange={(e) => set("budget", e.target.value as BudgetBand | "")} className={cx.select}>
                <option value="">{t("budget.unsure")}</option>
                {BUDGET_BANDS.map((b) => (
                  <option key={b} value={b}>{t(`budget.${b}`)}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {kind === "custom_itinerary" && (
          <div className="space-y-2">
            <Label htmlFor={field("interests")} className={cx.label}>{t("fields.interests")}</Label>
            <Textarea
              id={field("interests")}
              value={form.interests}
              onChange={(e) => set("interests", e.target.value)}
              maxLength={BOOKING_LIMITS.interests}
              rows={3}
              placeholder={t("placeholders.interests")}
              className="min-h-24 bg-card border border-border rounded-xl text-base sm:text-sm font-medium"
            />
          </div>
        )}

        {/* About them */}
        <div className="grid gap-4 @xl:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor={field("name")} className={cx.label}>{t(kind === "corporate" ? "fields.contact" : "fields.name")} *</Label>
            <Input id={field("name")} value={form.name} onChange={(e) => set("name", e.target.value)} autoComplete="name" maxLength={BOOKING_LIMITS.clientName} className={cx.input} />
          </div>
          <div className="space-y-2">
            <Label htmlFor={field("phone")} className={cx.label}>{t("fields.phone")} *</Label>
            <Input id={field("phone")} type="tel" inputMode="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} autoComplete="tel" placeholder="+250 7…" maxLength={BOOKING_LIMITS.clientPhone} className={cx.input} />
          </div>
          <div className="space-y-2 @xl:col-span-2">
            <Label htmlFor={field("notes")} className={cx.label}>{t("fields.notes")}</Label>
            <Textarea
              id={field("notes")}
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              maxLength={BOOKING_LIMITS.notes}
              rows={3}
              placeholder={t(`${kind}.notesPlaceholder`)}
              className="min-h-24 bg-card border border-border rounded-xl text-base sm:text-sm font-medium"
            />
          </div>
        </div>
      </div>

      {/* Footer: the price (or "quote on request") and send */}
      <div className="sticky bottom-0 z-20 px-6 py-5 sm:px-10 sm:py-4 short:px-6 short:py-2 border-t border-border bg-background/95 backdrop-blur-sm flex-shrink-0 rounded-b-2xl lg:rounded-none">
        <div className="flex flex-col gap-4 @xl:flex-row @xl:items-center @xl:gap-6 @2xl:gap-8">
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-end gap-4 @xl:flex-col @xl:items-start @xl:gap-0 @2xl:flex-row @2xl:justify-start @2xl:items-baseline @2xl:gap-4">
              <span className="text-xs font-extrabold text-muted-foreground uppercase tracking-widest">{tf("totalEstimate")}</span>
              {estimate ? (
                <span className="text-2xl @2xl:text-3xl font-extrabold text-foreground tracking-tighter">
                  {format.number(estimate.amount)} <span className="text-sm text-primary">{estimate.currency}</span>
                </span>
              ) : (
                <span className="text-sm font-extrabold text-foreground">{t("quoteOnRequest")}</span>
              )}
            </div>
            <p className="mt-1 text-xs font-semibold text-muted-foreground text-right @xl:text-left">
              {estimate ? t("package.priceNote", { guests: form.guests }) : t("quoteNote")}
            </p>
          </div>
          <button
            type="submit"
            disabled={state === "saving"}
            className="h-14 short:h-11 px-6 @2xl:min-w-[260px] inline-flex items-center justify-center rounded-xl bg-foreground hover:bg-primary text-white font-extrabold uppercase tracking-widest text-xs shadow-lg shadow-black/10 transition-colors duration-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30 disabled:opacity-70"
          >
            {state === "saving" ? tf("submitting") : t(`${kind}.submit`)}
            {state === "saving"
              ? <Loader2 className="ml-3 w-4 h-4 animate-spin" aria-hidden="true" />
              : <ArrowRight className="ml-3 w-4 h-4" aria-hidden="true" />}
          </button>
        </div>
        <div aria-live="polite" className="empty:hidden mt-3 text-xs font-semibold">
          {shownError ? (
            <p className="text-destructive">{shownError}</p>
          ) : state === "notSaved" ? (
            <p className="text-muted-foreground">{tf("submitNotSaved")}</p>
          ) : null}
        </div>
      </div>
    </form>
  );
}
