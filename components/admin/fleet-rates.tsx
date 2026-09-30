import React from "react";
import { useFormatter, useTranslations } from "next-intl";
import { CircleCheck, Lock, Zap } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  CAB_FARES, DESTINATIONS, HIRE_KM_PER_HOUR, HOURS_IN_RATE_DAY, KM_PER_LITRE, MAX_HOURS_PER_DAY,
  MIN_BILLED_HOURS, PROFIT_MARGIN, ROUND_TOTAL_TO_RWF, VEHICLES, destinationPrice, fuelPriceFor,
} from "@/lib/pricing";
import { Panel } from "./page-header";
import { rwf } from "./format";

/*
 * Read-only views of lib/pricing.ts. Nothing here holds a number of its own:
 * change a rate in lib/pricing.ts, redeploy, and these tables follow.
 */

const head = "h-11 text-xs font-medium text-muted-foreground whitespace-nowrap";

/** One row per vehicle class: every rate the site uses for it. */
export function VehicleRatesTable() {
  const t = useTranslations("Admin.fleet.classes");
  const tv = useTranslations("BookingForm.vehicles");
  const tf = useTranslations("Admin.fuel");
  const format = useFormatter();
  return (
    <Panel title={t("title")} description={t("subtitle")} bodyClassName="">
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
          {VEHICLES.map((v) => {
            const cab = v.cab ? CAB_FARES[v.cab] : null;
            return (
              <TableRow key={v.id}>
                <TableCell className="py-3 pl-5">
                  <p className="font-medium">{tv(`${v.id}.name`)}</p>
                  <p className="text-xs text-muted-foreground">{tv(`${v.id}.models`)}</p>
                </TableCell>
                <TableCell className="py-3 text-right tabular-nums">{v.maxPassengers}</TableCell>
                <TableCell className="py-3 text-right font-medium tabular-nums">{rwf(format, v.basePrice)}</TableCell>
                <TableCell className="py-3 text-right tabular-nums">{rwf(format, v.airportRate)}</TableCell>
                <TableCell className="py-3">
                  {cab ? (
                    <span className="tabular-nums">
                      {t("cabFare", { base: rwf(format, cab.base), perKm: format.number(cab.perKm), km: cab.includedKm })}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">{t("noCab")}</span>
                  )}
                </TableCell>
                <TableCell className="py-3 text-right tabular-nums">{v.outsideSurcharge ? rwf(format, v.outsideSurcharge) : "—"}</TableCell>
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
                        {t("fuelRate", { price: rwf(format, fuelPriceFor(v) ?? 0), km: KM_PER_LITRE[v.body] })}
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

/** The four ways a trip is priced, in plain words (with the live numbers). */
export function PricingMethods() {
  const t = useTranslations("Admin.fleet.methods");
  const format = useFormatter();
  const items = [
    { title: t("airportTitle"), body: t("airportBody") },
    { title: t("cabTitle"), body: t("cabBody", { km: CAB_FARES.standard.includedKm }) },
    {
      title: t("hourlyTitle"),
      body: t("hourlyBody", { hours: HOURS_IN_RATE_DAY, min: MIN_BILLED_HOURS, max: MAX_HOURS_PER_DAY, km: HIRE_KM_PER_HOUR }),
    },
    { title: t("longTitle"), body: t("longBody", { margin: format.number(PROFIT_MARGIN, { style: "percent" }) }) },
  ];
  return (
    <Panel title={t("title")} description={t("subtitle", { step: format.number(ROUND_TOTAL_TO_RWF) })}>
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

/** Distances used for fuel, with what three common choices cost one way. */
export function DestinationsTable() {
  const t = useTranslations("Admin.fleet.destinations");
  const ts = useTranslations("BookingForm.sites");
  const tv = useTranslations("BookingForm.vehicles");
  const format = useFormatter();
  const price = (id: string, vehicle: string, withDriver = true) => {
    const p = destinationPrice(id, vehicle, { withDriver });
    return p === null ? "—" : rwf(format, p);
  };
  return (
    <Panel title={t("title")} description={t("subtitle")} bodyClassName="">
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
              <TableCell className="py-3 text-right tabular-nums">{price(d.id, "sedan")}</TableCell>
              <TableCell className="py-3 text-right tabular-nums">{price(d.id, "sedan", false)}</TableCell>
              <TableCell className="py-3 pr-5 text-right tabular-nums">{price(d.id, "suv")}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Panel>
  );
}
