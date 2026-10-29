/**
 * Who may do what in the admin portal. Safe to import anywhere (no secrets,
 * no server code): the server uses it to allow or refuse each request, and the
 * sidebar and screens use it to hide what someone can't use.
 *
 * Routes and pages check permissions, never role names, so adding a role later
 * only means adding a line to GRANTS.
 */
import { BOOKING_BRANDS, type BookingBrand } from "./types";

export const ADMIN_ROLES = ["main_admin", "managing_director", "assistant_manager"] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

export const PERMISSIONS = [
  "dashboard:view",
  "profile:edit", // one's own profile, password and sessions (Settings → My profile)
  // Bookings. "status" moves a booking between pending, confirmed and completed;
  // "cancel" sets it to cancelled; "update" edits everything else.
  "bookings:view", "bookings:create", "bookings:update", "bookings:status", "bookings:cancel", "bookings:delete",
  // Which brands' bookings the actions above apply to. Without one, no bookings at all.
  "bookings:brand:movana", "bookings:brand:iwacu",
  "fleet:view", "fleet:edit",
  "experiences:view", "experiences:edit", // galleries are part of each experience
  "tours:view", "tours:edit",
  "tripAlerts:view", "tripAlerts:edit",
  "testimonials:manage",
  "driverReviews:manage",
  "team:manage",
  "content:manage",
  "settings:manage",
  "users:manage",
  "users:viewCv", // open other people's CVs (everyone can open their own)
  "seed:run",
] as const;
export type Permission = (typeof PERMISSIONS)[number];

/**
 * The Managing Director runs SURA Movana (its bookings, fleet, trip alerts); the
 * Assistant Manager runs SURA Iwacu (its bookings, experiences, tours). Each sees
 * only their own brand's bookings, and neither can delete one for good.
 */
const GRANTS: Record<AdminRole, readonly Permission[]> = {
  main_admin: PERMISSIONS,
  managing_director: [
    "dashboard:view",
    "profile:edit",
    // Everything on bookings except deleting for good: cancelling keeps the record.
    "bookings:view", "bookings:create", "bookings:update", "bookings:status", "bookings:cancel",
    "bookings:brand:movana",
    "fleet:view", "fleet:edit",
    "tripAlerts:view", "tripAlerts:edit",
  ],
  assistant_manager: [
    "dashboard:view",
    "profile:edit",
    "bookings:view", "bookings:create", "bookings:update", "bookings:status", "bookings:cancel",
    "bookings:brand:iwacu",
    "experiences:view", "experiences:edit",
    "tours:view", "tours:edit",
  ],
};

export const isAdminRole = (v: unknown): v is AdminRole => ADMIN_ROLES.includes(v as AdminRole);

export const can = (role: AdminRole, permission: Permission) => GRANTS[role].includes(permission);

/** The brands whose bookings this role works with: every list, count and write is limited to them. */
export const bookingBrands = (role: AdminRole): BookingBrand[] =>
  can(role, "bookings:view") ? BOOKING_BRANDS.filter((b) => can(role, `bookings:brand:${b}`)) : [];

/** What the bookings screen may show for this role. */
export type BookingAbilities = { create: boolean; update: boolean; status: boolean; cancel: boolean; delete: boolean };

export const bookingAbilities = (role: AdminRole): BookingAbilities => ({
  create: can(role, "bookings:create"),
  update: can(role, "bookings:update"),
  status: can(role, "bookings:status"),
  cancel: can(role, "bookings:cancel"),
  delete: can(role, "bookings:delete"),
});
