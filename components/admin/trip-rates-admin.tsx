"use client";

import React, { useEffect, useId, useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { TripRates } from "@/lib/trips";
import { PageHeader, Panel } from "./page-header";
import {
  Field, FormError, LoadErrorRow, SaveButton, SessionEnded, apiError, cmsApi, jsonInit, useApiErrors, useSessionEnded,
} from "./cms/kit";

type NumberKey = "usdToRwf" | "safariCarPrice" | "lunchBuffet" | "lunchChosen" | "guideUsd" | "vehicleFeeUsd" | "snacksPerGuest" | "inParkKm";

/** Admin → Trips: Update prices brings in today's rate, and saving moves every USD estimate and fee on /iwacu/trips. */
export function TripRatesAdmin() {
  const t = useTranslations("Admin.trips");
  const tc = useTranslations("Admin.cms");
  const format = useFormatter();
  const formId = useId();
  const sessionEnded = useSessionEnded();
  const toErrors = useApiErrors();
  const [loaded, setLoaded] = useState<TripRates | null>(null);
  const [draft, setDraft] = useState<TripRates | null>(null);
  const [liveRate, setLiveRate] = useState<number | null>(null);
  const [loadError, setLoadError] = useState<"load" | "notConfigured" | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [banner, setBanner] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let live = true;
    cmsApi<{ item: TripRates; liveRate: number | null }>("/api/admin/trip-rates")
      .then(({ item, liveRate: rate }) => {
        if (!live) return;
        setLoaded(item);
        setDraft(item);
        setLiveRate(rate);
        setLoadError(null);
      })
      .catch((err) => {
        if (!live) return;
        if (err instanceof SessionEnded) return sessionEnded();
        setLoadError(apiError(err).status === 503 ? "notConfigured" : "load");
      });
    return () => {
      live = false;
    };
  }, [attempt, sessionEnded]);

  const save = async (next: TripRates) => {
    setBanner(null);
    setErrors({});
    setSaving(true);
    try {
      const { item } = await cmsApi<{ item: TripRates }>("/api/admin/trip-rates", jsonInit("PUT", next));
      setLoaded(item);
      setDraft(item);
      toast.success(t("savedToast"));
    } catch (err) {
      if (err instanceof SessionEnded) return sessionEnded();
      const f = toErrors(err);
      setErrors(f.fields);
      setBanner(f.banner);
    } finally {
      setSaving(false);
    }
  };

  const number = (key: NumberKey, label: string, hint?: string) =>
    draft && (
      <Field label={label} required error={errors[key]} hint={hint}>
        <Input
          type="number"
          min={0}
          step="any"
          value={Number.isNaN(draft[key]) ? "" : draft[key]}
          onChange={(e) => setDraft({ ...draft, [key]: e.target.valueAsNumber })}
        />
      </Field>
    );

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} description={t("subtitle")} />
      {loadError ? (
        <Panel title={t("title")}><LoadErrorRow kind={loadError} onRetry={() => setAttempt((a) => a + 1)} /></Panel>
      ) : !draft || !loaded ? (
        <div className="h-48 animate-pulse rounded-lg bg-muted" aria-hidden />
      ) : (
        <form id={formId} noValidate onSubmit={(e) => { e.preventDefault(); void save(draft); }} className="space-y-6">
          <FormError message={banner} />
          <Panel
            title={t("rate.title")}
            description={
              loaded.rateUpdatedAt
                ? t("rate.updatedOn", { date: format.dateTime(new Date(loaded.rateUpdatedAt), { dateStyle: "medium", timeStyle: "short" }) })
                : t("rate.notUpdated")
            }
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
              <div className="flex-1">{number("usdToRwf", t("rate.label"))}</div>
              <Button
                type="button"
                disabled={liveRate === null || saving}
                onClick={() => liveRate !== null && void save({ ...draft, usdToRwf: liveRate, rateUpdatedAt: null })}
              >
                <RefreshCw aria-hidden />
                {t("rate.update")}
              </Button>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              {liveRate === null ? t("rate.liveUnavailable") : t("rate.live", { rate: format.number(liveRate) })}
            </p>
          </Panel>

          <Panel title={t("fees.title")} description={t("fees.subtitle")}>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {number("safariCarPrice", t("fees.safariCarPrice"), t("fees.safariCarHint"))}
              {number("lunchBuffet", t("fees.lunchBuffet"))}
              {number("lunchChosen", t("fees.lunchChosen"))}
              {number("guideUsd", t("fees.guideUsd"))}
              {number("vehicleFeeUsd", t("fees.vehicleFeeUsd"), t("fees.suvOnlyHint"))}
              {number("snacksPerGuest", t("fees.snacksPerGuest"), t("fees.suvOnlyHint"))}
              {number("inParkKm", t("fees.inParkKm"), t("fees.inParkHint"))}
              <Field label={t("fees.latestPickup")} required error={errors.latestPickup} hint={t("fees.latestPickupHint")}>
                <Input value={draft.latestPickup} maxLength={5} onChange={(e) => setDraft({ ...draft, latestPickup: e.target.value })} />
              </Field>
            </div>
          </Panel>

          <div className="flex justify-end">
            <SaveButton form={formId} saving={saving} label={saving ? tc("saving") : tc("save")} />
          </div>
        </form>
      )}
    </div>
  );
}
