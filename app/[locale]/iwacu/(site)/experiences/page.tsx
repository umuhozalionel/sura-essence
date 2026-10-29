import { setRequestLocale } from "next-intl/server";
import { getSiteData } from "@/lib/cms/site-data";
import { ActivitiesView } from "./activities-view";

/** /activities — the seasons calendar from the CMS, or Activities.seasons until it's seeded. */
export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const data = await getSiteData(locale);
  return <ActivitiesView seasons={data?.seasons} />;
}
