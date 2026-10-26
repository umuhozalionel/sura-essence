/**
 * Who may do what in the admin portal. Safe to import anywhere (no secrets,
 * no server code): the server uses it to allow or refuse each request, and the
 * sidebar and screens use it to hide what someone can't use.
 *
 * Routes and pages check permissions, never role names, so adding a role later
 * only means adding a line to GRANTS.
 */
export const ADMIN_ROLES = ["main_admin", "managing_director", "assistant_manager"] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

export const PERMISSIONS = [
  "dashboard:view",
  // Bookings. "status" moves a booking between pending, confirmed and completed;
  // "cancel" sets it to cancelled; "update" edits everything else.
  "bookings:view", "bookings:create", "bookings:update", "bookings:status", "bookings:cancel", "bookings:delete",
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
  "seed:run",
] as const;
export type Permission = (typeof PERMISSIONS)[number];

const GRANTS: Record<AdminRole, readonly Permission[]> = {
  main_admin: PERMISSIONS,
  managing_director: [
    "dashboard:view",
    // Everything on bookings except deleting for good: cancelling keeps the record.
    "bookings:view", "bookings:create", "bookings:update", "bookings:status", "bookings:cancel",
    "fleet:view", "fleet:edit",
  ],
  assistant_manager: [
    "dashboard:view",
    "experiences:view", "experiences:edit",
    "tours:view", "tours:edit",
    "tripAlerts:view", "tripAlerts:edit",
  ],
};

export const isAdminRole = (v: unknown): v is AdminRole => ADMIN_ROLES.includes(v as AdminRole);

export const can = (role: AdminRole, permission: Permission) => GRANTS[role].includes(permission);

/** What the bookings screen may show for this role. */
export type BookingAbilities = { create: boolean; update: boolean; status: boolean; cancel: boolean; delete: boolean };

export const bookingAbilities = (role: AdminRole): BookingAbilities => ({
  create: can(role, "bookings:create"),
  update: can(role, "bookings:update"),
  status: can(role, "bookings:status"),
  cancel: can(role, "bookings:cancel"),
  delete: can(role, "bookings:delete"),
});
