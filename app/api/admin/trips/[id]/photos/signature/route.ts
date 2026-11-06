/**
 * POST /api/admin/trips/<id>/photos/signature
 *   → { url, fields }: the browser posts one photo plus `fields` to `url` (straight to
 *     Cloudinary), then sends Cloudinary's reply to POST /api/admin/trips/<id>/photos.
 * The photo always lands in sura-trips/<id>/ (lib/cloudinary.ts).
 * 503 "storage_not_configured" while the CLOUDINARY_* variables are missing.
 */
import { isCloudinaryConfigured, tripPhotoSignature } from "@/lib/cloudinary";
import { getTripForAdmin } from "@/lib/cms/trips-server";
import { adminGuard, adminJson, fail, serverError, type RouteCtx } from "@/lib/cms/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: RouteCtx) {
  const blocked = await adminGuard(req, { write: true, perm: "trips:edit" });
  if (blocked) return blocked;
  if (!isCloudinaryConfigured()) return fail("storage_not_configured", 503);
  const { id } = await params;
  try {
    if (!(await getTripForAdmin(id))) return fail("not_found", 404);
    return adminJson(tripPhotoSignature(id));
  } catch (err) {
    return serverError("sign trip photo", err);
  }
}
