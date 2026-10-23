import React from "react";
import { useFormatter, useTranslations } from "next-intl";
import { CircleCheck, Lock, Zap } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DESTINATIONS, VEHICLES, destinationPrice, fuelPriceFor, getVehicle, type PricingConfig } from "@/lib/pricing";
import { cn } from "@/lib/utils";
import { useSiteText } from "@/components/site-text";
import { Panel } from "./page-header";
import { rwf } from "./format";

/*
 * Views of a pricing config: the active version, or a draft being edited.
 * Nothing here holds a number of its own: every figure comes from `cfg` and
 * the formulas in lib/pricing.ts. With `compare`, figures that differ from it
 * are highlighted with the old value alongside. Headings and the pricing steps
 * are editable in Admin → Site content (section "fleet").
 */

const head = "h-11 text-xs font-medium text-muted-foreground whitespace-nowrap";

/** "45,000 RWF", or "40,000 → 45,000 RWF" highlighted when it changed. */
function Amount({ value, before, format }: { value: number | null; before?: number | null; format: ReturnType<typeof useFormatter> }) {
  if (value === null) return <>—</>;
  const changed = before !== undefined && before !== null && before !== value;
  return (
    <span className={cn(changed && "font-semibold text-primary")}>
      {changed && <span className="mr-1 font-normal text-muted-foreground line-through">{format.number(before)}</span>}
      {rwf(format, value)}
    </span>
  );
}

