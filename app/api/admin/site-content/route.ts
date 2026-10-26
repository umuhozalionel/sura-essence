/**
 * GET /api/admin/site-content → every editable section with its blocks:
 * the default text (messages/*.json), what's saved, and the placeholders each block may use.
 * Admin only.
 */
import { listContentForAdmin } from "@/lib/cms/site-content-server";
import { adminGuard, adminJson, serverError } from "@/lib/cms/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const blocked = await adminGuard(req, { write: false, perm: "content:manage" });
  if (blocked) return blocked;
  try {
    return adminJson({ items: await listContentForAdmin() });
  } catch (err) {
    return serverError("list site content", err);
  }
}
