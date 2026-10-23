/**
 * GET /api/experiences/<slug>?locale=en|fr → one published experience (the detail page).
 * 404 for drafts, archived trips and unknown slugs.
 */
import type { NextRequest } from "next/server";
import { isMongoConfigured } from "@/lib/mongodb";
import { toLocale } from "@/lib/cms/localized";
import { getPublicExperience } from "@/lib/cms/experiences-server";
import { fail, publicJson, serverError } from "@/lib/cms/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  if (!isMongoConfigured) return fail("not_configured", 503);
  const { slug } = await params;
  try {
    const item = await getPublicExperience(slug, toLocale(req.nextUrl.searchParams.get("locale")));
    return item ? publicJson({ item }) : fail("not_found", 404);
  } catch (err) {
    return serverError("GET experience", err);
  }
}
