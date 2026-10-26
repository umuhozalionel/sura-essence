/**
 * GET   /api/admin/site-settings                        → current settings (defaults until first saved)
 * PUT   /api/admin/site-settings  { contact, socials }  → replace everything
 * PATCH /api/admin/site-settings  { contact?: {...} }   → change some fields, keep the rest
 * Admin only. Writes clear the "cms:site-settings" cache.
 */
import { getSiteSettingsForAdmin, parseSiteSettings, saveSiteSettings } from "@/lib/cms/site-settings-server";
import {
  CMS_TAGS, adminBody, adminGuard, adminJson, fail, invalid, invalidate, serverError,
} from "@/lib/cms/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const blocked = await adminGuard(req, { write: false, perm: "settings:manage" });
  if (blocked) return blocked;
  try {
    return adminJson({ item: await getSiteSettingsForAdmin() });
  } catch (err) {
    return serverError("get site settings", err);
  }
}

async function save(req: Request, partial: boolean) {
  const blocked = await adminGuard(req, { write: true, perm: "settings:manage" });
  if (blocked) return blocked;
  const body = await adminBody(req, 16 * 1024);
  if (!body.ok) return fail(body.error, body.status);
  try {
    const parsed = parseSiteSettings(body.value, partial ? await getSiteSettingsForAdmin() : undefined);
    if (!parsed.ok) return invalid(parsed);
    const item = await saveSiteSettings(parsed.value);
    invalidate(CMS_TAGS.siteSettings);
    return adminJson({ item });
  } catch (err) {
    return serverError("save site settings", err);
  }
}

export const PUT = (req: Request) => save(req, false);
export const PATCH = (req: Request) => save(req, true);
