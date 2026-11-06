import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { requirePage } from "@/lib/admin-page";
import { Link } from "@/i18n/navigation";
import { TripRatesAdmin } from "@/components/admin/trip-rates-admin";
import { TripsAdmin } from "@/components/admin/trips-admin";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Admin.nav");
  return { title: t("trips") };
}

const TABS = [
  { id: "list", href: "/admin/trips" },
  { id: "prices", href: "/admin/trips?tab=prices" },
] as const;

/**
 * Trips, in two tabs: the trips themselves with their recap photos (lib/cms/trips-server.ts),
 * and the exchange rate and fees /iwacu/trips prices with (lib/cms/trip-rates-server.ts).
 */
export default async function AdminTripsPage({ searchParams }: { searchParams: Promise<{ tab?: string | string[] }> }) {
  const access = await requirePage("trips:view");
  if (!access.ok) return access.block;
  const t = await getTranslations("Admin.trips.tabs");
  const active = (await searchParams).tab === "prices" ? "prices" : "list";

  return (
    <div className="space-y-6">
      <nav aria-label={t("label")} className="flex gap-1 overflow-x-auto border-b">
        {TABS.map((tab) => (
          <Link
            key={tab.id}
            href={tab.href}
            aria-current={tab.id === active ? "page" : undefined}
            className={`-mb-px inline-flex h-10 shrink-0 items-center border-b-2 px-3 text-sm font-medium transition-colors ${tab.id === active ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          >
            {t(tab.id)}
          </Link>
        ))}
      </nav>
      {active === "prices" ? <TripRatesAdmin /> : <TripsAdmin />}
    </div>
  );
}
