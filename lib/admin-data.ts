/**
 * Data for the admin layout and dashboard. SERVER ONLY — called by the /admin
 * pages after they've checked the admin cookie. Nothing here throws: if the
 * database is missing or down, the screens still render and say so.
 */
import { isMongoConfigured } from "./mongodb";
import { countBookings, countPendingBookings, loadBookingSummary } from "./admin-bookings";
import { countPendingTestimonials } from "./testimonials-server";
import type { NavCounts } from "@/components/admin/admin-nav";

/** Badges for the sidebar: bookings and testimonials waiting for someone. */
export async function loadNavCounts(): Promise<NavCounts> {
  if (!isMongoConfigured) return null;
  try {
    const [bookings, testimonials] = await Promise.all([countPendingBookings(), countPendingTestimonials()]);
    return { bookings, testimonials };
  } catch (err) {
    console.error("[admin] loading sidebar counts failed:", err);
    return null;
  }
}

/** Everything the dashboard shows. `today` is a Kigali date (YYYY-MM-DD). */
export async function loadDashboard(today: string) {
  const [{ state, summary }, pendingReviews] = await Promise.all([
    loadBookingSummary(today),
    isMongoConfigured ? countPendingTestimonials().catch(() => null) : Promise.resolve(null),
  ]);
  return { state, summary, pendingReviews };
}

/** For Settings: is the database reachable, and how much is in it? */
export async function loadDbHealth(): Promise<
  { state: "notConfigured" } | { state: "unavailable" } | { state: "ok"; bookings: number; pendingReviews: number }
> {
  if (!isMongoConfigured) return { state: "notConfigured" };
  try {
    const [bookings, pendingReviews] = await Promise.all([countBookings(), countPendingTestimonials()]);
    return { state: "ok", bookings, pendingReviews };
  } catch (err) {
    console.error("[admin] database check failed:", err);
    return { state: "unavailable" };
  }
}
