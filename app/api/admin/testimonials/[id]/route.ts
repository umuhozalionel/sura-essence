/**
 * PATCH  /api/admin/testimonials/<id>  { status: "approved" | "pending" } → publish / unpublish
 * DELETE /api/admin/testimonials/<id>                                     → remove for good
 * Needs testimonials:manage (lib/admin-rbac.ts).
 */
import { NextResponse } from "next/server";
import { adminGuard } from "@/lib/cms/server";
import { deleteTestimonial, setTestimonialStatus } from "@/lib/testimonials-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };
const noStore = { "Cache-Control": "no-store" };
const fail = (error: string, status: number) => NextResponse.json({ error }, { status, headers: noStore });

const guard = (req: Request) => adminGuard(req, { write: true, perm: "testimonials:manage" });

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
