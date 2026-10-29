/**
 * GET  /api/admin/bookings → the bookings of the brands this person may see, latest trip first (bookings:view)
 * POST /api/admin/bookings → log a new WhatsApp booking                                       (bookings:create)
 * Logging one as cancelled also needs bookings:cancel. A booking's brand follows
 * from its service, and must be one of the person's brands (bookings:brand:*).
 * Permissions: lib/admin-rbac.ts.
 */
import { NextResponse } from "next/server";
import { actorOf, getAdminSession, sessionWith } from "@/lib/admin-auth";
import { bookingBrands } from "@/lib/admin-rbac";
import { adminGuard, requirePermission } from "@/lib/cms/server";
import { createBooking, listBookings } from "@/lib/admin-bookings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "no-store" };
const fail = (error: string, status: number, extra?: object) =>
  NextResponse.json({ error, ...extra }, { status, headers: noStore });

export async function GET(req: Request) {
  const blocked = await adminGuard(req, { write: false, perm: "bookings:view" });
  if (blocked) return blocked;
  const session = await getAdminSession();
  if (!session) return fail("unauthorized", 401);
  try {
    return NextResponse.json({ items: await listBookings(bookingBrands(session.role)) }, { headers: noStore });
  } catch (err) {
    console.error("[admin] list bookings failed:", err);
    return fail("unavailable", 500);
  }
}

export async function POST(req: Request) {
  const blocked = await adminGuard(req, { write: true, perm: "bookings:create" });
  if (blocked) return blocked;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail("invalid_json", 400);
  }
  if ((body as { status?: unknown } | null)?.status === "cancelled") {
    const denied = await requirePermission("bookings:cancel");
    if (denied) return denied;
  }

  const session = await sessionWith("bookings:create");
  if (!session) return fail("unauthorized", 401);

  try {
    const result = await createBooking(body, { by: actorOf(session), brands: bookingBrands(session.role) });
    if (!result.ok) {
      if ("forbidden" in result) return fail("forbidden", 403);
      return fail("invalid", 422, "errors" in result ? { fields: result.errors } : undefined);
    }
    return NextResponse.json({ item: result.booking }, { status: 201, headers: noStore });
  } catch (err) {
    console.error("[admin] create booking failed:", err);
    return fail("unavailable", 500);
  }
}
