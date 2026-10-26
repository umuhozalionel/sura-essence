/**
 * Testimonials database helper — setup and moderation from your terminal.
 *
 *   npm run db:setup                          one-time: collections, schema checks, indexes
 *                                             (testimonials, the admin portal's bookings and
 *                                             board members, and the CMS collections: experiences,
 *                                             pricing_config, pricing_changes, site_content, tour_collections, tour_venues,
 *                                             site_settings, trip_alerts and admin_users; adds the founders the first time)
 *   npm run testimonials -- pending           what's waiting for review (photos saved to .testimonials-review/)
 *   npm run testimonials -- approve <id> …    publish
 *   npm run testimonials -- decline <id> …    delete for good (pending or live)
 *   npm run testimonials -- live              what's on the site now
 *   npm run testimonials -- unpublish <id> …  take a live one down (back to pending)
 *
 * Reads MONGODB_URI (and optional MONGODB_DB) from .env.local.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { MongoClient, ObjectId } from "mongodb";

const REVIEW_DIR = ".testimonials-review";

// Second line of defence behind lib/testimonials-server.ts: MongoDB itself
// refuses any document that doesn't have this shape.
const SCHEMA = {
  $jsonSchema: {
    bsonType: "object",
    required: ["name", "profession", "comment", "locale", "status", "consent", "photo", "createdAt"],
    additionalProperties: false,
    properties: {
      _id: { bsonType: "objectId" },
      name: { bsonType: "string", minLength: 1, maxLength: 60 },
      profession: { bsonType: "string", minLength: 1, maxLength: 80 },
      comment: { bsonType: "string", minLength: 1, maxLength: 600 },
      locale: { enum: ["en", "fr"] },
      status: { enum: ["pending", "approved"] },
      consent: { enum: [true] },
      createdAt: { bsonType: "date" },
      approvedAt: { bsonType: "date" },
      photo: {
        oneOf: [
          { bsonType: "null" },
          {
            bsonType: "object",
            required: ["mime", "base64", "bytes"],
            additionalProperties: false,
            properties: {
              mime: { enum: ["image/webp", "image/jpeg"] },
              base64: { bsonType: "string", minLength: 4, maxLength: 204800 }, // 150 KB once decoded
              bytes: { bsonType: ["int", "long", "double"], minimum: 1, maximum: 153600 },
            },
          },
        ],
      },
    },
  },
};

// An admin account as stored on the changes it made: { id, name }. id is the
// account id, or "env" for the first-run ADMIN_PASSWORD sign-in.
const ADMIN_ACTOR = {
  bsonType: "object",
  required: ["id", "name"],
  additionalProperties: false,
  properties: { id: { bsonType: "string", maxLength: 24 }, name: { bsonType: "string", maxLength: 80 } },
};

// Admin accounts (lib/admin-users.ts). Created with `npm run admin:create`.
const ADMIN_USERS_SCHEMA = {
  $jsonSchema: {
    bsonType: "object",
    required: ["email", "name", "role", "passwordHash", "status", "sessionVersion", "createdAt", "updatedAt"],
    additionalProperties: false,
    properties: {
      _id: { bsonType: "objectId" },
      email: { bsonType: "string", minLength: 3, maxLength: 254 },
      name: { bsonType: "string", minLength: 1, maxLength: 80 },
      role: { enum: ["main_admin", "managing_director", "assistant_manager"] },
      passwordHash: { bsonType: "string", pattern: "^scrypt\\$" },
      status: { enum: ["active", "disabled"] },
      sessionVersion: { bsonType: ["int", "long", "double"], minimum: 0 },
      createdAt: { bsonType: "date" },
      updatedAt: { bsonType: "date" },
      lastLoginAt: { bsonType: "date" },
      // Settings → My profile (lib/admin-users.ts ProfileDoc). Optional, and so is every field in it.
      profile: {
        bsonType: "object",
        additionalProperties: false,
        properties: {
          title: { bsonType: "string", maxLength: 80 },
          bio: { bsonType: "string", maxLength: 1000 },
          phone: { bsonType: "string", maxLength: 30 },
          avatar: {
            bsonType: "object",
            required: ["publicId", "version", "width", "height", "format"],
            additionalProperties: false,
            properties: {
              publicId: { bsonType: "string", maxLength: 120 },
              version: { bsonType: ["int", "long", "double"], minimum: 0 },
              width: { bsonType: ["int", "long", "double"], minimum: 0 },
              height: { bsonType: ["int", "long", "double"], minimum: 0 },
              format: { enum: ["jpg", "jpeg", "png", "webp"] },
            },
          },
          cv: {
            bsonType: "object",
            required: ["publicId", "version", "format", "bytes", "uploadedAt"],
            additionalProperties: false,
            properties: {
              publicId: { bsonType: "string", maxLength: 120 },
              version: { bsonType: ["int", "long", "double"], minimum: 0 },
              format: { enum: ["pdf"] },
              bytes: { bsonType: ["int", "long", "double"], minimum: 1, maximum: 10485760 },
              uploadedAt: { bsonType: "date" },
            },
          },
          updatedAt: { bsonType: "date" },
        },
      },
    },
  },
};

// Same idea for the bookings admins log in /admin/bookings (lib/admin-bookings.ts).
const BOOKING_SCHEMA = {
  $jsonSchema: {
    bsonType: "object",
    required: [
      "clientName", "clientPhone", "tripType", "vehicleId", "withDriver", "pickup", "destination",
      "startDate", "endDate", "time", "passengers", "grandTotal", "status", "notes", "source", "createdAt", "updatedAt",
    ],
    additionalProperties: false,
    properties: {
      _id: { bsonType: "objectId" },
      clientName: { bsonType: "string", minLength: 1, maxLength: 80 },
      clientPhone: { bsonType: "string", maxLength: 30 },
      tripType: { enum: ["airport", "cab", "private", "hourly", "long"] },
      vehicleId: { bsonType: "string", minLength: 1, maxLength: 40 },
      withDriver: { bsonType: "bool" },
      pickup: { bsonType: "string", maxLength: 120 },
      destination: { bsonType: "string", maxLength: 120 },
      startDate: { bsonType: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$" },
      endDate: { oneOf: [{ bsonType: "null" }, { bsonType: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$" }] },
      time: { bsonType: "string", pattern: "^(|([01]\\d|2[0-3]):[0-5]\\d)$" },
      passengers: { bsonType: ["int", "long", "double"], minimum: 1, maximum: 60 },
      grandTotal: { bsonType: ["int", "long", "double"], minimum: 0, maximum: 100000000 },
      status: { enum: ["pending", "confirmed", "completed", "cancelled"] },
      notes: { bsonType: "string", maxLength: 1000 },
      source: { enum: ["whatsapp"] },
      // Website bookings: the live pricing revision that priced them (lib/public-bookings.ts).
      pricingRevision: { bsonType: ["int", "long", "double"], minimum: 0 },
      // Who logged it and who changed it last (lib/admin-bookings.ts).
      createdBy: ADMIN_ACTOR,
      updatedBy: ADMIN_ACTOR,
      createdAt: { bsonType: "date" },
      updatedAt: { bsonType: "date" },
    },
  },
};

// Board members managed in /admin/team (lib/board-members-server.ts).
const localizedText = (max) => ({
  bsonType: "object",
  required: ["en", "fr"],
  additionalProperties: false,
  properties: { en: { bsonType: "string", maxLength: max }, fr: { bsonType: "string", maxLength: max } },
});
const paragraphList = {
  bsonType: "array",
  maxItems: 12,
  items: { bsonType: "string", minLength: 1, maxLength: 2000 },
};
const BOARD_SCHEMA = {
  $jsonSchema: {
    bsonType: "object",
    required: ["name", "role", "tagline", "bio", "email", "socials", "imageUrl", "photo", "order", "visible", "createdAt", "updatedAt"],
    additionalProperties: false,
    properties: {
      _id: { bsonType: "objectId" },
      name: { bsonType: "string", minLength: 1, maxLength: 80 },
      role: localizedText(60),
      tagline: localizedText(140),
      bio: {
        bsonType: "object",
        required: ["en", "fr"],
        additionalProperties: false,
        properties: { en: paragraphList, fr: paragraphList },
      },
      email: { bsonType: "string", maxLength: 120 },
      socials: {
        bsonType: "array",
        maxItems: 6,
        items: {
          bsonType: "object",
          required: ["platform", "url"],
          additionalProperties: false,
          properties: {
            platform: { enum: ["linkedin", "instagram", "facebook", "twitter", "website"] },
            url: { bsonType: "string", pattern: "^https://", maxLength: 300 },
          },
        },
      },
      imageUrl: { bsonType: "string", maxLength: 500 },
      photo: {
        oneOf: [
          { bsonType: "null" },
          {
            bsonType: "object",
            required: ["mime", "base64", "bytes"],
            additionalProperties: false,
            properties: {
              mime: { enum: ["image/webp", "image/jpeg"] },
              base64: { bsonType: "string", minLength: 4, maxLength: 1228800 }, // 900 KB once decoded
              bytes: { bsonType: ["int", "long", "double"], minimum: 1, maximum: 921600 },
            },
          },
        ],
      },
      order: { bsonType: ["int", "long", "double"], minimum: 0 },
      visible: { bsonType: "bool" },
      seedKey: { bsonType: "string" },
      createdAt: { bsonType: "date" },
      updatedAt: { bsonType: "date" },
    },
  },
};

/* ─── CMS collections (lib/cms/*-server.ts) ──────────────────────────────
 * Each schema mirrors the parser in the matching lib/cms/*-server.ts file:
 * change a field there, change it here too. The parsers are the first line
 * of defence; these stop anything else (a script, a typo in a shell) from
 * writing a document the website can't read.
 */
