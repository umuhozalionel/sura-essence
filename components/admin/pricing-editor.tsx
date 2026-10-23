"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  Check, Droplet, Eye, Fuel, History, Info, Loader2, Pencil, Percent, RefreshCw, Truck, Undo2, UserRound, X, Zap, type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { VEHICLES, fuelPriceFor, type PricingConfig } from "@/lib/pricing";
import {
  CAB_BANDS, PRICING_GROUPS, RATE_KEYS, changedPaths, checkConfig, checkField, getAt, isBigChange, pricingField, setAt,
  type LivePricing, type PricingChange, type PricingField,
} from "@/lib/cms/pricing-config";
import { useSiteText } from "@/components/site-text";
import { PageHeader, Panel } from "./page-header";
import { AdminDialog } from "./admin-dialog";
import { DestinationsTable, FuelBadge, PricingMethods } from "./fleet-rates";
import { rwf } from "./format";
import { LoadErrorRow, SessionEnded, apiError, cmsApi, jsonInit, useSessionEnded } from "./cms/kit";

/*
 * Fleet & rates: the live pricing control panel.
 *
 * Every number is edited on its own. Typing shows the effect straight away in
 * the tables below (old figures crossed out) but changes nothing until Save
 * (or Enter). A change of more than 25% asks for a confirmation first. A save
 * goes live at once: the API updates the one field on the live document and
 * clears the "cms:pricing" cache, so the booking form, hero, Transfers prices
 * and the server's re-pricing all switch together. Each save is logged in
 * pricing_changes and can be undone.
 *
 * The page re-reads the live document when it regains focus and every 15
 * seconds, so a change made by someone else shows up here too. A field you
 * are editing keeps your text; if someone changed that same field meanwhile,
 * the save is refused (409) and the new value is shown.
 */

const REFRESH_MS = 15_000;

type Load = { item: LivePricing; changes: PricingChange[] };
type Pending = { path: string; text: string; value: number; error: string | null };

/** The text shown in a box for a stored value (margins as a percentage). */
const toText = (f: PricingField, n: number) => (f.unit === "percent" ? String(Math.round(n * 10000) / 100) : String(n));
const fromText = (f: PricingField, s: string) => {
  const raw = s.replace(/[\s,]/g, "");
  if (raw === "") return NaN;
  const n = Number(raw);
  return f.unit === "percent" && Number.isFinite(n) ? Math.round(n * 100) / 10000 : n;
};

