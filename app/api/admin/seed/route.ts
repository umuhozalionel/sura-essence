/**
 * POST /api/admin/seed  { targets?: ["siteSettings", "pricingConfig", "experiences", "tours"] }
 *   → one-off seeding. Each seeder only inserts when nothing is there yet, so
 *     running it twice changes nothing and never overwrites an admin's edits.
 *       siteSettings   the official contact details (+250 788 564 000, hello@sura.rw)
 *       pricingConfig  the live pricing document (from DEFAULT_PRICING), if missing
 *       experiences    every trip, season and gallery from messages/*.json (lib/cms/legacy.ts)
 *       tours          the tour collections and venues from messages/*.json
 * (Experiences and tours also seed themselves the first time their admin screen opens.)
 * Admin only. Clears the matching caches when something was inserted.
 */
import { seedPricingConfig } from "@/lib/cms/pricing-config-server";
import { seedExperiencesOnce } from "@/lib/cms/experiences-server";
import { seedToursOnce } from "@/lib/cms/tours-server";
import { seedSiteSettings } from "@/lib/cms/site-settings-server";
import { CMS_TAGS, adminBody, adminGuard, adminJson, fail, invalidate, serverError } from "@/lib/cms/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TARGETS = ["siteSettings", "pricingConfig", "experiences", "tours"] as const;
type Target = (typeof TARGETS)[number];

export async function POST(req: Request) {
  const blocked = await adminGuard(req, { write: true });
  if (blocked) return blocked;
  const body = await adminBody(req, 1024);
  if (!body.ok) return fail(body.error, body.status);

  const asked = (body.value as { targets?: unknown } | null)?.targets;
  const targets: Target[] = asked === undefined ? [...TARGETS] : Array.isArray(asked) ? (asked as Target[]) : [];
  if (!targets.length || targets.some((t) => !TARGETS.includes(t))) return fail("invalid_targets", 400, { allowed: TARGETS });

  try {
    const result: Partial<Record<Target, unknown>> = {};
    if (targets.includes("siteSettings")) {
      const r = await seedSiteSettings();
      if (r.inserted) invalidate(CMS_TAGS.siteSettings);
      result.siteSettings = r;
    }
    if (targets.includes("pricingConfig")) {
      const r = await seedPricingConfig();
      if (r.inserted) invalidate(CMS_TAGS.pricing);
      result.pricingConfig = r;
    }
    if (targets.includes("experiences")) result.experiences = { inserted: await seedExperiencesOnce() };
    if (targets.includes("tours")) result.tours = { inserted: await seedToursOnce() };
    return adminJson({ result });
  } catch (err) {
    return serverError("seed", err);
  }
}
