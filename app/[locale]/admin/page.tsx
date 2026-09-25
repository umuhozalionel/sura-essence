import type { Metadata } from "next";
import { adminConfig, isAdmin } from "@/lib/admin-auth";
import { AdminLogin } from "@/components/admin/admin-login";
import { AdminDashboard } from "@/components/admin/admin-dashboard";

// Checked on the server for every request: without a valid, signed admin
// cookie, the dashboard code isn't even sent to the browser.
export const dynamic = "force-dynamic";

// Keep the admin page out of search engines.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  if (await isAdmin()) return <AdminDashboard />;
  return <AdminLogin configured={adminConfig() === "ok"} />;
}
