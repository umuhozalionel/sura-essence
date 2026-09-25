/**
 * GET /api/admin/testimonials/<id>/photo → the stored Base64 photo, decoded,
 * for pending AND approved testimonials. Admin only; never cached publicly.
 */
import { isAdmin } from "@/lib/admin-auth";
import { isMongoConfigured } from "@/lib/mongodb";
import { getPhotoForAdmin } from "@/lib/testimonials-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return new Response(null, { status: 401, headers: { "Cache-Control": "no-store" } });
  if (!isMongoConfigured) return new Response(null, { status: 404 });
  const { id } = await params;
  try {
    const photo = await getPhotoForAdmin(id);
    if (!photo) return new Response(null, { status: 404, headers: { "Cache-Control": "no-store" } });
    return new Response(new Uint8Array(photo.bytes), {
      headers: {
        "Content-Type": photo.mime,
        "Content-Length": String(photo.bytes.length),
        "Cache-Control": "private, max-age=300",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'none'; sandbox",
      },
    });
  } catch (err) {
    console.error("[admin] photo failed:", err);
    return new Response(null, { status: 500 });
  }
}
