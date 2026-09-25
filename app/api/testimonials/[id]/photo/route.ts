/**
 * GET /api/testimonials/<id>/photo → the avatar of an APPROVED testimonial,
 * decoded from the Base64 stored in MongoDB. Pending or declined → 404.
 */
import { isMongoConfigured } from "@/lib/mongodb";
import { getApprovedPhoto } from "@/lib/testimonials-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const notFound = () => new Response(null, { status: 404, headers: { "Cache-Control": "no-store" } });
  if (!isMongoConfigured) return notFound();

  try {
    const photo = await getApprovedPhoto(id);
    if (!photo) return notFound();
    return new Response(new Uint8Array(photo.bytes), {
      headers: {
        "Content-Type": photo.mime,
        "Content-Length": String(photo.bytes.length),
        // Browsers and the CDN keep it a day — about one database read per photo per day, not per visitor.
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
        // Belt and braces: never let a stored file be interpreted as anything but an image.
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'none'; sandbox",
      },
    });
  } catch (err) {
    console.error("[testimonials] photo failed:", err);
    return new Response(null, { status: 500 });
  }
}
