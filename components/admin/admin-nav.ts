import {
  CalendarRange, CarFront, FileText, LayoutDashboard, Map as MapIcon, MessageSquareQuote, Mountain, Settings, Star, TriangleAlert, UsersRound, type LucideIcon,
} from "lucide-react";
import type { AdminRole, Permission } from "@/lib/admin-rbac";

/**
 * Sidebar links and breadcrumb names (messages: Admin.nav.<id>). Order = order in the sidebar.
 * `perm` decides who sees the link (lib/admin-rbac.ts); each page and API route checks it again.
 */
export const ADMIN_NAV = [
  { id: "dashboard", href: "/admin", icon: LayoutDashboard, perm: "dashboard:view" },
  { id: "bookings", href: "/admin/bookings", icon: CalendarRange, perm: "bookings:view" },
  { id: "fleet", href: "/admin/fleet", icon: CarFront, perm: "fleet:view" },
  { id: "experiences", href: "/admin/experiences", icon: Mountain, perm: "experiences:view" },
  { id: "tours", href: "/admin/tours", icon: MapIcon, perm: "tours:view" },
  { id: "tripAlerts", href: "/admin/trip-alerts", icon: TriangleAlert, perm: "tripAlerts:view" },
  { id: "testimonials", href: "/admin/testimonials", icon: MessageSquareQuote, perm: "testimonials:manage" },
  { id: "driverReviews", href: "/admin/driver-reviews", icon: Star, perm: "driverReviews:manage" },
  { id: "team", href: "/admin/team", icon: UsersRound, perm: "team:manage" },
  { id: "content", href: "/admin/content", icon: FileText, perm: "content:manage" },
  // Everyone: theme, language and sign-out. The contact details on it need settings:manage.
  { id: "settings", href: "/admin/settings", icon: Settings, perm: "dashboard:view" },
] as const satisfies readonly { id: string; href: string; icon: LucideIcon; perm: Permission }[];

export type AdminNavId = (typeof ADMIN_NAV)[number]["id"];

/**
 * Items needing attention, shown as badges in the sidebar. null when the database isn't reachable;
 * a count is null when this person's role doesn't include that section.
 */
export type NavCounts = { bookings: number | null; testimonials: number | null } | null;

/** Who's signed in, for the header. `name` is null for the first-run (ADMIN_PASSWORD) sign-in. */
export type AdminUserInfo = { name: string | null; role: AdminRole };

/** The section a path belongs to ("/admin/bookings" → bookings). Paths come without the locale. */
export function activeSection(pathname: string): AdminNavId {
  const match = [...ADMIN_NAV]
    .sort((a, b) => b.href.length - a.href.length)
    .find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));
  return match?.id ?? "dashboard";
}
