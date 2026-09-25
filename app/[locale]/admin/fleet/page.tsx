import type { Metadata } from "next";
import { getFormatter, getTranslations } from "next-intl/server";
import { Fuel, Percent, Truck, UserRound } from "lucide-react";
import { isAdmin } from "@/lib/admin-auth";
import {
  CURRENT_FUEL_PRICE_RWF, PROFIT_MARGIN, SERVICE_FEE_PER_DAY, VEHICLE_RECOVERY_FEE,
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

/** Fleet & rates — a read-only window on lib/pricing.ts, so rates can be checked without opening the code. */
export default async function AdminFleetPage() {
  if (!(await isAdmin())) return <SessionGuard />;
  const [t, format] = await Promise.all([getTranslations("Admin.fleet"), getFormatter()]);

  return (
    <div className="space-y-8">
      <PageHeader title={t("title")} description={t("subtitle")} />

      <section aria-label={t("constants.label")} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label={t("constants.fuel")} value={rwf(format, CURRENT_FUEL_PRICE_RWF)} hint={t("constants.fuelHint")} icon={Fuel} />
        <MetricCard
          label={t("constants.service")}
          value={rwf(format, SERVICE_FEE_PER_DAY.kigali)}
          hint={t("constants.serviceHint", { outside: rwf(format, SERVICE_FEE_PER_DAY.outside) })}
          icon={UserRound}
        />
        <MetricCard label={t("constants.margin")} value={format.number(PROFIT_MARGIN, { style: "percent" })} hint={t("constants.marginHint")} icon={Percent} />
        <MetricCard label={t("constants.recovery")} value={rwf(format, VEHICLE_RECOVERY_FEE)} hint={t("constants.recoveryHint")} icon={Truck} />
      </section>

      <VehicleRatesTable />
      <DestinationsTable />
      <PricingMethods />

      <p className="text-sm text-muted-foreground">{t("footnote")}</p>
    </div>
  );
}
