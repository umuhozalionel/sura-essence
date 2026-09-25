/**
 * PATCH  /api/admin/testimonials/<id>  { status: "approved" | "pending" } → publish / unpublish
 * DELETE /api/admin/testimonials/<id>                                     → remove for good
 * Admin only.
 */
import { NextResponse } from "next/server";
import { isAdmin, isSameOrigin } from "@/lib/admin-auth";
import { isMongoConfigured } from "@/lib/mongodb";
import { deleteTestimonial, setTestimonialStatus } from "@/lib/testimonials-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };
const noStore = { "Cache-Control": "no-store" };
const fail = (error: string, status: number) => NextResponse.json({ error }, { status, headers: noStore });

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

  let status: unknown;
  try {
    status = ((await req.json()) as { status?: unknown }).status;
  } catch {
    return fail("invalid_json", 400);
  }
  if (status !== "approved" && status !== "pending") return fail("invalid_status", 400);

  try {
    const item = await setTestimonialStatus(id, status);
    return item ? NextResponse.json({ item }, { headers: noStore }) : fail("not_found", 404);
  } catch (err) {
    console.error("[admin] update testimonial failed:", err);
    return fail("unavailable", 500);
  }
}

export async function DELETE(req: Request, { params }: Ctx) {
  const blocked = await guard(req);
  if (blocked) return blocked;
  const { id } = await params;
  try {
    return (await deleteTestimonial(id))
      ? NextResponse.json({ ok: true }, { headers: noStore })
      : fail("not_found", 404);
  } catch (err) {
    console.error("[admin] delete testimonial failed:", err);
    return fail("unavailable", 500);
  }
}
