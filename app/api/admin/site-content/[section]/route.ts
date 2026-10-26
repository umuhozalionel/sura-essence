/**
 * PUT /api/admin/site-content/<section>  { blocks: { "<key>": { en, fr } } }
 *   → saves a section's text. An empty language shows the default from messages/*.json.
 *     Placeholders must be the ones the block offers (e.g. {km}).
 * Admin only. Clears the "cms:site-content" cache, so pages show the new text at once.
 */
import { isContentSection, parseSectionBlocks, saveSection } from "@/lib/cms/site-content-server";
import { adminBody, adminGuard, adminJson, fail, invalid, serverError } from "@/lib/cms/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PUT(req: Request, { params }: { params: Promise<{ section: string }> }) {
  const blocked = await adminGuard(req, { write: true, perm: "content:manage" });
  if (blocked) return blocked;
  const { section } = await params;
  if (!isContentSection(section)) return fail("not_found", 404);
  const body = await adminBody(req, 64 * 1024);
  if (!body.ok) return fail(body.error, body.status);
  const parsed = parseSectionBlocks(section, body.value);
  if (!parsed.ok) return invalid(parsed);
  try {
    return adminJson({ item: await saveSection(section, parsed.value) });
  } catch (err) {
    return serverError("save site content", err);
  }
}
