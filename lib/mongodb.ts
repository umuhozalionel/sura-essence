/**
 * One shared MongoDB connection per server instance.
 *
 * SERVER ONLY. MONGODB_URI contains your database password — keep it in
 * .env.local / Vercel environment variables and never give it a NEXT_PUBLIC_
 * prefix. Only lib/testimonials-server.ts (used by the API routes) imports this.
 */
import { MongoClient, type Db } from "mongodb";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "sura";

export const isMongoConfigured = Boolean(uri);

// Kept on globalThis so hot reloads in `next dev` reuse the connection instead
// of opening a new one on every file save.
const cache = globalThis as unknown as { _suraMongo?: Promise<MongoClient>; _suraMongoDownAt?: number };

/**
 * After a failed connection, fail straight away for this long instead of waiting
 * for another timeout. Pages that fall back to messages/*.json (the CMS reads) then
 * render at once while the database is down, rather than waiting 8 s per read.
 */
const RETRY_AFTER_MS = 30_000;

export async function getDb(): Promise<Db> {
  if (!uri) throw new Error("MONGODB_URI is not set");
  if (!cache._suraMongo && cache._suraMongoDownAt && Date.now() - cache._suraMongoDownAt < RETRY_AFTER_MS) {
    throw new Error("MongoDB unreachable (retrying shortly)");
  }

  cache._suraMongo ??= new MongoClient(uri, {
    appName: "sura-essence-web",
    maxPoolSize: 5, // plenty for a serverless function; Atlas' free tier allows 500 connections
    serverSelectionTimeoutMS: 8000, // fail fast so the page can show its error message
  })
    .connect()
    .then((client) => {
      cache._suraMongoDownAt = undefined;
      return client;
    })
    .catch((err) => {
      cache._suraMongo = undefined; // let a later request try again
      cache._suraMongoDownAt = Date.now();
      throw err;
    });

  return (await cache._suraMongo).db(dbName);
}
