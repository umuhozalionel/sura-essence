import { setRequestLocale } from "next-intl/server";
import { DestinationsHistorySection } from "@/components/destinations-history-section";
import { pageMetadata } from "@/lib/brands/metadata";

export const generateMetadata = pageMetadata("Brands.iwacu.meta", "rwandaStory");

/** /iwacu/rwanda-story: "Places that tell Rwanda's story", in the Kigali city tours menu. */
export default async function RwandaStoryPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <div className="pt-[calc(var(--header-h)+2.5rem)]">
      <DestinationsHistorySection />
    </div>
  );
}
