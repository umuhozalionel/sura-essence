import { setRequestLocale } from "next-intl/server";
import { getSiteData } from "@/lib/cms/site-data";
import { GalleryView } from "./gallery-view";

/** /gallery — trips with photos from the CMS, or Gallery.trips until it's seeded. */
export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const data = await getSiteData(locale);
  return <GalleryView trips={data?.trips} />;
}
