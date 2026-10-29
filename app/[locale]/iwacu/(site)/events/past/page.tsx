import { setRequestLocale } from "next-intl/server";
import { getSiteData } from "@/lib/cms/site-data";
import { PastEventsView } from "./past-events-view";

/** /events/past — past experiences from the CMS, or PastEvents.items until it's seeded. */
export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const data = await getSiteData(locale);
  return <PastEventsView events={data?.past} />;
}