const str = (max, min = 0) => ({ bsonType: "string", minLength: min, maxLength: max });
const num = (min, max) => ({ bsonType: ["int", "long", "double"], minimum: min, maximum: max });
const nullable = (schema) => ({ oneOf: [{ bsonType: "null" }, schema] });
const isoDate = { bsonType: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$" };
const isoMonth = { bsonType: "string", pattern: "^\\d{4}-\\d{2}$" };
const slug = { bsonType: "string", pattern: "^[a-z0-9]+(-[a-z0-9]+)*$", maxLength: 80 };
const key = { bsonType: "string", pattern: "^[A-Za-z0-9]+([-_][A-Za-z0-9]+)*$", maxLength: 40 };
// A /public path or empty (optional media).
const media = { bsonType: "string", pattern: "^(|/[^/].*)$", maxLength: 300 };
const mediaRequired = { bsonType: "string", pattern: "^/[^/].*$", maxLength: 300 };
const httpsUrl = { bsonType: "string", pattern: "^https://", maxLength: 500 };
const localizedList = (items, max) => ({
  bsonType: "object",
  required: ["en", "fr"],
  additionalProperties: false,
  properties: {
    en: { bsonType: "array", maxItems: items, items: str(max, 1) },
    fr: { bsonType: "array", maxItems: items, items: str(max, 1) },
  },
});
const obj = (properties, extra = {}) => ({
  bsonType: "object",
  required: Object.keys(properties),
  additionalProperties: false,
  properties,
  ...extra,
});
const arrayOf = (maxItems, items) => ({ bsonType: "array", maxItems, items });
const stamps = { createdAt: { bsonType: "date" }, updatedAt: { bsonType: "date" } };
const doc = (properties) => ({ $jsonSchema: obj({ ...properties, ...stamps }, { properties: { _id: { bsonType: "objectId" }, ...properties, ...stamps } }) });
const withId = (schema, idSchema) => {
  schema.$jsonSchema.properties._id = idSchema;
  return schema;
};

const EXPERIENCE_SCHEMA = doc({
  slug,
  status: { enum: ["draft", "published", "archived"] },
  availability: { enum: ["open", "limited", "soldOut", "closed", "notifyMe"] },
  featured: { bsonType: "bool" },
  category: key,
  schedule: obj({
    startDate: nullable(isoDate),
    endDate: nullable(isoDate),
    precision: { enum: ["day", "month", "tba"] },
    month: nullable(isoMonth),
    bookingDeadline: nullable(isoDate),
    departure: localizedText(300),
  }),
  title: localizedText(140),
  shortTitle: localizedText(60),
  subtitle: localizedText(200),
  description: localizedText(4000),
  location: obj({
    name: localizedText(120),
    region: localizedText(120),
    country: str(60),
    destinationId: nullable(key),
  }),
  duration: localizedText(80),
  media: obj({
    cover: mediaRequired,
    flyer: media,
    hero: media,
    gallery: arrayOf(60, obj({
      src: mediaRequired,
      type: { enum: ["image", "video"] },
      caption: localizedText(160),
      inPreview: { bsonType: "bool" },
    })),
  }),
  pricing: obj({
    tiers: arrayOf(8, obj({
      id: key,
      label: localizedText(80),
      note: localizedText(300),
      amount: num(0, 100000000),
      currency: { enum: ["RWF", "USD"] },
      highlight: { bsonType: "bool" },
    })),
  }),
  packages: arrayOf(6, obj({
    id: key,
    title: localizedText(120),
    ribbon: localizedText(40),
    featured: { bsonType: "bool" },
    tierId: key,
    includes: arrayOf(20, obj({ text: localizedText(300), muted: { bsonType: "bool" } })),
    cta: localizedText(60),
  })),
  details: arrayOf(16, obj({ id: key, icon: str(40), label: localizedText(80), value: localizedText(300) })),
  itinerary: arrayOf(12, obj({ id: key, tone: str(20), title: localizedText(120), items: localizedList(20, 300) })),
  highlights: arrayOf(16, obj({ id: key, icon: str(40), text: localizedText(300) })),
  capacity: obj({ seats: nullable(num(0, 10000)), attendees: nullable(num(0, 10000)) }),
  booking: obj({ mode: { enum: ["whatsapp", "form", "closed"] }, whatsappText: localizedText(500), itinerary: media }),
  hero: obj({ promote: { bsonType: "bool" }, until: nullable(isoDate) }),
});

// Keep in step with VEHICLES, CabBand, BodyType and Zone in lib/pricing.ts (phase one: these 8 classes only).
const PRICING_VEHICLES = ["sedan", "suv", "premium_suv", "luxury_suv", "van", "bus", "electric_sedan", "electric_suv"];
const rwfAmount = num(0, 100000000);
const fromKeys = (keys, schema) => obj(Object.fromEntries(keys.map((k) => [k, schema])));
// pricing_config holds one document, _id "live", edited one field at a time (lib/cms/pricing-config-server.ts).
const PRICING_SCHEMA = {
  $jsonSchema: obj(
    {
      _id: { enum: ["live"] },
      revision: num(1, 1000000000),
      config: obj({
        fuelPricePerLitre: fromKeys(["petrol", "diesel"], rwfAmount),
        kmPerLitre: fromKeys(["sedan", "suv", "van", "bus"], num(0.1, 1000)),
        profitMargin: num(0, 1),
        serviceFeePerDay: fromKeys(["kigali", "outside"], rwfAmount),
        vehicleRecoveryFee: rwfAmount,
        roundTotalTo: num(1, 10000),
        hourly: obj({
          hoursInRateDay: num(1, 24),
          minBilledHours: num(1, 24),
          maxHoursPerDay: num(1, 24),
          kmPerHour: num(0.1, 1000),
        }),
        cabFares: fromKeys(["standard", "executive", "premium"], obj({ base: rwfAmount, includedKm: num(0, 100), perKm: rwfAmount })),
        vehicleRates: fromKeys(PRICING_VEHICLES, obj({ basePrice: rwfAmount, airportRate: rwfAmount, outsideSurcharge: rwfAmount })),
      }),
      ...stamps,
    },
  ),
};

// One row per saved pricing field: what changed, from what, to what (undo and audits).
const PRICING_CHANGES_SCHEMA = {
  $jsonSchema: obj({
    _id: { bsonType: "objectId" },
    path: { bsonType: "string", pattern: "^[A-Za-z_.]+$", maxLength: 80 },
    before: num(0, 100000000),
    after: num(0, 100000000),
    revision: num(1, 1000000000),
    at: { bsonType: "date" },
    undoOf: nullable({ bsonType: "objectId" }),
  }),
};
// Who saved it. Optional: rows from before admin accounts don't have it.
PRICING_CHANGES_SCHEMA.$jsonSchema.properties.by = ADMIN_ACTOR;

// Editable text blocks, one document per section (lib/cms/site-content.ts).
const SITE_CONTENT_SCHEMA = {
  $jsonSchema: obj({
    _id: { enum: ["fleet", "pricing"] },
    blocks: arrayOf(100, obj({ key: { bsonType: "string", pattern: "^[A-Za-z0-9.]+$", maxLength: 80 }, text: localizedText(1200) })),
    ...stamps,
  }),
};

const TOUR_COLLECTION_SCHEMA = doc({
  slug,
  status: { enum: ["draft", "published"] },
  order: num(0, 10000),
  category: localizedText(80),
  intro: obj({ image: mediaRequired, title: localizedText(120), headline: localizedText(160), desc: localizedList(8, 400) }),
});

const TOUR_VENUE_SCHEMA = doc({
  slug,
  collectionId: { bsonType: "objectId" },
  status: { enum: ["draft", "published"] },
  order: num(0, 10000),
  image: mediaRequired,
  gallery: arrayOf(24, mediaRequired),
  price: nullable(num(0, 100000000)),
  currency: { enum: ["USD", "RWF"] },
  priceType: { enum: ["paid", "free", "donation"] },
  memorial: { bsonType: "bool" },
  title: localizedText(120),
  location: localizedText(120),
  tag: localizedText(40),
  summary: localizedText(400),
  history: localizedList(8, 1500),
  visitorNote: localizedText(400),
  highlights: localizedList(16, 160),
  facts: obj({
    duration: localizedText(80),
    groupSize: localizedText(80),
    minAge: localizedText(80),
    bestTime: localizedText(80),
    driveTime: localizedText(80),
    outdoor: { bsonType: "bool" },
  }),
});

const SITE_SETTINGS_SCHEMA = withId(
  doc({
    contact: obj({ phone: str(24, 1), whatsapp: { bsonType: "string", pattern: "^[0-9]{8,15}$" }, email: str(120, 3) }),
    socials: arrayOf(6, obj({ platform: { enum: ["instagram", "facebook", "linkedin", "twitter", "tiktok", "youtube"] }, url: httpsUrl })),
  }),
  { enum: ["site"] }, // a single document
);

const TRIP_ALERT_SCHEMA = doc({
  slug,
  status: { enum: ["draft", "published", "archived"] },
  date: isoDate,
  urgent: { bsonType: "bool" },
  title: localizedText(160),
  content: localizedText(6000),
  sources: arrayOf(8, obj({ label: localizedText(160), url: httpsUrl })),
});

/** The founders from messages/*.json — the same seed lib/board-members-server.ts uses. */
function boardSeed() {
  const read = (l) => JSON.parse(readFileSync(join(process.cwd(), "messages", `${l}.json`), "utf8")).Founder.founders;
  const en = read("en");
  const fr = read("fr");
  const now = new Date();
  return en.map((f, i) => {
    const frf = fr.find((x) => x.id === f.id) ?? {};
    return {
      name: f.name,
      role: { en: f.role, fr: frf.role ?? "" },
      tagline: { en: f.tagline, fr: frf.tagline ?? "" },
      bio: { en: f.bio, fr: frf.bio ?? [] },
      email: f.email,
      socials: [],
      imageUrl: f.photo,
      photo: null,
      order: i,
      visible: true,
      seedKey: f.id,
      createdAt: now,
      updatedAt: now,
    };
  });
}

const COMMANDS = ["setup", "pending", "live", "approve", "decline", "unpublish"];
const [command, ...args] = process.argv.slice(2);
if (!COMMANDS.includes(command)) {
  console.log("Usage: npm run testimonials -- pending | live | approve <id> | decline <id> | unpublish <id>");
  console.log("       npm run db:setup");
  process.exit(command ? 1 : 0);
}

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("MONGODB_URI is missing — add it to .env.local first.");
  process.exit(1);
}

