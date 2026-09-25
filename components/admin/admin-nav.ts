import { CalendarRange, CarFront, LayoutDashboard, MessageSquareQuote, Settings, type LucideIcon } from "lucide-react";

/** Sidebar links and breadcrumb names (messages: Admin.nav.<id>). Order = order in the sidebar. */
export const ADMIN_NAV = [
  { id: "dashboard", href: "/admin", icon: LayoutDashboard },
  { id: "bookings", href: "/admin/bookings", icon: CalendarRange },
  { id: "fleet", href: "/admin/fleet", icon: CarFront },
  { id: "testimonials", href: "/admin/testimonials", icon: MessageSquareQuote },
  { id: "settings", href: "/admin/settings", icon: Settings },
] as const satisfies readonly { id: string; href: string; icon: LucideIcon }[];

export type AdminNavId = (typeof ADMIN_NAV)[number]["id"];

/** Items needing attention, shown as badges in the sidebar. null when the database isn't reachable. */
export type NavCounts = { bookings: number; testimonials: number } | null;

/** The section a path belongs to ("/admin/bookings" → bookings). Paths come without the locale. */
export function activeSection(pathname: string): AdminNavId {
  const match = [...ADMIN_NAV]
    .sort((a, b) => b.href.length - a.href.length)
    .find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));
  return match?.id ?? "dashboard";
}
