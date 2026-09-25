/**
 * Testimonials database helper — setup and moderation from your terminal.
 *
 *   npm run db:setup                          one-time: collections, schema checks, indexes
 *                                             (testimonials + the admin portal's bookings)
 *   npm run testimonials -- pending           what's waiting for review (photos saved to .testimonials-review/)
 *   npm run testimonials -- approve <id> …    publish
 *   npm run testimonials -- decline <id> …    delete for good (pending or live)
 *   npm run testimonials -- live              what's on the site now
 *   npm run testimonials -- unpublish <id> …  take a live one down (back to pending)
 *
 * Reads MONGODB_URI (and optional MONGODB_DB) from .env.local.
 */
import { mkdirSync, writeFileSync } from "node:fs";
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
      createdAt: { bsonType: "date" },
      updatedAt: { bsonType: "date" },
    },
  },
};

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
      for (const [name, validator] of [["testimonials", SCHEMA], ["bookings", BOOKING_SCHEMA]]) {
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
      console.log("✓ indexes ready");
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
