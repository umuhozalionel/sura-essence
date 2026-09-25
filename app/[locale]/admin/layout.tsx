import type { Metadata } from "next";
import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";
import { adminConfig, isAdmin } from "@/lib/admin-auth";
import { loadNavCounts } from "@/lib/admin-data";
import { AdminLogin } from "@/components/admin/admin-login";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminThemeRoot } from "@/components/admin/admin-theme";
import { SIDEBAR_COOKIE, THEME_COOKIE, parseTheme } from "@/components/admin/admin-prefs";
import "./admin.css";

/**
 * Frame for every /admin page (Dashboard, Bookings, Fleet, Testimonials, Settings).
 *
 * The signed admin cookie is checked on the server for every request. Without
 * it, only the sign-in form is sent: no sidebar, no data, no admin code.
 * Each page checks again too, because Next.js can render a page on its own
 * during in-app navigation without re-running this layout.
 */
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Admin.meta");
  return {
    title: { default: t("title"), template: t("titleTemplate") }, // "Bookings · SURA Admin"
    robots: { index: false, follow: false }, // keep the portal out of search engines
  };
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const jar = await cookies();
  const theme = parseTheme(jar.get(THEME_COOKIE)?.value);

  if (!(await isAdmin())) {
    return (
      <AdminThemeRoot initialTheme={theme}>
        <AdminLogin configured={adminConfig() === "ok"} />
      </AdminThemeRoot>
    );
  }

  return (
    <AdminShell
      theme={theme}
      sidebarCollapsed={jar.get(SIDEBAR_COOKIE)?.value === "collapsed"}
      counts={await loadNavCounts()}
    >
      {children}
    </AdminShell>
  );
}
