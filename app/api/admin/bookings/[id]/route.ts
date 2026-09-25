/**
 * PATCH  /api/admin/bookings/<id>  { ...fields }  → update (e.g. just { status: "confirmed" })
 * DELETE /api/admin/bookings/<id>                 → remove for good
 * Admin only.
 */
import { NextResponse } from "next/server";
import { isAdmin, isSameOrigin } from "@/lib/admin-auth";
import { isMongoConfigured } from "@/lib/mongodb";
import { deleteBooking, updateBooking } from "@/lib/admin-bookings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };
const noStore = { "Cache-Control": "no-store" };
const fail = (error: string, status: number, extra?: object) =>
  NextResponse.json({ error, ...extra }, { status, headers: noStore });

async function guard(req: Request) {
  if (!(await isAdmin())) return fail("unauthorized", 401);
  if (!isSameOrigin(req)) return fail("forbidden", 403);
  if (!isMongoConfigured) return fail("not_configured", 503);
  return null;
}

export async function PATCH(req: Request, { params }: Ctx) {
  const blocked = await guard(req);
  if (blocked) return blocked;
  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail("invalid_json", 400);
  }

  try {
    const result = await updateBooking(id, body);
    if (result.ok) return NextResponse.json({ item: result.booking }, { headers: noStore });
    if ("notFound" in result) return fail("not_found", 404);
    return fail("invalid", 422, { fields: result.errors });
  } catch (err) {
    console.error("[admin] update booking failed:", err);
    return fail("unavailable", 500);
  }
}

export async function DELETE(req: Request, { params }: Ctx) {
  const blocked = await guard(req);
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
