/**
 * GET /api/admin/testimonials → every testimonial (pending + approved), newest first.
 * Needs testimonials:manage (lib/admin-rbac.ts).
 */
import { NextResponse } from "next/server";
import { adminGuard } from "@/lib/cms/server";
import { listAllForAdmin } from "@/lib/testimonials-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "no-store" };

export async function GET(req: Request) {
  const blocked = await adminGuard(req, { write: false, perm: "testimonials:manage" });
  if (blocked) return blocked;
  try {
    return NextResponse.json({ items: await listAllForAdmin() }, { headers: noStore });
  } catch (err) {
    console.error("[admin] list testimonials failed:", err);
    return NextResponse.json({ error: "unavailable" }, { status: 500, headers: noStore });
  }
}
