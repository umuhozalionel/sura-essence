/**
 * PATCH  /api/admin/driver-reviews/<id>  { status: "approved" | "pending" } → publish / unpublish
 * PATCH  /api/admin/driver-reviews/<id>  { client, car, comment, sample }   → edit the text
 * DELETE /api/admin/driver-reviews/<id>                                     → remove for good
 * Needs driverReviews:manage (lib/admin-rbac.ts).
 */
import { NextResponse } from "next/server";
import { adminGuard } from "@/lib/cms/server";
import { readJsonBody } from "@/lib/read-json-body";
import { deleteReview, parseReview, setReviewStatus, updateReview } from "@/lib/driver-reviews-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };
const noStore = { "Cache-Control": "no-store" };
const fail = (error: string, status: number, extra?: Record<string, unknown>) =>
  NextResponse.json({ error, ...extra }, { status, headers: noStore });

const guard = (req: Request) => adminGuard(req, { write: true, perm: "driverReviews:manage" });

export async function PATCH(req: Request, { params }: Ctx) {
  const blocked = await guard(req);
  if (blocked) return blocked;
  const { id } = await params;

  const body = await readJsonBody(req, 32 * 1024);
  if (!body.ok) return fail(body.error, body.status);
  const value = body.value as Record<string, unknown> | null;

  try {
    if (value && typeof value === "object" && "status" in value) {
      if (value.status !== "approved" && value.status !== "pending") return fail("invalid_status", 400);
      const item = await setReviewStatus(id, value.status);
      return item ? NextResponse.json({ item }, { headers: noStore }) : fail("not_found", 404);
    }
    const parsed = parseReview(value);
    if (!parsed.ok) return fail("invalid", 400, { reason: parsed.reason, field: parsed.field });
    const item = await updateReview(id, parsed.value);
    return item ? NextResponse.json({ item }, { headers: noStore }) : fail("not_found", 404);
  } catch (err) {
    console.error("[admin] update driver review failed:", err);
    return fail("unavailable", 500);
  }
}

export async function DELETE(req: Request, { params }: Ctx) {
  const blocked = await guard(req);
  if (blocked) return blocked;
  const { id } = await params;
  try {
    return (await deleteReview(id)) ? NextResponse.json({ ok: true }, { headers: noStore }) : fail("not_found", 404);
  } catch (err) {
    console.error("[admin] delete driver review failed:", err);
    return fail("unavailable", 500);
  }
}