// Check ids before connecting, so a typo fails instantly.
const targetIds = ["approve", "decline", "unpublish"].includes(command) ? ids() : [];

const client = new MongoClient(uri, { serverSelectionTimeoutMS: 10000, appName: "sura-testimonials-cli" });

function ids() {
  const bad = args.filter((a) => !/^[a-f0-9]{24}$/i.test(a));
  if (!args.length || bad.length) {
    console.error(bad.length ? `Not a testimonial id: ${bad.join(", ")}` : "Give at least one id (from `pending` or `live`).");
    process.exit(1);
  }
  return args.map((a) => new ObjectId(a));
}

function show(d, withPhotoFile = false) {
  let photo = "no photo";
  if (d.photo) {
    photo = `${Math.round(d.photo.bytes / 1024)} KB ${d.photo.mime}`;
    if (withPhotoFile) {
      mkdirSync(REVIEW_DIR, { recursive: true });
      const file = join(REVIEW_DIR, `${d._id}.${d.photo.mime === "image/webp" ? "webp" : "jpg"}`);
      writeFileSync(file, Buffer.from(d.photo.base64, "base64"));
      photo = `open ${file}`;
    }
  }
  const when = d.createdAt.toISOString().slice(0, 16).replace("T", " ");
  console.log(`\n${d._id}   ${when} UTC   [${d.locale}]`);
  console.log(`  ${d.name} — ${d.profession}`);
  console.log(`  “${d.comment.replace(/\n+/g, " ")}”`);
  console.log(`  photo: ${photo}`);
}