/** One row per vehicle class: every rate the site uses for it. */
export function VehicleRatesTable({ cfg, compare }: { cfg: PricingConfig; compare?: PricingConfig }) {
  const t = useTranslations("Admin.fleet.classes");
  const tv = useTranslations("BookingForm.vehicles");
  const tf = useTranslations("Admin.fuel");
  const text = useSiteText("fleet", "Admin.fleet");
  const format = useFormatter();
  return (
    <Panel title={text("classes.title")} description={text("classes.subtitle")} bodyClassName="">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className={`${head} pl-5`}>{t("class")}</TableHead>
            <TableHead className={`${head} text-right`}>{t("seats")}</TableHead>
            <TableHead className={`${head} text-right`}>{t("base")}</TableHead>
            <TableHead className={`${head} text-right`}>{t("airport")}</TableHead>
            <TableHead className={head}>{t("cab")}</TableHead>
            <TableHead className={`${head} text-right`}>{t("surcharge")}</TableHead>
            <TableHead className={head}>{t("fuel")}</TableHead>
            <TableHead className={`${head} pr-5`}>{t("selfDrive")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {VEHICLES.map(({ id }) => {
            const v = getVehicle(id, cfg);
            const was = compare ? getVehicle(id, compare) : undefined;
            const cab = v.cab ? cfg.cabFares[v.cab] : null;
            return (
              <TableRow key={v.id}>
                <TableCell className="py-3 pl-5">
                  <p className="font-medium">{tv(`${v.id}.name`)}</p>
                  <p className="text-xs text-muted-foreground">{tv(`${v.id}.models`)}</p>
                </TableCell>
                <TableCell className="py-3 text-right tabular-nums">{v.maxPassengers}</TableCell>
                <TableCell className="py-3 text-right font-medium tabular-nums">
                  <Amount value={v.basePrice} before={was?.basePrice} format={format} />
                </TableCell>
                <TableCell className="py-3 text-right tabular-nums">
                  <Amount value={v.airportRate} before={was?.airportRate} format={format} />
                </TableCell>
                <TableCell className="py-3">
                  {cab ? (
                    <span className="tabular-nums">
                      {t("cabFare", { base: rwf(format, cab.base), perKm: format.number(cab.perKm), km: cab.includedKm })}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">{t("noCab")}</span>
                  )}
                </TableCell>
                <TableCell className="py-3 text-right tabular-nums">
                  {v.outsideSurcharge || was?.outsideSurcharge ? (
                    <Amount value={v.outsideSurcharge} before={was?.outsideSurcharge} format={format} />
                  ) : "—"}
                </TableCell>
                <TableCell className="py-3">
                  {v.fuel === "electric" ? (
                    <span className="inline-flex items-center gap-1.5">
                      <Zap className="size-3.5 text-primary" aria-hidden />
                      {t("electric")}
                    </span>
                  ) : (
                    <>
                      <FuelBadge fuel={v.fuel} label={tf(v.fuel)} />
                      <p className="mt-1 whitespace-nowrap text-xs text-muted-foreground tabular-nums">
                        {t("fuelRate", { price: rwf(format, fuelPriceFor(v, cfg) ?? 0), km: cfg.kmPerLitre[v.body] })}
                      </p>
                    </>
                  )}
                </TableCell>
                <TableCell className="py-3 pr-5">
                  {v.selfDrive ? (
                    <span className="inline-flex items-center gap-1.5">
                      <CircleCheck className="size-3.5 text-[var(--status-confirmed)]" aria-hidden />
                      {t("yes")}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                      <Lock className="size-3.5" aria-hidden />
                      {t("chauffeurOnly")}
                    </span>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Panel>
  );
}

/** "Petrol" / "Diesel" chip, so the two fuels are easy to tell apart at a glance. */
export function FuelBadge({ fuel, label }: { fuel: "petrol" | "diesel"; label: string }) {
  return (
    <span
      className={
        fuel === "diesel"
          ? "inline-flex items-center rounded-full border border-[var(--status-completed)]/40 bg-muted px-2 py-0.5 text-xs font-medium"
          : "inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
      }
    >
      {label}
    </span>
  );
}

/** The four ways a trip is priced, in plain words (with the numbers from `cfg`). */
export function PricingMethods({ cfg }: { cfg: PricingConfig }) {
  const text = useSiteText("fleet", "Admin.fleet");
  const t = (key: string, vars?: Record<string, string | number>) => text(`methods.${key}`, vars);
  const format = useFormatter();
  const items = [
    { title: t("airportTitle"), body: t("airportBody") },
    { title: t("cabTitle"), body: t("cabBody", { km: cfg.cabFares.standard.includedKm }) },
    {
      title: t("hourlyTitle"),
      body: t("hourlyBody", {
        hours: cfg.hourly.hoursInRateDay, min: cfg.hourly.minBilledHours, max: cfg.hourly.maxHoursPerDay, km: cfg.hourly.kmPerHour,
      }),
    },
    { title: t("longTitle"), body: t("longBody", { margin: format.number(cfg.profitMargin, { style: "percent", maximumFractionDigits: 2 }) }) },
  ];
  return (
    <Panel title={t("title")} description={t("subtitle", { step: format.number(cfg.roundTotalTo) })}>
      <ol className="grid gap-5 md:grid-cols-2">
        {items.map((item, i) => (
          <li key={item.title} className="flex gap-3">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary" aria-hidden>
              {i + 1}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium">{item.title}</p>
              <p className="mt-0.5 text-sm text-muted-foreground">{item.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </Panel>
  );
}

/** Distances used for fuel, with what three common choices cost one way at `cfg`'s rates. */
export function DestinationsTable({ cfg, compare }: { cfg: PricingConfig; compare?: PricingConfig }) {
  const t = useTranslations("Admin.fleet.destinations");
  const ts = useTranslations("BookingForm.sites");
  const tv = useTranslations("BookingForm.vehicles");
  const text = useSiteText("fleet", "Admin.fleet");
  const format = useFormatter();
  const cell = (id: string, vehicle: string, withDriver = true) => (
    <Amount
      value={destinationPrice(id, vehicle, { withDriver }, cfg)}
      before={compare ? destinationPrice(id, vehicle, { withDriver }, compare) : undefined}
      format={format}
    />
  );
  return (
    <Panel title={text("destinations.title")} description={text("destinations.subtitle")} bodyClassName="">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className={`${head} pl-5`}>{t("destination")}</TableHead>
            <TableHead className={`${head} text-right`}>{t("distance")}</TableHead>
            <TableHead className={`${head} text-right`}>{t("sedanDriver", { sedan: tv("sedan.name") })}</TableHead>
            <TableHead className={`${head} text-right`}>{t("sedanSelf", { sedan: tv("sedan.name") })}</TableHead>
            <TableHead className={`${head} pr-5 text-right`}>{t("suvDriver", { suv: tv("suv.name") })}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {DESTINATIONS.map((d) => (
            <TableRow key={d.id}>
              <TableCell className="py-3 pl-5">
                <p className="font-medium">{ts(`${d.id}.title`)}</p>
                <p className="text-xs text-muted-foreground">
                  {d.loop ? t("loop") : t(`zone.${d.zone}`)}
                </p>
              </TableCell>
              <TableCell className="py-3 text-right tabular-nums">
                {d.loop ? t("kmPerDay", { km: d.km }) : `${format.number(d.km)} km`}
              </TableCell>
              <TableCell className="py-3 text-right tabular-nums">{cell(d.id, "sedan")}</TableCell>
              <TableCell className="py-3 text-right tabular-nums">{cell(d.id, "sedan", false)}</TableCell>
              <TableCell className="py-3 pr-5 text-right tabular-nums">{cell(d.id, "suv")}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Panel>
  );
}
