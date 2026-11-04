import { setRequestLocale } from "next-intl/server";
import { getSiteData } from "@/lib/cms/site-data";
import { EventsView } from "./events-view";
import { pageMetadata } from "@/lib/brands/metadata";

export const generateMetadata = pageMetadata("Brands.iwacu.meta", "events");

/** /events — upcoming experiences from the CMS (Admin → Experiences), or Events.items until it's seeded. */
export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const data = await getSiteData(locale);
  return <EventsView events={data?.upcoming} />;
}
