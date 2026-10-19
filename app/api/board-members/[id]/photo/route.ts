/**
 * GET /api/board-members/<id>/photo → the uploaded portrait of a VISIBLE board member.
 * The URL carries a version (?v=…) that changes on every save, so it can be cached for long.
 */
import { isMongoConfigured } from "@/lib/mongodb";
import { getPhoto } from "@/lib/board-members-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const notFound = () => new Response(null, { status: 404, headers: { "Cache-Control": "no-store" } });
  if (!isMongoConfigured) return notFound();
  try {
    const photo = await getPhoto(id, { includeHidden: false });
    if (!photo) return notFound();
    return new Response(new Uint8Array(photo.bytes), {
      headers: {
        "Content-Type": photo.mime,
        "Content-Length": String(photo.bytes.length),
        "Cache-Control": "public, max-age=604800, s-maxage=604800, immutable",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'none'; sandbox",
      },
    });
  } catch (err) {
    console.error("[board-members] photo failed:", err);
    return new Response(null, { status: 500 });
  }
}
