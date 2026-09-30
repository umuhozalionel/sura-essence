import type { Metadata } from "next";
import { getFormatter, getTranslations } from "next-intl/server";
import { Droplet, Fuel, Percent, Truck, UserRound } from "lucide-react";
import { isAdmin } from "@/lib/admin-auth";
import {
  DIESEL_PRICE_RWF, PETROL_PRICE_RWF, PROFIT_MARGIN, SERVICE_FEE_PER_DAY, VEHICLE_RECOVERY_FEE, VEHICLES, type FuelType,
} from "@/lib/pricing";
import { PageHeader } from "@/components/admin/page-header";
import { MetricCard } from "@/components/admin/metric-card";
import { SessionGuard } from "@/components/admin/session-guard";
import { DestinationsTable, PricingMethods, VehicleRatesTable } from "@/components/admin/fleet-rates";
import { rwf } from "@/components/admin/format";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Admin.nav");
  return { title: t("fleet") };
}

/**
 * Fleet & rates — a read-only view of lib/pricing.ts for staff.
 *
 * Developers: every figure on this page is read straight from lib/pricing.ts.
 * To change a rate, edit that file and redeploy — this page, the website's
 * quotes and the dashboard all follow automatically. Keep instructions like
 * this in code comments or the README, never in the rendered page.
 */
export default async function AdminFleetPage() {
  if (!(await isAdmin())) return <SessionGuard />;
  const [t, tv, format] = await Promise.all([
    getTranslations("Admin.fleet"),
    getTranslations("BookingForm.vehicles"),
    getFormatter(),
  ]);
  // Which classes run on each fuel, e.g. "Standard (Sedan), Executive (SUV), Luxury SUV"
  const classesOn = (fuel: FuelType) =>
    VEHICLES.filter((v) => v.fuel === fuel).map((v) => tv(`${v.id}.name`)).join(", ");

  return (
    <div className="space-y-8">
      <PageHeader title={t("title")} description={t("subtitle")} />

      {/* Fuel prices side by side on the first row, the three fees below */}
      <section aria-label={t("constants.label")} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        <MetricCard label={t("constants.petrol")} value={rwf(format, PETROL_PRICE_RWF)} hint={t("constants.fuelHint", { classes: classesOn("petrol") })} icon={Fuel} className="lg:col-span-3" />
        <MetricCard label={t("constants.diesel")} value={rwf(format, DIESEL_PRICE_RWF)} hint={t("constants.fuelHint", { classes: classesOn("diesel") })} icon={Droplet} className="lg:col-span-3" />
        <MetricCard
          label={t("constants.service")}
          value={rwf(format, SERVICE_FEE_PER_DAY.kigali)}
          hint={t("constants.serviceHint", { outside: rwf(format, SERVICE_FEE_PER_DAY.outside) })}
          icon={UserRound}
          className="lg:col-span-2"
        />
        <MetricCard label={t("constants.margin")} value={format.number(PROFIT_MARGIN, { style: "percent" })} hint={t("constants.marginHint")} icon={Percent} className="lg:col-span-2" />
        <MetricCard label={t("constants.recovery")} value={rwf(format, VEHICLE_RECOVERY_FEE)} hint={t("constants.recoveryHint")} icon={Truck} className="sm:col-span-2 lg:col-span-2" />
      </section>

      <VehicleRatesTable />
      <DestinationsTable />
      <PricingMethods />
    </div>
  );
}
