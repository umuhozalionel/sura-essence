/**
 * DELETE /api/admin/trips/<id>/photos/<photoId> → takes a recap photo off the website and off Cloudinary.
 * Writes clear the "cms:trips" cache.
 */
import { destroyImage } from "@/lib/cloudinary";
import { removeTripPhoto } from "@/lib/cms/trips-server";
import { CMS_TAGS, adminGuard, adminJson, fail, invalidate, serverError } from "@/lib/cms/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string; photoId: string }> }) {
  const blocked = await adminGuard(req, { write: true, perm: "trips:edit" });
  if (blocked) return blocked;
  const { id, photoId } = await params;
  try {
    const result = await removeTripPhoto(id, photoId);
    if (!result) return fail("not_found", 404);
    invalidate(CMS_TAGS.trips);
    // Off the website either way; a file left behind on Cloudinary is only logged.
    await destroyImage(result.removed.publicId).catch((err) => console.error("[cms] trip photo left on Cloudinary:", err));
    return adminJson({ item: result.item });
  } catch (err) {
    return serverError("delete trip photo", err);
  }
}
