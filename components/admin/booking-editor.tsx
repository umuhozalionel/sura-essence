"use client";

import React, { useId, useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { VEHICLES, getVehicle } from "@/lib/pricing";
import { BOOKING_LIMITS, emptyBooking, parseBooking, type FieldError } from "@/lib/bookings";
import {
  BOOKING_STATUSES, DRIVER_OPTION_TRIPS, TRIP_TYPES, type Booking, type BookingInput, type TripType,
} from "@/lib/types";
import { AdminDialog } from "./admin-dialog";
import { AdminSelect } from "./admin-select";
import { useTripLabel } from "./trip-label";
import type { SaveOutcome } from "./bookings-panel";

type Errors = Partial<Record<keyof BookingInput, FieldError>>;
/** The form keeps numbers as typed text until it's saved. */
type Draft = Omit<BookingInput, "passengers" | "grandTotal" | "endDate"> & {
  passengers: string;
  grandTotal: string;
  endDate: string;
};

const toDraft = (b: BookingInput): Draft => ({
  ...b,
  passengers: String(b.passengers),
  grandTotal: b.grandTotal ? String(b.grandTotal) : "",
  endDate: b.endDate ?? "",
});

/** Log a new WhatsApp booking, or edit one. Checked with the same rules the server uses. */
export function BookingEditor({
  open,
  booking,
  today,
  onClose,
  onSave,
}: {
  open: boolean;
  /** null = new booking */
  booking: Booking | null;
  today: string;
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
      <EditorForm key={booking?.id ?? "new"} booking={booking} today={today} onClose={onClose} onSave={onSave} />
    </AdminDialog>
  );
}

function EditorForm({
  booking,
  today,
  onClose,
  onSave,
}: {
  booking: Booking | null;
  today: string;
  onClose: () => void;
  onSave: (input: BookingInput) => Promise<SaveOutcome>;
}) {
  const t = useTranslations("Admin.bookings.editor");
  const ta = useTranslations("Admin");
  const label = useTripLabel();
  const formId = useId();
  const [draft, setDraft] = useState<Draft>(() => toDraft(booking ?? emptyBooking(today)));
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
    if (errors[key as keyof BookingInput]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const vehicle = getVehicle(draft.vehicleId);
  const driverChoice = DRIVER_OPTION_TRIPS.includes(draft.tripType);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseBooking(draft);
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

  const error = (field: keyof BookingInput) => {
    const code = errors[field];
    if (!code) return null;
    const max = (BOOKING_LIMITS as Record<string, number>)[field] ?? 0;
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
        <Field id="tripType" label={t("fields.tripType")} required error={error("tripType")}>
          <AdminSelect value={draft.tripType} onChange={(e) => set("tripType", e.target.value as TripType)}>
            {TRIP_TYPES.map((x) => (
              <option key={x} value={x}>{ta(`tripTypes.${x}`)}</option>
            ))}
          </AdminSelect>
        </Field>
        <Field id="vehicleId" label={t("fields.vehicle")} required error={error("vehicleId")}>
          <AdminSelect value={draft.vehicleId} onChange={(e) => set("vehicleId", e.target.value)}>
            {VEHICLES.map((v) => (
              <option key={v.id} value={v.id}>{label.vehicleName(v.id)}</option>
            ))}
          </AdminSelect>
        </Field>

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
        <Field id="grandTotal" label={t("fields.grandTotal")} hint={t("hints.grandTotal")} required error={error("grandTotal")}>
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
            {BOOKING_STATUSES.map((s) => (
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
