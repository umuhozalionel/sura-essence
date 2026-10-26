/**
 * GET   /api/admin/pricing → the live pricing document and the latest changes.
 *                            Creates the document the first time (from DEFAULT_PRICING).
 * PATCH /api/admin/pricing  { path, value, expected } → save one number.
 *         path      "fuelPricePerLitre.petrol", one of the fields in lib/cms/pricing-config.ts
 *         value     the new number
 *         expected  the value the editor started from: if the field changed since, 409 + the current document
 * Needs fleet:view to read and fleet:edit to save (lib/admin-rbac.ts). Every save clears the "cms:pricing" cache, so quotes everywhere switch at once.
 */
import { ensureLivePricing, listPricingChanges, parseFieldEdit, saveField } from "@/lib/cms/pricing-config-server";
import { actorOf, getAdminSession } from "@/lib/admin-auth";
import { adminBody, adminGuard, adminJson, fail, invalid, serverError } from "@/lib/cms/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const blocked = await adminGuard(req, { write: false, perm: "fleet:view" });
  if (blocked) return blocked;
  try {
    const [{ live }, changes] = await Promise.all([ensureLivePricing(), listPricingChanges()]);
    return adminJson({ item: live, changes });
  } catch (err) {
    return serverError("get live pricing", err);
  }
}

export async function PATCH(req: Request) {
  const blocked = await adminGuard(req, { write: true, perm: "fleet:edit" });
  if (blocked) return blocked;
  const body = await adminBody(req, 2 * 1024);
  if (!body.ok) return fail(body.error, body.status);
  const parsed = parseFieldEdit(body.value);
  if (!parsed.ok) return invalid(parsed);
  const session = await getAdminSession();
  if (!session) return fail("unauthorized", 401);
  try {
    const result = await saveField(parsed.value, actorOf(session));
    if (result.ok) return adminJson({ item: result.live, change: result.change });
    if (result.reason === "conflict") return fail("conflict", 409, { item: result.live });
    return fail("invalid", 400, { field: result.field, reason: result.detail });
  } catch (err) {
    return serverError("save pricing field", err);
  }
}
