import { setRequestLocale } from "next-intl/server";
import { getSiteToursData } from "@/lib/cms/site-data";
import { ToursView } from "./tours-view";
import { pageMetadata } from "@/lib/brands/metadata";

export const generateMetadata = pageMetadata("Brands.iwacu.meta", "kigaliTours");

/** /tours — tour collections from the CMS (Admin → Tours), or Tours.collections until it's seeded. */
export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <ToursView collections={(await getSiteToursData(locale)) ?? undefined} />;
}
