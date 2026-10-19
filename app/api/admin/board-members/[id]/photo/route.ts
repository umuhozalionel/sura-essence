/**
 * GET /api/admin/board-members/<id>/photo → the uploaded portrait, hidden members included.
 * Admin only; never cached publicly.
 */
import { isAdmin } from "@/lib/admin-auth";
import { isMongoConfigured } from "@/lib/mongodb";
import { getPhoto } from "@/lib/board-members-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return new Response(null, { status: 401, headers: { "Cache-Control": "no-store" } });
  if (!isMongoConfigured) return new Response(null, { status: 404 });
  const { id } = await params;
  try {
    const photo = await getPhoto(id, { includeHidden: true });
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
    console.error("[admin] board photo failed:", err);
    return new Response(null, { status: 500 });
  }
}