try {
  await client.connect();
  const db = client.db(process.env.MONGODB_DB || "sura");
  const testimonials = db.collection("testimonials");
  const log = db.collection("testimonial_submissions");

  switch (command) {
    case "setup": {
      const schemas = [
        ["testimonials", SCHEMA], ["bookings", BOOKING_SCHEMA], ["board_members", BOARD_SCHEMA],
        ["experiences", EXPERIENCE_SCHEMA], ["pricing_config", PRICING_SCHEMA], ["pricing_changes", PRICING_CHANGES_SCHEMA],
        ["site_content", SITE_CONTENT_SCHEMA],
        ["tour_collections", TOUR_COLLECTION_SCHEMA], ["tour_venues", TOUR_VENUE_SCHEMA],
        ["site_settings", SITE_SETTINGS_SCHEMA], ["trip_alerts", TRIP_ALERT_SCHEMA],
        ["admin_users", ADMIN_USERS_SCHEMA],
      ];
      for (const [name, validator] of schemas) {
        const exists = (await db.listCollections({ name }).toArray()).length > 0;
        if (exists) {
          try {
            await db.command({ collMod: name, validator, validationLevel: "strict", validationAction: "error" });
            console.log(`✓ schema check updated on '${name}'`);
          } catch (err) {
            console.warn(`! Couldn't update the schema check on '${name}' (${err.codeName ?? err.message}).`);
            console.warn("  Your database user needs the dbAdmin role for that. The website works without it.");
          }
        } else {
          await db.createCollection(name, { validator, validationLevel: "strict", validationAction: "error" });
          console.log(`✓ created '${name}' with a schema check`);
        }
      }
      await testimonials.createIndex({ status: 1, createdAt: -1 });
      await log.createIndex({ ipHash: 1, at: -1 });
      await log.createIndex({ at: 1 }, { expireAfterSeconds: 24 * 60 * 60 });
      const bookings = db.collection("bookings");
      await bookings.createIndex({ startDate: -1 });
      await bookings.createIndex({ status: 1, startDate: 1 });
      const board = db.collection("board_members");
      await board.createIndex({ visible: 1, order: 1 });
      await db.collection("admin_users").createIndexes([{ key: { email: 1 }, unique: true }, { key: { role: 1, status: 1 } }]);
      // CMS collections: the same indexes the website creates on first use (lib/cms/*-server.ts).
      await db.collection("experiences").createIndexes([
        { key: { slug: 1 }, unique: true }, { key: { status: 1, "schedule.startDate": 1 } }, { key: { featured: 1 } },
      ]);
      await db.collection("pricing_changes").createIndexes([{ key: { at: -1 } }, { key: { path: 1, at: -1 } }]);
      await db.collection("tour_collections").createIndexes([{ key: { slug: 1 }, unique: true }, { key: { status: 1, order: 1 } }]);
      await db.collection("tour_venues").createIndexes([
        { key: { slug: 1 }, unique: true }, { key: { collectionId: 1, status: 1, order: 1 } },
      ]);
      await db.collection("trip_alerts").createIndexes([{ key: { slug: 1 }, unique: true }, { key: { status: 1, urgent: -1, date: -1 } }]);
      console.log("✓ indexes ready");

      // Copy the founders in once. The marker stops them coming back after an admin deletes them.
      const meta = db.collection("app_meta");
      if (!(await meta.findOne({ _id: "board_members_seeded" }))) {
        if ((await board.countDocuments()) === 0) {
          await board.insertMany(boardSeed());
          console.log("✓ added the founders to 'board_members'");
        }
        await meta.insertOne({ _id: "board_members_seeded", at: new Date() });
      }
      break;
    }

    case "pending": {
      const docs = await testimonials.find({ status: "pending" }).sort({ createdAt: 1 }).toArray();
      if (!docs.length) console.log("Nothing waiting for review.");
      docs.forEach((d) => show(d, true));
      if (docs.length) {
        console.log(`\n${docs.length} waiting.  Publish: npm run testimonials -- approve <id>   Delete: npm run testimonials -- decline <id>`);
      }
      break;
    }

    case "live": {
      const docs = await testimonials.find({ status: "approved" }, { projection: { "photo.base64": 0 } })
        .sort({ createdAt: -1 }).toArray();
      if (!docs.length) console.log("Nothing published yet.");
      docs.forEach((d) => show(d));
      break;
    }

    case "approve": {
      const r = await testimonials.updateMany(
        { _id: { $in: targetIds }, status: "pending" },
        { $set: { status: "approved", approvedAt: new Date() } },
      );
      console.log(`✓ published ${r.modifiedCount} — visitors see it within about a minute.`);
      break;
    }

    case "unpublish": {
      const r = await testimonials.updateMany(
        { _id: { $in: targetIds }, status: "approved" },
        { $set: { status: "pending" }, $unset: { approvedAt: "" } },
      );
      console.log(`✓ took down ${r.modifiedCount}.`);
      break;
    }

    case "decline": {
      const r = await testimonials.deleteMany({ _id: { $in: targetIds } });
      console.log(`✓ deleted ${r.deletedCount} (text and photo).`);
      break;
    }

  }
} catch (err) {
  console.error(`✗ ${err.message}`);
  if (/querySrv|ENOTFOUND|ECONNREFUSED|Server selection timed out|timed out/i.test(err.message)) {
    console.error("  Check MONGODB_URI, and that your IP address is allowed under Atlas → Network Access.");
  } else if (/auth/i.test(err.message)) {
    console.error("  The username or password in MONGODB_URI was refused (special characters must be URL-encoded).");
  }
  process.exitCode = 1;
} finally {
  await client.close();
}
