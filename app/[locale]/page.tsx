import { setRequestLocale } from "next-intl/server";
import { getSiteData } from "@/lib/cms/site-data";
import { HomeView } from "./home-view";

/** The homepage. Activities and gallery come from the CMS, or messages/*.json until it's seeded. */
export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const data = await getSiteData(locale);
  return <HomeView upcoming={data?.upcoming} past={data?.past} trips={data?.trips} />;
}
