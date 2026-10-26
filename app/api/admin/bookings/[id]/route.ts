/**
 * PATCH  /api/admin/bookings/<id>  { ...fields }  → update (e.g. just { status: "confirmed" })
 * DELETE /api/admin/bookings/<id>                 → remove for good                (bookings:delete)
 *
 * PATCH needs, depending on what it changes (lib/admin-rbac.ts):
 *   status "cancelled"            bookings:cancel
 *   any other status              bookings:status
 *   any other field               bookings:update
 */
import { NextResponse } from "next/server";
import { actorOf, getAdminSession } from "@/lib/admin-auth";
import type { Permission } from "@/lib/admin-rbac";
import { adminGuard, requirePermission } from "@/lib/cms/server";
import { deleteBooking, updateBooking } from "@/lib/admin-bookings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };
const noStore = { "Cache-Control": "no-store" };
const fail = (error: string, status: number, extra?: object) =>
  NextResponse.json({ error, ...extra }, { status, headers: noStore });

/** What a patch body needs: see the list above. */
function permissionsFor(patch: unknown): Permission[] {
  if (!patch || typeof patch !== "object") return ["bookings:update"];
  const needed = new Set<Permission>();
  for (const [key, value] of Object.entries(patch)) {
    if (key === "status") needed.add(value === "cancelled" ? "bookings:cancel" : "bookings:status");
    else needed.add("bookings:update");
  }
  return needed.size ? [...needed] : ["bookings:update"];
}

export async function PATCH(req: Request, { params }: Ctx) {
  const blocked = await adminGuard(req, { write: true, perm: "bookings:view" });
  if (blocked) return blocked;
  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail("invalid_json", 400);
  }
  for (const perm of permissionsFor(body)) {
    const denied = await requirePermission(perm);
    if (denied) return denied;
  }

  const session = await getAdminSession();
  if (!session) return fail("unauthorized", 401);

  try {
    const result = await updateBooking(id, body, actorOf(session));
    if (result.ok) return NextResponse.json({ item: result.booking }, { headers: noStore });
    if ("notFound" in result) return fail("not_found", 404);
    return fail("invalid", 422, { fields: result.errors });
  } catch (err) {
    console.error("[admin] update booking failed:", err);
    return fail("unavailable", 500);
  }
}

export async function DELETE(req: Request, { params }: Ctx) {
  const blocked = await adminGuard(req, { write: true, perm: "bookings:delete" });
  if (blocked) return blocked;
  const { id } = await params;
  try {
    return (await deleteBooking(id))
      ? NextResponse.json({ ok: true }, { headers: noStore })
      : fail("not_found", 404);
  } catch (err) {
    console.error("[admin] delete booking failed:", err);
    return fail("unavailable", 500);
  }
}
