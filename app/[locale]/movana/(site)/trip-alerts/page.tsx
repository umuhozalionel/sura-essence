import { setRequestLocale } from "next-intl/server";
import { toLocale } from "@/lib/cms/localized";
import { getSiteTripAlerts } from "@/lib/cms/trip-alerts-server";
import { TripAlertsView } from "./trip-alerts-view";

/** /movana/trip-alerts: what Admin → Trip alerts publishes (lib/cms/trip-alerts-server.ts). */
export default async function TripAlertsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <TripAlertsView alerts={await getSiteTripAlerts(toLocale(locale))} />;
}
