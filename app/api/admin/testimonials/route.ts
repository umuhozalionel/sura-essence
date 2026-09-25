/**
 * GET /api/admin/testimonials → every testimonial (pending + approved), newest first.
 * Admin only.
 */
import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { isMongoConfigured } from "@/lib/mongodb";
import { listAllForAdmin } from "@/lib/testimonials-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "no-store" };

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "unauthorized" }, { status: 401, headers: noStore });
  if (!isMongoConfigured) return NextResponse.json({ error: "not_configured" }, { status: 503, headers: noStore });
  try {
    return NextResponse.json({ items: await listAllForAdmin() }, { headers: noStore });
  } catch (err) {
    console.error("[admin] list testimonials failed:", err);
    return NextResponse.json({ error: "unavailable" }, { status: 500, headers: noStore });
  }
}
