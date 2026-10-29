"use client";

import React, { useId, useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { VEHICLES, fuelPriceFor, getVehicle } from "@/lib/pricing";
import { usePricing } from "@/components/pricing-provider";
import {
  BOOKING_LIMITS, brandForService, emptyBooking, isQuoteOnRequest, needsVehicle, parseBooking,
  type BookingField, type FieldError,
} from "@/lib/bookings";
import {
  BOOKING_STATUSES, BUDGET_BANDS, DRIVER_OPTION_TRIPS, TRIP_TYPES,
  type Booking, type BookingDetails, type BookingInput, type BookingService, type TripType,
} from "@/lib/types";
import { BrandBadge } from "./brand-badge";
import { AdminDialog } from "./admin-dialog";
import { AdminSelect } from "./admin-select";
import { useTripLabel } from "./trip-label";
import { rwf } from "./format";
import type { SaveOutcome } from "./bookings-panel";

type Errors = Partial<Record<BookingField, FieldError>>;
/** The form keeps numbers as typed text until it's saved. */
type Draft = Omit<BookingInput, "passengers" | "grandTotal" | "endDate" | "tripType" | "service" | "details"> & {
  passengers: string;
  grandTotal: string;
  endDate: string;
  tripType: TripType;
  /** "" only for bookings saved before services existed. */
  service: BookingService | "";
  details: Record<keyof BookingDetails, string>;
};

const DETAIL_KEYS = [
  "company", "vehicles", "trips", "experienceId", "experienceTitle", "packageId", "packageTitle", "guests", "tourId", "interests", "budget",
] as const satisfies readonly (keyof BookingDetails)[];

const toDraft = (b: BookingInput): Draft => ({
  ...b,
  passengers: String(b.passengers),
  grandTotal: b.grandTotal !== null && b.grandTotal > 0 ? String(b.grandTotal) : b.grandTotal === 0 ? "0" : "",
  endDate: b.endDate ?? "",
  tripType: b.tripType ?? "airport",
  service: b.service ?? "",
  details: Object.fromEntries(DETAIL_KEYS.map((k) => [k, b.details[k] === undefined ? "" : String(b.details[k])])) as Draft["details"],
});

/** Log a new WhatsApp booking, or edit one. Checked with the same rules the server uses. */
export function BookingEditor({
  open,
  booking,
  today,
  services,
  canCancel,
  onClose,
  onSave,
}: {
  open: boolean;
  /** null = new booking */
  booking: Booking | null;
  today: string;
  /** The services this person may log (their brands' services). */
  services: BookingService[];
  /** Whether "Cancelled" may be chosen (bookings:cancel). */
  canCancel: boolean;
  onClose: () => void;
  onSave: (input: BookingInput) => Promise<SaveOutcome>;
}) {
  const t = useTranslations("Admin.bookings.editor");
  const ta = useTranslations("Admin");
  return (
    <AdminDialog
      open={open}
      onClose={onClose}
      title={booking ? t("editTitle") : t("newTitle")}
      description={booking ? t("editSubtitle", { name: booking.clientName }) : t("newSubtitle")}
      closeLabel={ta("common.close")}
      size="lg"
      closeOnBackdrop={false}
    >
      {/* Keyed so each opening starts from the right booking */}
      <EditorForm key={booking?.id ?? "new"} booking={booking} today={today} services={services} canCancel={canCancel} onClose={onClose} onSave={onSave} />
    </AdminDialog>
  );
}

function EditorForm({
  booking,
  today,
  services,
  canCancel,
  onClose,
  onSave,
}: {
  booking: Booking | null;
  today: string;
  services: BookingService[];
  canCancel: boolean;
  onClose: () => void;
  onSave: (input: BookingInput) => Promise<SaveOutcome>;
}) {
  const t = useTranslations("Admin.bookings.editor");
  const ta = useTranslations("Admin");
  const tf = useTranslations("Admin.fuel");
  const format = useFormatter();
  const label = useTripLabel();
  const formId = useId();
  const [draft, setDraft] = useState<Draft>(() => toDraft(booking ?? emptyBooking(today, services[0])));
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
    if (errors[key as BookingField]) setErrors((e) => ({ ...e, [key]: undefined }));
  };
  const setDetail = (key: keyof BookingDetails, value: string) => {
    setDraft((d) => ({ ...d, details: { ...d.details, [key]: value } }));
    if (errors[`details.${key}`]) setErrors((e) => ({ ...e, [`details.${key}`]: undefined }));
  };

  // What the service asks for. Old bookings without a service keep the car fields.
  const service = draft.service || null;
  const withVehicle = needsVehicle(service);
  const brand = service ? brandForService(service) : booking?.brand ?? "movana";
  // Someone may edit an older booking's service only within their own brands.
  const serviceChoices = service && !services.includes(service) ? [service, ...services] : services;

  const pricing = usePricing();
  const vehicle = getVehicle(draft.vehicleId, pricing);
  const driverChoice = withVehicle && DRIVER_OPTION_TRIPS.includes(draft.tripType);
  // Which fuel this class runs on and the live price per litre quotes use.
  const fuelPrice = fuelPriceFor(vehicle, pricing);
  const fuelHint =
    fuelPrice === null
      ? t("hints.fuelElectric")
      : t("hints.fuel", { fuel: tf(vehicle.fuel), price: rwf(format, fuelPrice) });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Only the details this service uses, and no vehicle for services without one.
    const parsed = parseBooking({
      ...draft,
      service,
      tripType: withVehicle ? draft.tripType : null,
      vehicleId: withVehicle ? draft.vehicleId || VEHICLES[0].id : "",
    });
    if (!parsed.ok) {
      setErrors(parsed.errors);
      focusFirstError(formId);
      return;
    }
    setSaving(true);
    const outcome = await onSave(parsed.value);
    if (!outcome.ok) {
      setSaving(false);
      if (outcome.fields) {
        setErrors(outcome.fields);
        focusFirstError(formId);
      }
    }
  };

  const error = (field: BookingField) => {
    const code = errors[field];
    if (!code) return null;
    const key = field.startsWith("details.") ? field.slice(8) : field;
    const max = (BOOKING_LIMITS as Record<string, number>)[key] ?? (field.startsWith("details.") ? BOOKING_LIMITS.detailText : 0);
    // A message for this field if there is one ("errors.grandTotal.invalid"), else the general one.
    return t.has(`errors.${field}.${code}`) ? t(`errors.${field}.${code}`, { max }) : t(`errors.${code}`, { max });
  };

  return (
    <form id={formId} onSubmit={submit} noValidate className="space-y-6">
      <Section title={t("sections.client")}>
        <Field id="clientName" label={t("fields.clientName")} required error={error("clientName")}>
          <Input value={draft.clientName} onChange={(e) => set("clientName", e.target.value)} maxLength={BOOKING_LIMITS.clientName} autoComplete="off" />
        </Field>
        <Field id="clientPhone" label={t("fields.clientPhone")} hint={t("hints.clientPhone")} error={error("clientPhone")}>
          <Input value={draft.clientPhone} onChange={(e) => set("clientPhone", e.target.value)} inputMode="tel" placeholder="+250 7…" maxLength={BOOKING_LIMITS.clientPhone} autoComplete="off" />
        </Field>
      </Section>

      <Section title={t("sections.trip")}>
        <Field id="service" label={t("fields.service")} required error={error("service")}>
          <AdminSelect value={draft.service} onChange={(e) => set("service", e.target.value as Draft["service"])}>
            {!draft.service && <option value="">{t("noService")}</option>}
            {serviceChoices.map((x) => (
              <option key={x} value={x}>{ta(`services.${x}`)}</option>
            ))}
          </AdminSelect>
        </Field>
        {/* The brand follows from the service, here and on the server. */}
        <div className="space-y-2">
          <p className="text-sm font-medium">{t("fields.brand")}</p>
          <div className="flex h-9 items-center gap-2">
            <BrandBadge brand={brand} />
            <span className="text-xs text-muted-foreground">{t("hints.brand")}</span>
          </div>
        </div>
        {withVehicle && (
          <>
            <Field id="tripType" label={t("fields.tripType")} required error={error("tripType")}>
              <AdminSelect value={draft.tripType} onChange={(e) => set("tripType", e.target.value as TripType)}>
                {TRIP_TYPES.map((x) => (
                  <option key={x} value={x}>{ta(`tripTypes.${x}`)}</option>
                ))}
              </AdminSelect>
            </Field>
            <Field id="vehicleId" label={t("fields.vehicle")} hint={fuelHint} required error={error("vehicleId")}>
              <AdminSelect value={draft.vehicleId || VEHICLES[0].id} onChange={(e) => set("vehicleId", e.target.value)}>
                {VEHICLES.map((v) => (
                  <option key={v.id} value={v.id}>{label.vehicleName(v.id)}</option>
                ))}
              </AdminSelect>
            </Field>
          </>
        )}

        {service === "corporate" && (
          <>
            <Field id="company" label={t("fields.company")} required error={error("details.company")} wide>
              <Input value={draft.details.company} onChange={(e) => setDetail("company", e.target.value)} maxLength={BOOKING_LIMITS.company} />
            </Field>
            <Field id="vehicles" label={t("fields.vehicles")} error={error("details.vehicles")}>
              <Input type="number" min={1} max={BOOKING_LIMITS.maxCount} value={draft.details.vehicles} onChange={(e) => setDetail("vehicles", e.target.value)} />
            </Field>
            <Field id="trips" label={t("fields.trips")} error={error("details.trips")}>
              <Input type="number" min={1} max={BOOKING_LIMITS.maxCount} value={draft.details.trips} onChange={(e) => setDetail("trips", e.target.value)} />
            </Field>
          </>
        )}
        {service === "package" && (
          <>
            <Field id="experienceTitle" label={t("fields.experience")} required error={error("details.experienceTitle")}>
              <Input value={draft.details.experienceTitle} onChange={(e) => setDetail("experienceTitle", e.target.value)} maxLength={BOOKING_LIMITS.detailText} />
            </Field>
            <Field id="packageTitle" label={t("fields.package")} error={error("details.packageTitle")}>
              <Input value={draft.details.packageTitle} onChange={(e) => setDetail("packageTitle", e.target.value)} maxLength={BOOKING_LIMITS.detailText} />
            </Field>
            <Field id="guests" label={t("fields.guests")} required error={error("details.guests")}>
              <Input type="number" min={1} max={BOOKING_LIMITS.maxCount} value={draft.details.guests} onChange={(e) => setDetail("guests", e.target.value)} />
            </Field>
          </>
        )}
        {service === "custom_itinerary" && (
          <>
            <Field id="budget" label={t("fields.budget")} error={error("details.budget")}>
              <AdminSelect value={draft.details.budget} onChange={(e) => setDetail("budget", e.target.value)}>
                <option value="">{t("noBudget")}</option>
                {BUDGET_BANDS.map((x) => (
                  <option key={x} value={x}>{ta(`bookings.budget.${x}`)}</option>
                ))}
              </AdminSelect>
            </Field>
            <Field id="interests" label={t("fields.interests")} error={error("details.interests")} wide>
              <Textarea value={draft.details.interests} onChange={(e) => setDetail("interests", e.target.value)} maxLength={BOOKING_LIMITS.interests} rows={3} />
            </Field>
          </>
        )}

        {driverChoice && (
          <div className="sm:col-span-2">
            <p className="mb-2 text-sm font-medium">{t("fields.driver")}</p>
            <div role="radiogroup" aria-label={t("fields.driver")} className="inline-flex rounded-lg border bg-muted p-1">
              {([true, false] as const).map((withDriver) => {
                const selected = (vehicle.selfDrive ? draft.withDriver : true) === withDriver;
                const off = !withDriver && !vehicle.selfDrive;
                return (
                  <button
                    key={String(withDriver)}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    disabled={off}
                    onClick={() => set("withDriver", withDriver)}
                    className={cn(
                      "h-8 rounded-md px-3 text-sm font-medium transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-40",
                      selected ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {ta(withDriver ? "common.withDriver" : "common.selfDrive")}
                  </button>
                );
              })}
            </div>
            {!vehicle.selfDrive && (
              <p className="mt-1.5 text-xs text-muted-foreground">{t("hints.chauffeurOnly", { vehicle: label.vehicleName(vehicle.id) })}</p>
            )}
          </div>
        )}

        <Field id="pickup" label={t("fields.pickup")} error={error("pickup")}>
          <Input value={draft.pickup} onChange={(e) => set("pickup", e.target.value)} maxLength={BOOKING_LIMITS.pickup} placeholder={t("placeholders.pickup")} />
        </Field>
        <Field id="destination" label={t("fields.destination")} error={error("destination")}>
          <Input value={draft.destination} onChange={(e) => set("destination", e.target.value)} maxLength={BOOKING_LIMITS.destination} placeholder={t("placeholders.destination")} />
        </Field>
        <Field id="startDate" label={t("fields.startDate")} required error={error("startDate")}>
          <Input type="date" value={draft.startDate} onChange={(e) => set("startDate", e.target.value)} />
        </Field>
        <Field id="endDate" label={t("fields.endDate")} hint={t("hints.endDate")} error={error("endDate")}>
          <Input type="date" value={draft.endDate} min={draft.startDate || undefined} onChange={(e) => set("endDate", e.target.value)} />
        </Field>
        <Field id="time" label={t("fields.time")} error={error("time")}>
          <Input type="time" value={draft.time} onChange={(e) => set("time", e.target.value)} />
        </Field>
        <Field id="passengers" label={t("fields.passengers")} error={error("passengers")}>
          <Input type="number" min={1} max={BOOKING_LIMITS.maxPassengers} value={draft.passengers} onChange={(e) => set("passengers", e.target.value)} />
        </Field>
      </Section>

      <Section title={t("sections.price")}>
        <Field
          id="grandTotal"
          label={t("fields.grandTotal")}
          hint={isQuoteOnRequest(service) ? t("hints.grandTotalOnRequest") : t("hints.grandTotal")}
          required={!isQuoteOnRequest(service)}
          error={error("grandTotal")}
        >
          <div className="relative">
            <Input
              value={draft.grandTotal}
              onChange={(e) => set("grandTotal", e.target.value.replace(/[^\d\s,]/g, ""))}
              inputMode="numeric"
              placeholder="155800"
              className="pr-14 tabular-nums"
            />
            <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs font-medium text-muted-foreground">RWF</span>
          </div>
        </Field>
        <Field id="status" label={t("fields.status")} required error={error("status")}>
          <AdminSelect value={draft.status} onChange={(e) => set("status", e.target.value as Draft["status"])}>
            {BOOKING_STATUSES.filter((s) => s !== "cancelled" || canCancel || booking?.status === "cancelled").map((s) => (
              <option key={s} value={s}>{ta(`status.${s}`)}</option>
            ))}
          </AdminSelect>
        </Field>
        <Field id="notes" label={t("fields.notes")} error={error("notes")} wide>
          <Textarea
            value={draft.notes}
            onChange={(e) => set("notes", e.target.value)}
            maxLength={BOOKING_LIMITS.notes}
            rows={3}
            placeholder={t("placeholders.notes")}
          />
        </Field>
      </Section>

      <div className="flex flex-col-reverse gap-2 border-t pt-5 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
          {ta("common.cancel")}
        </Button>
        <Button type="submit" disabled={saving}>
          {saving && <Loader2 className="animate-spin" aria-hidden />}
          {booking ? t("save") : t("create")}
        </Button>
      </div>
    </form>
  );
}

function focusFirstError(formId: string) {
  requestAnimationFrame(() => {
    const el = document.getElementById(formId)?.querySelector<HTMLElement>("[aria-invalid='true']");
    el?.focus();
  });
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset>
      <legend className="mb-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">{title}</legend>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}

/** Label + control + hint/error, wired together for screen readers. */
function Field({
  id,
  label,
  hint,
  error,
  required,
  wide,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string | null;
  required?: boolean;
  wide?: boolean;
  children: React.ReactElement<Record<string, unknown>>;
}) {
  const base = useId();
  const inputId = `${base}-${id}`;
  const noteId = `${inputId}-note`;
  const note = error ?? hint;
  // Pass id/aria props to the control (or to the input inside a wrapper div).
  const wire = (el: React.ReactElement<Record<string, unknown>>): React.ReactElement => {
    const props = el.props as { children?: React.ReactNode };
    if (el.type === "div" && props.children) {
      const kids = React.Children.toArray(props.children) as React.ReactElement<Record<string, unknown>>[];
      return React.cloneElement(el, {}, [wire(kids[0]), ...kids.slice(1)]);
    }
    return React.cloneElement(el, {
      id: inputId,
      "aria-invalid": error ? true : undefined,
      "aria-describedby": note ? noteId : undefined,
      "aria-required": required || undefined,
    });
  };
  return (
    <div className={cn("space-y-2", wide && "sm:col-span-2")}>
      <Label htmlFor={inputId}>
        {label}
        {required && <span className="text-muted-foreground" aria-hidden>*</span>}
      </Label>
      {wire(children)}
      {note && (
        <p id={noteId} className={cn("text-xs", error ? "font-medium text-destructive" : "text-muted-foreground")}>
          {note}
        </p>
      )}
    </div>
  );
}
