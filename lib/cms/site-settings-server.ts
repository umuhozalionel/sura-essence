/**
 * Server side of site settings. Collection: site_settings, a single document `_id: "site"`.
 * Public reads are cached under CMS_TAGS.siteSettings and fall back to
 * DEFAULT_SITE_SETTINGS when the database is empty or unreachable.
 */
import { isMongoConfigured } from "@/lib/mongodb";
import { CMS_TAGS, cachedRead, collection } from "./server";
import { Reader, obj, type Parsed } from "./parse";
import { DEFAULT_SITE_SETTINGS, SETTINGS_SOCIALS, type AdminSiteSettings, type SiteSettings } from "./site-settings";

export type SiteSettingsDoc = SiteSettings & { _id: "site"; createdAt: Date; updatedAt: Date };

const SITE = "site" as const;
const settings = () => collection<SiteSettingsDoc>("site_settings");

const strip = (d: SiteSettingsDoc): SiteSettings => ({ contact: d.contact, socials: d.socials });

/* ─── public (cached) ────────────────────────────────────────────────── */

type PublicSettings = { settings: SiteSettings; source: "db" | "default" };

const loadSettings = cachedRead("site-settings", CMS_TAGS.siteSettings, async (): Promise<PublicSettings> => {
  const doc = await (await settings()).findOne({ _id: SITE });
  return doc ? { settings: strip(doc), source: "db" } : { settings: DEFAULT_SITE_SETTINGS, source: "default" };
});

/** Never throws: the built-in details stand in when MongoDB can't answer. */
export async function getSiteSettings(): Promise<PublicSettings> {
  if (!isMongoConfigured) return { settings: DEFAULT_SITE_SETTINGS, source: "default" };
  try {
    return await loadSettings();
  } catch (err) {
    console.error("[cms] site settings unavailable, using defaults:", err);
    return { settings: DEFAULT_SITE_SETTINGS, source: "default" };
  }
}

/* ─── checking what the admin form sends ────────────────────────────── */

const PHONE = /^\+?[0-9 ()-]{7,24}$/;
const DIGITS = /^[0-9]{8,15}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** A full settings form. With `base`, fields left out keep their current value (PATCH). */
export function parseSiteSettings(body: unknown, base?: SiteSettings): Parsed<SiteSettings> {
  const r = new Reader();
  const b = obj(body);
  const contactIn = { ...(base?.contact ?? {}), ...obj(b.contact) };

  const phone = r.text(contactIn.phone, "contact.phone", { max: 24, required: true });
  if (phone && !PHONE.test(phone)) r.fail("contact.phone", "phone");
  // WhatsApp defaults to the phone number's digits.
  const whatsapp = r.text(contactIn.whatsapp, "contact.whatsapp", { max: 15 }).replace(/\D/g, "") || phone.replace(/\D/g, "");
  if (!DIGITS.test(whatsapp)) r.fail("contact.whatsapp", "whatsapp");
  const email = r.text(contactIn.email, "contact.email", { max: 120, required: true }).toLowerCase();
  if (email && !EMAIL.test(email)) r.fail("contact.email", "email");

  const socials = "socials" in b || !base
    ? r.list(b.socials, "socials", SETTINGS_SOCIALS.length, (s, f) => ({
        platform: r.oneOf(s.platform, `${f}.platform`, SETTINGS_SOCIALS),
        url: r.url(s.url, `${f}.url`, { required: true }),
      }))
    : base.socials;
  r.unique(socials.map((s) => s.platform), "socials");

  return r.result<SiteSettings>({ contact: { phone, whatsapp, email }, socials });
}

/* ─── admin ──────────────────────────────────────────────────────────── */

export async function getSiteSettingsForAdmin(): Promise<AdminSiteSettings> {
  const doc = await (await settings()).findOne({ _id: SITE });
  return doc ? { ...strip(doc), updatedAt: doc.updatedAt.getTime() } : { ...DEFAULT_SITE_SETTINGS, updatedAt: null };
}

export async function saveSiteSettings(value: SiteSettings): Promise<AdminSiteSettings> {
  const now = new Date();
  const doc = await (await settings()).findOneAndUpdate(
    { _id: SITE },
    { $set: { ...value, updatedAt: now }, $setOnInsert: { createdAt: now } },
    { upsert: true, returnDocument: "after" },
  );
  return doc ? { ...strip(doc), updatedAt: doc.updatedAt.getTime() } : { ...value, updatedAt: now.getTime() };
}

/* ─── seed ───────────────────────────────────────────────────────────── */

/** Inserts the official contact details once. Never overwrites settings an admin has saved. */
export async function seedSiteSettings(): Promise<{ inserted: boolean }> {
  const now = new Date();
  const res = await (await settings()).updateOne(
    { _id: SITE },
    { $setOnInsert: { ...structuredClone(DEFAULT_SITE_SETTINGS), createdAt: now, updatedAt: now } },
    { upsert: true },
  );
  return { inserted: res.upsertedCount === 1 };
}
