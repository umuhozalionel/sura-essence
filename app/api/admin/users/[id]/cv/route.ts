/**
 * GET /api/admin/users/<id>/cv → redirects to a signed Cloudinary link for that
 * person's CV, valid for 5 minutes. CVs are stored as "authenticated" files, so
 * this is the only way to open one.
 * Allowed for the person themself (profile:edit) and for users:viewCv (Main Admin).
 * 404 when there's no CV (or no access to say otherwise).
 */
import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { can } from "@/lib/admin-rbac";
import { getCv } from "@/lib/admin-users";
import { isCloudinaryConfigured, privateDownloadUrl } from "@/lib/cloudinary";
import { NO_STORE, fail, serverError, type RouteCtx } from "@/lib/cms/server";
import { isMongoConfigured } from "@/lib/mongodb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: RouteCtx) {
  const session = await getAdminSession();
  if (!session) return fail("unauthorized", 401);
  const { id } = await params;
  const own = session.userId === id && can(session.role, "profile:edit");
  if (!own && !can(session.role, "users:viewCv")) return fail("forbidden", 403);
  if (!isMongoConfigured || !isCloudinaryConfigured()) return fail("not_configured", 503);
  try {
    const cv = await getCv(id);
    if (!cv) return fail("not_found", 404);
    return NextResponse.redirect(privateDownloadUrl(cv.publicId, cv.format), { status: 302, headers: NO_STORE });
  } catch (err) {
    return serverError("open CV", err);
  }
}
