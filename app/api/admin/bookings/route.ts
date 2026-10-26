/**
 * GET  /api/admin/bookings → every logged booking, latest trip date first   (bookings:view)
 * POST /api/admin/bookings → log a new WhatsApp booking                     (bookings:create)
 * Logging one as cancelled also needs bookings:cancel. Permissions: lib/admin-rbac.ts.
 */
import { NextResponse } from "next/server";
import { actorOf, sessionWith } from "@/lib/admin-auth";
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
  try {
    return NextResponse.json({ items: await listBookings() }, { headers: noStore });
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
    const result = await createBooking(body, actorOf(session));
    if (!result.ok) return fail("invalid", 422, "errors" in result ? { fields: result.errors } : undefined);
    return NextResponse.json({ item: result.booking }, { status: 201, headers: noStore });
  } catch (err) {
    console.error("[admin] create booking failed:", err);
    return fail("unavailable", 500);
  }
}
