import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";

/** /admin/settings opens on My profile, the tab every role has. */
export default async function AdminSettingsPage() {
  redirect({ href: "/admin/settings/profile", locale: await getLocale() });
}
