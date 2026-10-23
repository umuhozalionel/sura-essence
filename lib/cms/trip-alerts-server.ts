/**
 * Server side of trip alerts. Collection: trip_alerts.
 * Public reads are cached under CMS_TAGS.tripAlerts and cleared by every admin write.
 */
import { ObjectId } from "mongodb";
import { CMS_TAGS, cachedRead, collection, toObjectId } from "./server";
import { Reader, obj, type Parsed } from "./parse";
import type { CmsLocale } from "./localized";
import {
  ALERT_LIMITS, ALERT_STATUSES, localizeTripAlert,
  type AdminTripAlert, type AlertStatus, type PublicTripAlert, type TripAlertInput,
} from "./trip-alerts";

export type TripAlertDoc = TripAlertInput & { _id: ObjectId; createdAt: Date; updatedAt: Date };

const alerts = () =>
  collection<TripAlertDoc>("trip_alerts", [
    { key: { slug: 1 }, unique: true },
    { key: { status: 1, urgent: -1, date: -1 } },
  ]);

function toAdmin(d: TripAlertDoc): AdminTripAlert {
  const { _id, createdAt, updatedAt, ...rest } = d;
  return { ...rest, id: _id.toHexString(), createdAt: createdAt.getTime(), updatedAt: updatedAt.getTime() };
}

/* ─── public (cached) ────────────────────────────────────────────────── */

const loadPublished = cachedRead("trip-alerts:published", CMS_TAGS.tripAlerts, async (): Promise<AdminTripAlert[]> => {
  const docs = await (await alerts()).find({ status: "published" }).sort({ urgent: -1, date: -1 }).toArray();
  return docs.map(toAdmin);
});

/** Published alerts, urgent ones first, then newest first. */
export async function listPublicTripAlerts(locale: CmsLocale): Promise<PublicTripAlert[]> {
  return (await loadPublished()).map((a) => localizeTripAlert(a, locale));
}

/* ─── checking what the admin form sends ────────────────────────────── */

export function parseTripAlert(body: unknown): Parsed<TripAlertInput> {
  const r = new Reader();
  const b = obj(body);
  const sources = r.list(b.sources, "sources", ALERT_LIMITS.sources, (s, f) => ({
    label: r.localized(s.label, `${f}.label`, { max: 160, required: true }),
    url: r.url(s.url, `${f}.url`, { required: true }),
  }));
  return r.result<TripAlertInput>({
    slug: r.slug(b.slug, "slug"),
    status: r.oneOf(b.status, "status", ALERT_STATUSES, "draft"),
    date: r.date(b.date, "date", { required: true }) ?? "",
    urgent: r.bool(b.urgent),
    title: r.localized(b.title, "title", { max: ALERT_LIMITS.title, required: true }),
    content: r.localized(b.content, "content", { max: ALERT_LIMITS.content, required: true, multiline: true }),
    sources,
  });
}

export type TripAlertPatch = Partial<{ status: AlertStatus; urgent: boolean }>;

export function parseTripAlertPatch(body: unknown): Parsed<TripAlertPatch> {
  const r = new Reader();
  const b = obj(body);
  const patch: TripAlertPatch = {};
  if ("status" in b) patch.status = r.oneOf(b.status, "status", ALERT_STATUSES);
  if ("urgent" in b) patch.urgent = r.bool(b.urgent);
  if (!Object.keys(patch).length) r.fail("body", "empty");
  return r.result(patch);
}

/* ─── admin ──────────────────────────────────────────────────────────── */

export async function listTripAlertsForAdmin(): Promise<AdminTripAlert[]> {
  return (await (await alerts()).find({}).sort({ date: -1, createdAt: -1 }).toArray()).map(toAdmin);
}

export async function getTripAlertForAdmin(id: string): Promise<AdminTripAlert | null> {
  const _id = toObjectId(id);
  if (!_id) return null;
  const doc = await (await alerts()).findOne({ _id });
  return doc ? toAdmin(doc) : null;
}

/** Throws a duplicate-key error (code 11000) when the slug is taken. */
export async function createTripAlert(value: TripAlertInput): Promise<AdminTripAlert> {
  const now = new Date();
  const doc: TripAlertDoc = { _id: new ObjectId(), ...value, createdAt: now, updatedAt: now };
  await (await alerts()).insertOne(doc);
  return toAdmin(doc);
}

export async function updateTripAlert(id: string, value: TripAlertInput | TripAlertPatch): Promise<AdminTripAlert | null> {
  const _id = toObjectId(id);
  if (!_id) return null;
  const updated = await (await alerts()).findOneAndUpdate(
    { _id },
    { $set: { ...value, updatedAt: new Date() } },
    { returnDocument: "after" },
  );
  return updated ? toAdmin(updated) : null;
}

export async function deleteTripAlert(id: string): Promise<boolean> {
  const _id = toObjectId(id);
  if (!_id) return false;
  return (await (await alerts()).deleteOne({ _id })).deletedCount === 1;
}