export function PricingEditor() {
  const t = useTranslations("Admin.pricing");
  const tv = useTranslations("BookingForm.vehicles");
  const tc = useTranslations("Admin.fleet.constants");
  const tcl = useTranslations("Admin.fleet.classes");
  const tf = useTranslations("Admin.fuel");
  const text = useSiteText("fleet", "Admin.fleet");
  const format = useFormatter();
  const sessionEnded = useSessionEnded();

  const [live, setLive] = useState<LivePricing | null>(null);
  const [changes, setChanges] = useState<PricingChange[]>([]);
  const [loadError, setLoadError] = useState<"load" | "notConfigured" | null>(null);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<Record<string, Pending>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [confirm, setConfirm] = useState<{ path: string; before: number; after: number } | null>(null);
  const savingRef = useRef(0);

  /* ── loading and staying in step with other admins ── */

  /** quiet: a background refresh (no spinner, errors ignored). spinner: the Refresh button. */
  /** Applies a fetch result. quiet: a background refresh, where errors are ignored. */
  const apply = useCallback(
    (r: Load | { error: unknown }, quiet: boolean) => {
      if ("item" in r) {
        setLive(r.item);
        setChanges(r.changes);
        setLoadError(null);
      } else if (r.error instanceof SessionEnded) sessionEnded();
      else if (!quiet) setLoadError(apiError(r.error).status === 503 ? "notConfigured" : "load");
      if (!quiet) setLoading(false);
    },
    [sessionEnded],
  );

  const fetchLive = useCallback(
    () => cmsApi<Load>("/api/admin/pricing").catch((error: unknown) => ({ error })),
    [],
  );

  /** The Refresh button: spinner while it loads. */
  const load = useCallback(() => {
    if (savingRef.current > 0) return; // don't race our own save
    setLoading(true);
    void fetchLive().then((r) => apply(r, false));
  }, [fetchLive, apply]);

  useEffect(() => {
    const background = (quiet: boolean) => {
      if (savingRef.current > 0) return;
      void fetchLive().then((r) => apply(r, quiet));
    };
    background(false);
    const timer = window.setInterval(() => document.visibilityState === "visible" && background(true), REFRESH_MS);
    const onVisible = () => document.visibilityState === "visible" && background(true);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [fetchLive, apply]);

  /* ── editing ── */

  const label = useCallback(
    (path: string): string => {
      const [head, a, b] = path.split(".");
      if (head === "vehicleRates") return `${tv(`${a}.name`)} · ${t(`fields.${b}`)}`;
      if (head === "cabFares") return `${t(`cab.${a}`)} · ${t(`fields.cab.${b}`)}`;
      return t(`fields.${path}`);
    },
    [t, tv],
  );
  const shown = (f: PricingField, n: number) =>
    f.unit === "rwf" ? rwf(format, n)
    : f.unit === "percent" ? format.number(n, { style: "percent", maximumFractionDigits: 2 })
    : `${format.number(n)} ${t(`units.${f.unit}`)}`;

  const type = (path: string, s: string) => {
    const f = pricingField(path)!;
    const value = fromText(f, s);
    const problem = checkField(f, value);
    setPending((p) => ({ ...p, [path]: { path, text: s, value, error: problem } }));
  };
  const cancel = (path: string) =>
    setPending((p) => {
      const next = { ...p };
      delete next[path];
      return next;
    });

  /** Valid pending values applied to the live config: what the tables preview. */
  const preview = useMemo(() => {
    if (!live) return null;
    let cfg = live.config;
    for (const p of Object.values(pending)) if (!p.error && Number.isFinite(p.value)) cfg = setAt(cfg, p.path, p.value);
    return checkConfig(cfg) ? null : cfg;
  }, [live, pending]);
  const previewing = live && preview ? changedPaths(preview, live.config) : [];

  const afterSave = (item: LivePricing, change: PricingChange | null, path: string, isUndo = false) => {
    setLive(item);
    if (change) setChanges((c) => [change, ...c].slice(0, 30));
    cancel(path);
    if (!change) return;
    const f = pricingField(path)!;
    const what = `${label(path)}: ${shown(f, change.before)} → ${shown(f, change.after)}`;
    if (isUndo) toast.success(t("undoneToast", { what }));
    else toast.success(t("savedToast", { what }), { action: { label: t("undo"), onClick: () => void undo(change) } });
  };

  const commit = async (path: string, value: number) => {
    if (!live) return;
    const expected = getAt(live.config, path);
    savingRef.current++;
    setSaving((s) => ({ ...s, [path]: true }));
    try {
      const { item, change } = await cmsApi<{ item: LivePricing; change: PricingChange | null }>(
        "/api/admin/pricing",
        jsonInit("PATCH", { path, value, expected }),
      );
      afterSave(item, change, path);
    } catch (err) {
      if (err instanceof SessionEnded) return sessionEnded();
      const e = apiError(err) as ReturnType<typeof apiError> & { item?: LivePricing };
      if (e.status === 409 && e.item) {
        setLive(e.item);
        const f = pricingField(path)!;
        setPending((p) => ({ ...p, [path]: { ...p[path], error: "changedElsewhere" } }));
        toast.error(t("conflictToast", { field: label(path), value: shown(f, getAt(e.item.config, path)) }));
      } else if (e.status === 400 && e.reason) {
        setPending((p) => ({ ...p, [path]: { ...p[path], error: e.reason ?? "invalid" } }));
      } else {
        toast.error(t("saveError"));
      }
    } finally {
      savingRef.current--;
      setSaving((s) => ({ ...s, [path]: false }));
    }
  };

  const save = (path: string) => {
    const p = pending[path];
    if (!live || !p || p.error || saving[path]) return;
    const before = getAt(live.config, path);
    if (p.value === before) return cancel(path);
    const cross = checkConfig(setAt(live.config, path, p.value));
    if (cross) {
      setPending((x) => ({ ...x, [path]: { ...p, error: cross.reason } }));
      return;
    }
    if (isBigChange(before, p.value)) setConfirm({ path, before, after: p.value });
    else void commit(path, p.value);
  };

  const undo = async (change: PricingChange) => {
    savingRef.current++;
    try {
      const { item, change: done } = await cmsApi<{ item: LivePricing; change: PricingChange | null }>(
        "/api/admin/pricing/undo",
        jsonInit("POST", { changeId: change.id }),
      );
      afterSave(item, done, change.path, true);
    } catch (err) {
      if (err instanceof SessionEnded) return sessionEnded();
      const e = apiError(err) as ReturnType<typeof apiError> & { item?: LivePricing };
      if (e.status === 409 && e.item) setLive(e.item);
      toast.error(e.status === 409 ? t("undoConflict", { field: label(change.path) }) : t("saveError"));
    } finally {
      savingRef.current--;
    }
  };

  /* ── one editable number: shown as a value, flips into an input ── */

  const open = (path: string) => {
    if (!live || pending[path]) return;
    const f = pricingField(path)!;
    setPending((p) => ({ ...p, [path]: { path, text: toText(f, getAt(live.config, path)), value: getAt(live.config, path), error: null } }));
  };

  /**
   * A live number. At rest it reads like a dashboard figure with a pencil always
   * shown beside it (so it's clear it can be edited); clicking it (or Enter on it) opens an input with ✓ and ✕.
   * size: "lg" for the metric cards, "md" for table cells, "sm" for compact tiles.
   */
  const inline = (path: string, size: "lg" | "md" | "sm" = "md", align: "left" | "right" = "left") => {
    if (!live) return null;
    const f = pricingField(path)!;
    const p = pending[path];
    const stored = getAt(live.config, path);
    const busy = Boolean(saving[path]);
    const dirty = Boolean(p) && p!.value !== stored;
    const errorText = p?.error ? t(`errors.${p.error}`) : null;
    const valueClass =
      size === "lg" ? "text-3xl font-semibold tracking-tight" : size === "md" ? "text-sm font-medium" : "text-base font-semibold";

    if (!p && !busy) {
      return (
        <button
          type="button"
          onClick={() => open(path)}
          aria-label={t("editValue", { field: label(path), value: shown(f, stored) })}
          className={cn(
            "group inline-flex max-w-full items-center gap-2 rounded-md px-1.5 py-0.5 -mx-1.5 tabular-nums transition-colors outline-none hover:bg-primary/5 focus-visible:ring-[3px] focus-visible:ring-ring/50",
            align === "right" && "flex-row-reverse",
          )}
        >
          <span className={cn(valueClass, "whitespace-nowrap")}>{shown(f, stored)}</span>
          <Pencil className={cn("shrink-0 text-muted-foreground transition-colors group-hover:text-primary group-focus-visible:text-primary", size === "lg" ? "size-4" : "size-3.5")} aria-hidden />
        </button>
      );
    }

    return (
      <div className={cn("space-y-1", align === "right" && "flex flex-col items-end")}>
        <div className="flex items-center gap-1">
          <Input
            autoFocus
            onFocus={(e) => e.currentTarget.select()} // typing replaces the old figure
            inputMode="decimal"
            aria-label={label(path)}
            aria-invalid={errorText ? true : undefined}
            value={p ? p.text : toText(f, stored)}
            onChange={(e) => type(path, e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                save(path);
              } else if (e.key === "Escape") cancel(path);
            }}
            className={cn(
              "tabular-nums",
              size === "lg" ? "h-11 w-40 text-xl font-semibold" : size === "md" ? "h-8 w-28 text-right text-sm" : "h-8 w-24 text-sm",
              dirty && !errorText && "border-primary ring-1 ring-primary/30",
            )}
          />
          <Button type="button" size="icon-sm" onClick={() => save(path)} disabled={busy || Boolean(p?.error) || !dirty} aria-label={t("saveField", { field: label(path) })}>
            {busy ? <Loader2 className="animate-spin" aria-hidden /> : <Check aria-hidden />}
          </Button>
          <Button type="button" size="icon-sm" variant="ghost" onClick={() => cancel(path)} disabled={busy} aria-label={t("cancelField", { field: label(path) })}>
            <X aria-hidden />
          </Button>
        </div>
        {errorText ? (
          <p className="text-xs font-medium text-destructive">{errorText}</p>
        ) : (
          <p className="text-xs text-muted-foreground">{t("was", { value: shown(f, stored) })}</p>
        )}
      </div>
    );
  };

  const when = (ms: number) => format.dateTime(new Date(ms), { dateStyle: "medium", timeStyle: "short" });
  const confirmField = confirm ? pricingField(confirm.path)! : null;
  const classesOn = (fuel: "petrol" | "diesel") => VEHICLES.filter((v) => v.fuel === fuel).map((v) => tv(`${v.id}.name`)).join(", ");
  const cfg = preview ?? live?.config;

  return (
    <div className="space-y-8">
      <PageHeader
        title={text("title")}
        description={t("subtitle")}
        actions={
          <Button variant="outline" onClick={load} disabled={loading}>
            <RefreshCw className={cn(loading && "animate-spin")} aria-hidden />
            {t("refresh")}
          </Button>
        }
      />

      {/* Live status */}
      <section aria-label={t("liveLabel")} className="flex flex-col gap-3 rounded-xl border bg-card px-5 py-4 text-card-foreground shadow-xs sm:flex-row sm:items-center sm:justify-between">
        {loadError ? (
          <LoadErrorRow kind={loadError} onRetry={load} />
        ) : !live ? (
          <div className="h-10 w-full animate-pulse rounded bg-muted" aria-hidden />
        ) : (
          <div className="flex items-start gap-3">
            <span className="relative mt-1.5 flex size-2.5 shrink-0" aria-hidden>
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-[var(--status-confirmed)] opacity-60" />
              <span className="relative inline-flex size-2.5 rounded-full bg-[var(--status-confirmed)]" />
            </span>
            <div>
              <p className="font-medium">{t("liveTitle", { revision: live.revision })}</p>
              <p className="text-sm text-muted-foreground">
                {changes[0] ? t("lastChange", { date: when(changes[0].at), what: label(changes[0].path) }) : t("noChangesYet")}
              </p>
            </div>
          </div>
        )}
        <p className="flex max-w-xl items-start gap-2 text-xs text-muted-foreground">
          <Info className="mt-px size-3.5 shrink-0" aria-hidden />
          {t("siteNotice")}
        </p>
      </section>

      {live && (
        <>
          {/* Headline rates, editable in place */}
          <section aria-label={tc("label")} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
            <RateCard className="lg:col-span-3" label={tc("petrol")} icon={Fuel} value={inline("fuelPricePerLitre.petrol", "lg")} hint={tc("fuelHint", { classes: classesOn("petrol") })} />
            <RateCard className="lg:col-span-3" label={tc("diesel")} icon={Droplet} value={inline("fuelPricePerLitre.diesel", "lg")} hint={tc("fuelHint", { classes: classesOn("diesel") })} />
            <RateCard
              className="lg:col-span-2"
              label={tc("service")}
              icon={UserRound}
              value={inline("serviceFeePerDay.kigali", "lg")}
              hint={
                <span className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
                  <span>{t("inKigali")} ·</span>
                  {inline("serviceFeePerDay.outside", "sm")}
                  <span>{t("outsideKigali")}</span>
                </span>
              }
            />
            <RateCard className="lg:col-span-2" label={tc("margin")} icon={Percent} value={inline("profitMargin", "lg")} hint={tc("marginHint")} />
            <RateCard className="sm:col-span-2 lg:col-span-2" label={tc("recovery")} icon={Truck} value={inline("vehicleRecoveryFee", "lg")} hint={tc("recoveryHint")} />
          </section>

          {/* The finer settings, as compact tiles */}
          <Panel title={t("more.title")} description={t("more.subtitle")}>
            <div className="grid gap-6 md:grid-cols-3">
              {(["hourly", "economy"] as const).map((id) => (
                <div key={id} className="md:col-span-1 space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t(`groups.${id}`)}</p>
                  <dl className="divide-y rounded-lg border">
                    {PRICING_GROUPS.find((g) => g.id === id)!.fields.map((f) => (
                      <div key={f.path} className="flex items-center justify-between gap-3 px-3 py-2">
                        <dt className="text-sm text-muted-foreground">{t(`fields.${f.path}`)}</dt>
                        <dd>{inline(f.path, "sm", "right")}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ))}
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("groups.rounding")}</p>
                <dl className="divide-y rounded-lg border">
                  <div className="flex items-center justify-between gap-3 px-3 py-2">
                    <dt className="text-sm text-muted-foreground">{t("fields.roundTotalTo")}</dt>
                    <dd>{inline("roundTotalTo", "sm", "right")}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </Panel>

          {/* Vehicle classes: base, airport and outside-Kigali rates in place */}
          <Panel title={text("classes.title")} description={text("classes.subtitle")} bodyClassName="">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className={`${HEAD} pl-5`}>{tcl("class")}</TableHead>
                  <TableHead className={`${HEAD} text-right`}>{tcl("seats")}</TableHead>
                  <TableHead className={`${HEAD} text-right`}>{tcl("base")}</TableHead>
                  <TableHead className={`${HEAD} text-right`}>{tcl("airport")}</TableHead>
                  <TableHead className={`${HEAD} text-right`}>{tcl("surcharge")}</TableHead>
                  <TableHead className={HEAD}>{tcl("cab")}</TableHead>
                  <TableHead className={`${HEAD} pr-5`}>{tcl("fuel")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {VEHICLES.map((v) => {
                  const band = v.cab ? cfg!.cabFares[v.cab] : null;
                  const fuel = fuelPriceFor(v, cfg);
                  return (
                    <TableRow key={v.id}>
                      <TableCell className="py-3 pl-5">
                        <p className="font-medium">{tv(`${v.id}.name`)}</p>
                        <p className="text-xs text-muted-foreground">{tv(`${v.id}.models`)}</p>
                      </TableCell>
                      <TableCell className="py-3 text-right tabular-nums text-muted-foreground">{v.maxPassengers}</TableCell>
                      {RATE_KEYS.map((k) => (
                        <TableCell key={k} className="py-3 text-right align-top">{inline(`vehicleRates.${v.id}.${k}`, "md", "right")}</TableCell>
                      ))}
                      <TableCell className="py-3 text-sm">
                        {band ? (
                          <>
                            <p className="tabular-nums">{tcl("cabFare", { base: rwf(format, band.base), perKm: format.number(band.perKm), km: band.includedKm })}</p>
                            <p className="text-xs text-muted-foreground">{t(`cab.${v.cab}`)}</p>
                          </>
                        ) : (
                          <span className="text-muted-foreground">{tcl("noCab")}</span>
                        )}
                      </TableCell>
                      <TableCell className="py-3 pr-5">
                        {v.fuel === "electric" ? (
                          <span className="inline-flex items-center gap-1.5 text-sm"><Zap className="size-3.5 text-primary" aria-hidden />{tcl("electric")}</span>
                        ) : (
                          <>
                            <FuelBadge fuel={v.fuel} label={tf(v.fuel)} />
                            <p className="mt-1 whitespace-nowrap text-xs text-muted-foreground tabular-nums">
                              {tcl("fuelRate", { price: rwf(format, fuel ?? 0), km: cfg!.kmPerLitre[v.body] })}
                            </p>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Panel>

          {/* City cab fare bands */}
          <Panel title={t("groups.cab")} description={t("cabSubtitle")} bodyClassName="">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className={`${HEAD} pl-5`}>{t("cab.band")}</TableHead>
                  <TableHead className={`${HEAD} text-right`}>{t("fields.cab.base")}</TableHead>
                  <TableHead className={`${HEAD} text-right`}>{t("fields.cab.includedKm")}</TableHead>
                  <TableHead className={`${HEAD} pr-5 text-right`}>{t("fields.cab.perKm")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {CAB_BANDS.map((band) => (
                  <TableRow key={band}>
                    <TableCell className="py-3 pl-5">
                      <p className="font-medium">{t(`cab.${band}`)}</p>
                      <p className="text-xs text-muted-foreground">{VEHICLES.filter((v) => v.cab === band).map((v) => tv(`${v.id}.name`)).join(", ")}</p>
                    </TableCell>
                    <TableCell className="py-3 text-right align-top">{inline(`cabFares.${band}.base`, "md", "right")}</TableCell>
                    <TableCell className="py-3 text-right align-top">{inline(`cabFares.${band}.includedKm`, "md", "right")}</TableCell>
                    <TableCell className="py-3 pr-5 text-right align-top">{inline(`cabFares.${band}.perKm`, "md", "right")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Panel>

          {previewing.length > 0 && (
            <p role="status" className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-4 py-2.5 text-sm">
              <Eye className="size-4 shrink-0 text-primary" aria-hidden />
              {t("previewing", { count: previewing.length })}
            </p>
          )}

          {/* Worked out from the rates above: shows the effect of unsaved edits */}
          <DestinationsTable cfg={cfg!} compare={previewing.length ? live.config : undefined} />
          <PricingMethods cfg={cfg!} />
          <ChangeLog changes={changes} live={live.config} label={label} shown={shown} when={when} onUndo={(c) => void undo(c)} />
        </>
      )}

      <AdminDialog
        open={confirm !== null}
        onClose={() => setConfirm(null)}
        title={t("confirm.title")}
        description={confirm && confirmField ? t("confirm.body", { field: label(confirm.path), before: shown(confirmField, confirm.before), after: shown(confirmField, confirm.after) }) : undefined}
        closeLabel={t("close")}
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setConfirm(null)}>{t("confirm.cancel")}</Button>
            <Button
              onClick={() => {
                const c = confirm;
                setConfirm(null);
                if (c) void commit(c.path, c.after);
              }}
            >
              <Check aria-hidden />
              {t("confirm.yes")}
            </Button>
          </>
        }
      >
        <p className="text-sm text-muted-foreground">{t("confirm.note")}</p>
      </AdminDialog>
    </div>
  );
}

const HEAD = "h-11 text-xs font-medium text-muted-foreground whitespace-nowrap";

/** A metric card (same look as MetricCard on the dashboard) whose value is editable in place. */
function RateCard({ label, icon: Icon, value, hint, className = "" }: {
  label: string;
  icon: LucideIcon;
  value: React.ReactNode;
  hint?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-xl border bg-card p-5 text-card-foreground shadow-xs transition-colors hover:border-primary/30 ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary" aria-hidden>
          <Icon className="size-[18px]" />
        </span>
      </div>
      <div className="mt-2 min-h-11">{value}</div>
      {hint && <div className="mt-1.5 text-sm text-muted-foreground">{hint}</div>}
    </div>
  );
}

/** The latest saved changes, newest first, each with Undo while the field still holds that value. */
function ChangeLog({
  changes, live, label, shown, when, onUndo,
}: {
  changes: PricingChange[];
  live: PricingConfig;
  label: (path: string) => string;
  shown: (f: PricingField, n: number) => string;
  when: (ms: number) => string;
  onUndo: (c: PricingChange) => void;
}) {
  const t = useTranslations("Admin.pricing");
  return (
    <Panel title={t("log.title")} description={t("log.subtitle")} bodyClassName="">
      {changes.length === 0 ? (
        <p className="px-5 py-10 text-center text-sm text-muted-foreground">{t("log.empty")}</p>
      ) : (
        <ul className="divide-y">
          {changes.map((c) => {
            const f = pricingField(c.path);
            const current = f ? getAt(live, c.path) === c.after : false;
            return (
              <li key={c.id} className="flex flex-col gap-2 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                  <History className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{label(c.path)}</p>
                    <p className="text-xs text-muted-foreground tabular-nums">
                      {f ? `${shown(f, c.before)} → ${shown(f, c.after)}` : `${c.before} → ${c.after}`} · {when(c.at)} · {t("log.revision", { revision: c.revision })}
                      {c.undoOf ? ` · ${t("log.undo")}` : ""}
                    </p>
                  </div>
                </div>
                <Button size="sm" variant="ghost" onClick={() => onUndo(c)} disabled={!current} title={current ? undefined : t("log.changedSince")}>
                  <Undo2 aria-hidden />
                  {t("undo")}
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}
