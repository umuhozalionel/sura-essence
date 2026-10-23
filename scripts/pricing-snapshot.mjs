/**
 * Pricing snapshot — proves a change to lib/pricing.ts moves no price.
 *
 *   node scripts/pricing-snapshot.mjs            compare against the saved snapshot (exit 1 on any difference)
 *   node scripts/pricing-snapshot.mjs --write    save the snapshot (refuses to overwrite without --force)
 *
 * lib/pricing.ts has no imports, so it is transpiled in memory with the
 * TypeScript compiler already in devDependencies and loaded from a data: URL.
 * Every quote is recorded in full (total and breakdown) and compared exactly.
 *
 * Once lib/pricing.ts exports DEFAULT_PRICING, it also checks that the config
 * really flows through the formulas (identity, sensitivity, immutability).
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { isDeepStrictEqual } from "node:util";
import ts from "typescript";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const SNAPSHOT = join(root, "scripts", "__snapshots__", "pricing.json");
const args = new Set(process.argv.slice(2));

/* ─── load lib/pricing.ts ────────────────────────────────────────────── */

const source = readFileSync(join(root, "lib", "pricing.ts"), "utf8");
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 },
});
const P = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`);

/* ─── the grid ───────────────────────────────────────────────────────── */

const ids = P.VEHICLES.map((v) => v.id);
const bools = [false, true];

function cases(cfg) {
  const q = (trip, v) => (cfg ? P.quote(trip, v, cfg) : P.quote(trip, v));
  const out = [];
  const add = (input, fn) => out.push({ input, output: fn() });

  for (const v of ids) {
    for (const returnTrip of bools) add({ fn: "quote", trip: "airport", v, returnTrip }, () => q(P.trips.airport({ returnTrip }), v));

    for (const mode of ["cab", "private"])
      for (const km of [0, 1, 2, 2.5, 5, 10, 17.3, 40])
        for (const returnTrip of bools)
          add({ fn: "quote", trip: "cityRide", v, mode, km, returnTrip }, () => q(P.trips.cityRide(mode, km, { returnTrip }), v));

    for (const hours of [NaN, 0, 1, 2.5, 3, 4, 5, 6, 7.9, 8, 10, 12, 13])
      for (const withDriver of bools)
        add({ fn: "quote", trip: "hourly", v, hours, withDriver }, () => q(P.trips.hourly(hours, { withDriver }), v));

    for (const d of P.DESTINATIONS)
      for (const withDriver of bools)
        for (const returnTrip of bools)
          for (const days of [1, 2, 3, 4.5])
            add({ fn: "quote", trip: "destination", v, d: d.id, withDriver, returnTrip, days }, () =>
              q(P.trips.destination(d.id, { withDriver, returnTrip, days }), v));

    for (const zone of ["kigali", "outside"])
      for (const distanceKm of [0, 37, 110, 333])
        for (const oneWay of bools)
          for (const withDriver of bools)
            for (const days of [1, 2])
              add({ fn: "quote", trip: "long", v, zone, distanceKm, oneWay, withDriver, days }, () =>
                q({ kind: "long", zone, distanceKm, days, oneWay, withDriver }, v));

    add({ fn: "fuelPriceFor", v }, () => (cfg ? P.fuelPriceFor(P.getVehicle(v, cfg), cfg) : P.fuelPriceFor(P.getVehicle(v))));
    for (const d of ["kigali", "akagera", "nowhere"])
      add({ fn: "destinationPrice", v, d }, () => (cfg ? P.destinationPrice(d, v, {}, cfg) : P.destinationPrice(d, v)));
  }

  for (const card of ["airport", "hourly", "transfers", "tours", "unknown"])
    add({ fn: "landingCardPrice", card }, () => (cfg ? P.landingCardPrice(card, cfg) : P.landingCardPrice(card)));
  for (const h of [NaN, 0, 2.2, 3, 7, 8, 11.5, 12, 20]) {
    add({ fn: "billedHours", h }, () => (cfg ? P.billedHours(h, cfg) : P.billedHours(h)));
    add({ fn: "dayFraction", h }, () => (cfg ? P.dayFraction(h, cfg) : P.dayFraction(h)));
  }
  add({ fn: "getVehicle", v: "unknown" }, () => (cfg ? P.getVehicle("unknown", cfg) : P.getVehicle("unknown")));
  add({ fn: "serviceDays" }, () => [
    P.serviceDays(), P.serviceDays("2026-10-01", "2026-10-04", true), P.serviceDays("2026-10-01", "2026-10-04", false),
    P.serviceDays("2026-10-04", "2026-10-01", true),
  ]);
  add({ fn: "roadDistanceKm" }, () => [
    P.roadDistanceKm([-1.9441, 30.0619], [-1.4990, 29.6340]),
    P.routeDistanceKm([[-1.9441, 30.0619], [-1.9, 30.5], [-1.8833, 30.7167]]),
  ]);
  return out;
}

/** Every exported value that isn't a function, so an alias that drifts is caught too. */
function constants() {
  return Object.fromEntries(
    Object.entries(P).filter(([k, v]) => typeof v !== "function" && k !== "DEFAULT_PRICING" && k !== "trips").sort(([a], [b]) => a.localeCompare(b)),
  );
}

// JSON can't hold NaN or ±Infinity: write them as tagged strings so they compare exactly.
const encode = (value) =>
  JSON.parse(JSON.stringify(value, (_k, v) => (typeof v === "number" && !Number.isFinite(v) ? `__num:${v}` : v)));

/* ─── run ────────────────────────────────────────────────────────────── */

const current = encode({ constants: constants(), cases: cases(null) });
let failed = false;

if (args.has("--write")) {
  if (existsSync(SNAPSHOT) && !args.has("--force")) {
    console.error(`Refusing to overwrite ${SNAPSHOT} (pass --force).`);
    process.exit(1);
  }
  mkdirSync(dirname(SNAPSHOT), { recursive: true });
  writeFileSync(SNAPSHOT, `${JSON.stringify(current, null, 1)}\n`);
  console.log(`Saved ${current.cases.length} cases and ${Object.keys(current.constants).length} constants to ${SNAPSHOT}.`);
  process.exit(0);
}

if (!existsSync(SNAPSHOT)) {
  console.error("No snapshot yet. Run with --write on the code you trust first.");
  process.exit(1);
}
const saved = JSON.parse(readFileSync(SNAPSHOT, "utf8"));

// 1. Snapshot: every case and constant exactly as before.
const diffs = [];
if (saved.cases.length !== current.cases.length) diffs.push(`case count ${saved.cases.length} → ${current.cases.length}`);
for (let i = 0; i < Math.min(saved.cases.length, current.cases.length); i++) {
  const a = saved.cases[i], b = current.cases[i];
  if (!isDeepStrictEqual(a, b)) diffs.push(`${JSON.stringify(a.input)}\n    before ${JSON.stringify(a.output)}\n    after  ${JSON.stringify(b.output)}`);
}
for (const k of new Set([...Object.keys(saved.constants), ...Object.keys(current.constants)])) {
  if (!isDeepStrictEqual(saved.constants[k], current.constants[k])) {
    diffs.push(`constant ${k}\n    before ${JSON.stringify(saved.constants[k])}\n    after  ${JSON.stringify(current.constants[k])}`);
  }
}
if (diffs.length) {
  failed = true;
  console.error(`✗ Snapshot: ${diffs.length} difference(s). First ${Math.min(20, diffs.length)}:`);
  for (const d of diffs.slice(0, 20)) console.error(`  - ${d}`);
} else {
  console.log(`✓ Snapshot: ${current.cases.length} cases and ${Object.keys(current.constants).length} constants identical.`);
}

// 2. Wiring: only once the config exists.
if (!P.DEFAULT_PRICING) {
  console.log("· Wiring checks skipped: lib/pricing.ts doesn't export DEFAULT_PRICING yet.");
} else {
  const check = (name, ok) => {
    if (!ok) failed = true;
    console[ok ? "log" : "error"](`${ok ? "✓" : "✗"} ${name}`);
  };
  const D = P.DEFAULT_PRICING;
  const clone = () => structuredClone(D);
  const byKey = (list) => new Map(list.map((c) => [JSON.stringify(c.input), c.output]));
  const base = byKey(cases(null));

  // Identity: passing the default explicitly gives the same answers as passing nothing.
  check("Identity: explicit DEFAULT_PRICING matches the default for every case", isDeepStrictEqual(encode(cases(D)), current.cases));

  // Sensitivity: a change moves exactly the quotes it should, and no others.
  const vehicleOf = (id) => P.VEHICLES.find((v) => v.id === id);
  const fuelBearing = (o) => o && typeof o === "object" && o.breakdown && o.breakdown.fuelCost > 0;
  const sensitivity = (name, mutate, shouldChange) => {
    const cfg = clone();
    mutate(cfg);
    let wrong = 0, moved = 0;
    for (const { input, output } of cases(cfg)) {
      if (input.fn !== "quote") continue;
      const before = base.get(JSON.stringify(input));
      const changed = !isDeepStrictEqual(before, output);
      if (changed) moved++;
      if (changed !== shouldChange(input, before)) wrong++;
    }
    check(`Sensitivity: ${name} (${moved} quotes moved, ${wrong} unexpected)`, wrong === 0 && moved > 0);
  };
  sensitivity("petrol +100 RWF moves only petrol quotes that burn fuel", (c) => { c.fuelPricePerLitre.petrol += 100; },
    (i, before) => vehicleOf(i.v).fuel === "petrol" && fuelBearing(before));
  sensitivity("profit margin 0.3 → 0.31 moves only quotes with profit", (c) => { c.profitMargin = 0.31; },
    (_i, before) => before.breakdown.profit > 0);
  sensitivity("outside service fee +1,000 moves only outside trips with a driver", (c) => { c.serviceFeePerDay.outside += 1000; },
    (_i, before) => before.zone === "outside" && before.breakdown.serviceFee > 0);
  sensitivity("sedan base price +1,000 moves only sedan quotes with a car base", (c) => { c.vehicleRates.sedan.basePrice += 1000; },
    (i, before) => i.v === "sedan" && before.breakdown.carBase > 0);

  // Immutability: the shared default can't be changed by accident.
  let threw = false;
  try {
    D.vehicleRates.sedan.basePrice = 1;
  } catch {
    threw = true;
  }
  check("Immutability: DEFAULT_PRICING is deep-frozen", threw && Object.isFrozen(D) && Object.isFrozen(D.cabFares.standard));
}

process.exit(failed ? 1 : 0);
