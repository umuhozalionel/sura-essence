import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { isAdmin } from "@/lib/admin-auth";
import { getSiteText } from "@/lib/cms/site-content-server";
import { SessionGuard } from "@/components/admin/session-guard";
import { PricingEditor } from "@/components/admin/pricing-editor";
import { SiteTextProvider } from "@/components/site-text";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Admin.nav");
  return { title: t("fleet") };
}

/**
 * Fleet & rates — the live pricing control panel. Each number on the live
 * pricing document (lib/cms/pricing-config-server.ts) is saved on its own and
 * logged in pricing_changes. The page's headings and "How trips are priced"
 * text come from Admin → Site content (section "fleet").
 *
 * Developers: app/[locale]/layout.tsx passes the live rates to the booking
 * form, hero and Transfers page (components/pricing-provider.tsx), and
 * lib/public-bookings.ts re-prices bookings with them. Every save clears the
 * "cms:pricing" cache, so they all switch together.
 */
export default async function AdminFleetPage() {
  if (!(await isAdmin())) return <SessionGuard />;
  const fleet = await getSiteText("fleet", await getLocale());
  return (
    <SiteTextProvider texts={{ fleet }}>
      <PricingEditor />
    </SiteTextProvider>
  );
}
