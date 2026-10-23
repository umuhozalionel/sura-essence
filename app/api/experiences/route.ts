/**
 * GET /api/experiences?locale=en|fr&when=upcoming|past|all&category=<id>&gallery=1
 *   → published experiences in one language. "when" is worked out from the dates
 *     on every request (Kigali time); gallery=1 keeps only trips with photos.
 * Served from the "cms:experiences" cache, which every admin edit clears.
 */
import type { NextRequest } from "next/server";
import { isMongoConfigured } from "@/lib/mongodb";
import { toLocale } from "@/lib/cms/localized";
import { listPublicExperiences } from "@/lib/cms/experiences-server";
import { fail, publicJson, serverError } from "@/lib/cms/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!isMongoConfigured) return fail("not_configured", 503);
  const q = req.nextUrl.searchParams;
  const when = q.get("when");
  try {
    const items = await listPublicExperiences({
      locale: toLocale(q.get("locale")),
      when: when === "upcoming" || when === "past" ? when : "all",
      category: q.get("category") || null,
      gallery: q.get("gallery") === "1",
    });
    return publicJson({ items });
  } catch (err) {
    return serverError("GET experiences", err);
  }
}
