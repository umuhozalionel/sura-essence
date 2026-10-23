/**
 * POST /api/admin/pricing/undo  { changeId } → puts that field back to its value before the change.
 * 409 + the current document if the field has changed again since. The undo is itself logged.
 * Admin only.
 */
import { undoChange } from "@/lib/cms/pricing-config-server";
import { adminBody, adminGuard, adminJson, fail, serverError } from "@/lib/cms/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const blocked = await adminGuard(req, { write: true });
  if (blocked) return blocked;
  const body = await adminBody(req, 1024);
  if (!body.ok) return fail(body.error, body.status);
  const changeId = (body.value as { changeId?: unknown } | null)?.changeId;
  if (typeof changeId !== "string") return fail("invalid", 400, { field: "changeId", reason: "required" });
  try {
    const result = await undoChange(changeId);
    if (result.ok) return adminJson({ item: result.live, change: result.change });
    if (result.reason === "notFound") return fail("not_found", 404);
    if (result.reason === "conflict") return fail("conflict", 409, { item: result.live });
    return fail("invalid", 400, { field: result.field, reason: result.detail });
  } catch (err) {
    return serverError("undo pricing change", err);
  }
}
