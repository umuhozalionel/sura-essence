/**
 * The trip builder's rules: the price, the day plan and the server's check of a request.
 * Run with `npm test`. Everything uses the default rates, so a change to DEFAULT_TRIP_RATES
 * or DEFAULT_PRICING shows up here.
 */
import { describe, expect, it } from "vitest";
import { DEFAULT_PRICING, quote, trips } from "./pricing";
import {
  DEFAULT_TRIP_RATES, TRIP_LEAD_HOURS, activeActivities, activityBlock, activityRwf, carPrice, pickupTimes, vehiclesFor, dayPlan, earliestTripDate, noGuests, quoteTrip, readTripSelection,
  lunchBudgets, startsInTime, staysOvernight, tripKm, usdInRwf,
  type TripActivity, type TripGuests, type TripSelection,
} from "./trips";

const rates = DEFAULT_TRIP_RATES;
const usd = (n: number) => usdInRwf(n, rates, DEFAULT_PRICING);

/** 6 November 2026, 18:44 in Kigali. */
const NOW = new Date("2026-11-06T16:44:00Z");

const guests = (patch: Partial<TripGuests>): TripGuests => ({ ...noGuests(), ...patch });
const twoInternational = guests({ international: { adults: 2, children: 0 } });

const selection = (patch: Partial<TripSelection> = {}): TripSelection => ({
  tripId: "akagera",
  pkg: "basic",
  vehicle: "comfort",
  guests: twoInternational,
  date: "2026-11-10",
  pickupTime: "05:00",
  pickupPlace: "Kigali Marriott Hotel",
  pickupCoords: null,
  lunch: "buffet",
  lunchBudget: 0,
  breakfast: false,
  dinner: false,
  guide: true,
  activities: [],
  extraStops: "",
  stay: false,
  ...patch,
});

/* ─── quoteTrip ──────────────────────────────────────────────────────── */

describe("quoteTrip", () => {
  it("prices nothing until someone is coming", () => {
    const q = quoteTrip(selection({ guests: guests({ infants: 2 }) }), rates);
    expect(q.total).toBe(0);
    expect(q.hasQuotedItems).toBe(false);
  });

  it("adds up a Basic trip in a Comfort SUV", () => {
    const q = quoteTrip(selection(), rates);
    expect(q.car).toBe(carPrice("comfort", rates));
    expect(q.entry).toBe(2 * usd(100));
    expect(q.guide).toBe(usd(rates.guideUsd));
    expect(q.vehicleFee).toBe(usd(rates.vehicleFeeUsd));
    expect(q.snacks).toBe(2 * rates.snacksPerGuest);
    expect(q.lunch).toBe(2 * rates.lunchBuffet);
    expect(q.total).toBe(q.car + q.entry + q.lunch + q.guide + q.vehicleFee + q.snacks);
    expect(q.perGuest).toBe(Math.round(q.total / 2));
    expect(q.fits).toBe(true);
    expect(q.overnight).toBe(false);
    expect(q.hasQuotedItems).toBe(false);
  });

  it("charges the Comfort SUV's outside-Kigali fee only once", () => {
    // Lionel, 4 Nov 2026: the Movana 50,000 outside-Kigali charge and the driver's fee are the same money.
    expect(carPrice("comfort", rates)).toBe(319_700);
  });

  it("lets the safari car's driver be the guide, with no snacks charged, but keeps the car's park entry", () => {
    const q = quoteTrip(selection({ pkg: "standard", vehicle: "safari", lunch: "chosen", lunchBudget: 20_000, guide: false }), rates);
    expect(q.car).toBe(usd(rates.safariCarUsd));
    expect(q.guide).toBe(0);
    expect(q.snacks).toBe(0);
    expect(q.vehicleFee).toBe(usd(rates.vehicleFeeUsd));
  });

  it("keeps the safari car at one $400 price, whatever the group size", () => {
    const one = guests({ international: { adults: 1, children: 0 } });
    const eight = guests({ international: { adults: 8, children: 0 } });
    const live = { ...rates, usdToRwf: 1480.41 };
    const safari = { pkg: "standard" as const, vehicle: "safari" as const, lunch: "chosen" as const, lunchBudget: 20_000 };
    expect(quoteTrip(selection({ ...safari, guests: one }), live).car).toBe(592_200);
    expect(quoteTrip(selection({ ...safari, guests: eight }), live).car).toBe(592_200);
  });

  it("prices an SUV's round trip once: 110 km there, 110 back and 100 in the park", () => {
    expect(tripKm(rates)).toBe(320);
    // The same car over the same km as a Movana trip, less its outside-Kigali charge: never twice the road.
    expect(carPrice("comfort", rates)).toBe(369_700 - 50_000);
  });

  it("charges lunch for paying guests only, not children aged 5 and under", () => {
    const g = guests({ citizen: { adults: 2, children: 1 }, infants: 1 });
    const q = quoteTrip(selection({ pkg: "standard", vehicle: "premium", lunch: "chosen", lunchBudget: 20_000, guests: g }), rates);
    expect(q.lunch).toBe(3 * 20_000);
    expect(q.entry).toBe(2 * 15_000 + 10_000);
  });

  it("says 'from' when lunch is removed from Standard, or a meal or stop is to be quoted", () => {
    const standard = { pkg: "standard" as const, vehicle: "premium" as const, lunchBudget: 20_000 };
    expect(quoteTrip(selection({ ...standard, lunch: "none" }), rates).hasQuotedItems).toBe(true);
    expect(quoteTrip(selection({ breakfast: true }), rates).hasQuotedItems).toBe(true);
    expect(quoteTrip(selection({ dinner: true }), rates).hasQuotedItems).toBe(true);
    expect(quoteTrip(selection({ extraStops: "Nyamata" }), rates).hasQuotedItems).toBe(true);
    expect(quoteTrip(selection({ ...standard, lunch: "chosen" }), rates).hasQuotedItems).toBe(false);
  });

  it("never charges the park's game drive fee: our own car drives it", () => {
    const q = quoteTrip(selection({ activities: ["gameDriveHalf"] }), rates);
    expect(q.activities).toBe(0);
    expect(q.activityFees).toEqual([{ id: "gameDriveHalf", rwf: 0 }]);
    expect(quoteTrip(selection({ activities: ["gameDriveFull"] }), rates).activities).toBe(0);
  });

  it("prices per-person activities by age, and lists each one", () => {
    const g = guests({ international: { adults: 2, children: 1 } });
    const q = quoteTrip(selection({ guests: g, activities: ["boatScheduled", "fishing"] }), rates);
    expect(q.activityFees).toEqual([
      { id: "boatScheduled", rwf: usd(2 * 35 + 20) },
      { id: "fishing", rwf: usd(2 * 25 + 15) },
    ]);
    expect(q.activities).toBe(usd(90) + usd(65));
  });

  it("uses the group price for behind the scenes from 8 guests", () => {
    const g = guests({ international: { adults: 8, children: 0 } });
    const q = quoteTrip(selection({ pkg: "standard", vehicle: "safari", lunch: "chosen", lunchBudget: 20_000, guests: g, activities: ["behindScenes"] }), rates);
    expect(q.activities).toBe(usd(180));
  });

  it("gives Rwandan citizens the national camping rate, and EAC guests the normal one", () => {
    const g = guests({ citizen: { adults: 1, children: 0 }, eac: { adults: 1, children: 0 } });
    const q = quoteTrip(selection({ guests: g, activities: ["camping"] }), rates);
    expect(q.activities).toBe(usd(15 + 25));
  });

  it("marks a night in the park as to be quoted, so the total is a starting price", () => {
    for (const a of ["camping", "campingMihindi", "nightDrive"] as TripActivity[]) {
      const q = quoteTrip(selection({ activities: [a] }), rates);
      expect(q.overnight, a).toBe(true);
      expect(q.hasQuotedItems, a).toBe(true);
    }
    expect(quoteTrip(selection({ activities: ["boatSunset"] }), rates).overnight).toBe(false);
  });

  it("knows when a group doesn't fit the car", () => {
    const g = guests({ international: { adults: 4, children: 0 }, infants: 1 });
    expect(quoteTrip(selection({ guests: g }), rates).fits).toBe(false);
    expect(quoteTrip(selection({ pkg: "standard", vehicle: "premium", lunch: "chosen", lunchBudget: 20_000, guests: g }), rates).fits).toBe(true);
  });
});

/* ─── dayPlan ────────────────────────────────────────────────────────── */

const at = (plan: ReturnType<typeof dayPlan>, id: string) => plan.find((s) => s.id === id);
const plan = (patch: Partial<TripSelection> = {}) => dayPlan(selection({ lunch: "none", ...patch }));

describe("dayPlan", () => {
  it("lays out a plain day from a 05:00 pickup, back in Kigali the same evening", () => {
    const p = plan();
    expect(p[0]).toEqual({ time: "05:00", id: "pickup" });
    expect(at(p, "arrival")?.time).toBe("07:30");
    expect(at(p, "gameDrive")?.time).toBe("08:00");
    expect(at(p, "leave")?.time).toBe("15:30");
    expect(at(p, "kigali")?.time).toBe("18:30");
    expect(p.some((s) => s.time === "day2")).toBe(false);
  });

  it("moves the whole day with the pickup time", () => {
    const p = plan({ pickupTime: "04:00" });
    expect(at(p, "arrival")?.time).toBe("06:30");
    expect(at(p, "kigali")?.time).toBe("17:30");
  });

  it("puts lunch in the plan when there is one, with game drives either side", () => {
    const p = plan({ pkg: "standard", vehicle: "premium", lunch: "chosen", lunchBudget: 20_000 });
    expect(at(p, "lunch")?.time).toBe("12:00");
    expect(at(p, "gameDrive")?.time).toBe("08:00");
    expect(at(p, "gameDrive2")?.time).toBe("13:00");
  });

  it("takes the first scheduled boat after reaching the park", () => {
    const boat = at(plan({ activities: ["boatScheduled"] }), "boatScheduled");
    expect(boat).toMatchObject({ time: "09:00", until: "10:00", activity: true });
  });

  it("gives the full-day drive the whole park day", () => {
    const p = plan({ activities: ["gameDriveFull"] });
    expect(at(p, "gameDriveFull")).toMatchObject({ time: "08:00", until: "15:30" });
    expect(at(p, "gameDrive")).toBeUndefined();
  });

  it("ends the day when a half-day drive is done, so nobody waits around", () => {
    const p = plan({ activities: ["gameDriveHalf"] });
    expect(at(p, "gameDriveHalf")).toMatchObject({ time: "08:00", until: "13:00" });
    expect(at(p, "leave")?.time).toBe("13:00");
  });

  it("goes home after a sunset boat", () => {
    const p = plan({ activities: ["boatSunset"] });
    expect(at(p, "boatSunset")).toMatchObject({ time: "16:30", until: "18:00" });
    expect(at(p, "leave")?.time).toBe("18:00");
    expect(at(p, "kigali")?.time).toBe("21:00");
  });

  it("stays the night after a night drive, and drives back the next day", () => {
    const p = plan({ activities: ["nightDrive"] });
    expect(at(p, "nightDrive")).toMatchObject({ time: "17:30", until: "20:30" });
    expect(at(p, "stay")?.time).toBe("20:30");
    expect(p.slice(-2)).toEqual([{ time: "day2", id: "leave" }, { time: "day2", id: "kigali" }]);
  });

  it("ends the first day at the campsite when camping", () => {
    const p = plan({ activities: ["camping"], dinner: true });
    expect(at(p, "camping")?.time).toBe("15:30");
    expect(at(p, "dinner")?.time).toBe("19:00");
    expect(p.filter((s) => s.id === "leave")).toEqual([{ time: "day2", id: "leave" }]);
  });

  it("lists what has no set hour as arranged with the park", () => {
    const p = plan({ activities: ["filming"] });
    expect(p[p.length - 1]).toEqual({ time: "", id: "filming", activity: true });
  });
});

/* ─── readTripSelection ──────────────────────────────────────────────── */

const read = (patch: Record<string, unknown> = {}, now = NOW) => readTripSelection({ ...selection(), ...patch }, rates, now);

describe("readTripSelection", () => {
  it("accepts a good request", () => {
    expect(read()).toMatchObject({ tripId: "akagera", pkg: "basic", vehicle: "comfort", date: "2026-11-10", pickupPlace: "Kigali Marriott Hotel" });
  });

  it("refuses another trip, an unknown package or car, and a car from another package", () => {
    expect(read({ tripId: "nyungwe" })).toBeNull();
    expect(read({ pkg: "premium" })).toBeNull();
    expect(read({ vehicle: "sedan" })).toBeNull();
    expect(read({ vehicle: "safari" })).toBeNull();
  });

  it("refuses a lunch the package doesn't offer", () => {
    // Basic's buffet is a must; Standard has no 15,000 buffet, only its budgets or no lunch.
    expect(read({ lunch: "none" })).toBeNull();
    expect(read({ lunch: "chosen", lunchBudget: 20_000 })).toBeNull();
    expect(read({ pkg: "standard", vehicle: "premium", lunch: "buffet" })).toBeNull();
    expect(read({ pkg: "standard", vehicle: "premium", lunch: "none" })?.lunchBudget).toBe(0);
  });

  it("takes only Standard lunch budgets from 20,000 to 50,000, in steps of 5,000", () => {
    const std = { pkg: "standard", vehicle: "premium", lunch: "chosen" };
    expect(lunchBudgets(rates)).toEqual([20_000, 25_000, 30_000, 35_000, 40_000, 45_000, 50_000]);
    expect(read({ ...std, lunchBudget: 35_000 })?.lunchBudget).toBe(35_000);
    expect(read({ ...std, lunchBudget: 50_000 })).not.toBeNull();
    for (const bad of [15_000, 22_000, 55_000, "20000", undefined]) expect(read({ ...std, lunchBudget: bad }), String(bad)).toBeNull();
    const q = quoteTrip(selection({ ...std, lunchBudget: 35_000, pkg: "standard", vehicle: "premium", lunch: "chosen" }), rates);
    expect(q.lunch).toBe(2 * 35_000);
  });

  it("refuses no paying guests, or more than the car takes", () => {
    expect(read({ guests: guests({ infants: 1 }) })).toBeNull();
    expect(read({ guests: guests({ international: { adults: 4, children: 0 }, infants: 1 }) })).toBeNull();
  });

  it("refuses a pickup time we don't offer", () => {
    expect(read({ pickupTime: "07:00" })).toBeNull();
    expect(read({ pickupTime: "04:15" })).toBeNull();
  });

  it("refuses a past date, today, and anything under the lead time", () => {
    expect(TRIP_LEAD_HOURS).toBe(24);
    expect(read({ date: "2026-11-01" })).toBeNull();
    expect(read({ date: "2026-11-06" })).toBeNull();
    // Tomorrow at 05:00 is only about 10 hours away.
    expect(read({ date: "2026-11-07" })).toBeNull();
    expect(read({ date: "2026-11-08" })).not.toBeNull();
  });

  it("counts the lead time to the pickup itself, in Kigali time", () => {
    // 04:30 on 8 Nov in Kigali is 02:30 UTC: 24 hours later than 02:30 UTC on the 7th.
    expect(read({ date: "2026-11-08", pickupTime: "04:30" }, new Date("2026-11-07T02:30:00Z"))).not.toBeNull();
    expect(read({ date: "2026-11-08", pickupTime: "04:30" }, new Date("2026-11-07T02:31:00Z"))).toBeNull();
  });

  it("refuses dates that aren't real or are more than a year ahead", () => {
    expect(read({ date: "2027-02-30" })).toBeNull();
    expect(read({ date: "10/11/2026" })).toBeNull();
    expect(read({ date: "" })).toBeNull();
    expect(read({ date: "2027-11-06" })).not.toBeNull();
    expect(read({ date: "2027-11-08" })).toBeNull();
  });

  it("refuses an empty or too short pickup place", () => {
    expect(read({ pickupPlace: "" })).toBeNull();
    expect(read({ pickupPlace: "   " })).toBeNull();
    expect(read({ pickupPlace: "ab" })).toBeNull();
    expect(read({ pickupPlace: "  Kimihurura  " })?.pickupPlace).toBe("Kimihurura");
  });

  it("keeps only activities that can happen together, for enough guests", () => {
    expect(read({ activities: ["gameDriveFull", "gameDriveHalf", "unknown"] })?.activities).toEqual(["gameDriveHalf"]);
    expect(read({ activities: ["tentHire"] })?.activities).toEqual([]);
    expect(read({ activities: ["tentHire", "camping"] })?.activities).toEqual(["camping", "tentHire"]);
    const one = guests({ international: { adults: 1, children: 0 } });
    expect(read({ guests: one, activities: ["nightDrive"] })?.activities).toEqual([]);
  });

  it("sets the guide from the car, whatever the browser says", () => {
    expect(read({ guide: false })?.guide).toBe(true);
    expect(read({ pkg: "standard", vehicle: "safari", lunch: "chosen", lunchBudget: 20_000, guide: true })?.guide).toBe(false);
  });

  it("keeps map coordinates only when they are real", () => {
    expect(read({ pickupCoords: [-1.95, 30.06] })?.pickupCoords).toEqual([-1.95, 30.06]);
    expect(read({ pickupCoords: [200, 30] })?.pickupCoords).toBeNull();
  });
});

/* ─── a night's stay ─────────────────────────────────────────────────── */

describe("a night's stay", () => {
  const four = guests({ international: { adults: 4, children: 0 } });
  const standard = { pkg: "standard", vehicle: "premium", lunch: "chosen", lunchBudget: 20_000, guests: four };

  it("is a one-day round trip unless the group stays the night", () => {
    const q = quoteTrip(selection(), rates);
    expect(q.overnight).toBe(false);
    expect(at(plan(), "kigali")?.time).not.toBe("day2");
  });

  it("makes accommodation a quoted night: 'from', a stay in the plan, back the next day", () => {
    const q = quoteTrip(selection({ stay: true }), rates);
    expect(q.overnight).toBe(true);
    expect(q.hasQuotedItems).toBe(true);
    expect(q.total).toBe(quoteTrip(selection(), rates).total);
    const p = plan({ stay: true });
    expect(at(p, "stay")?.time).toBe("15:30");
    expect(p.slice(-2)).toEqual([{ time: "day2", id: "leave" }, { time: "day2", id: "kigali" }]);
  });

  it("opens the night drive only with accommodation or camping", () => {
    expect(read({ ...standard, activities: ["nightDrive"] })?.activities).toEqual([]);
    expect(read({ ...standard, stay: true, activities: ["nightDrive"] })?.activities).toEqual(["nightDrive"]);
    expect(read({ ...standard, activities: ["nightDrive", "camping"] })?.activities).toEqual(["nightDrive", "camping"]);
  });

  it("keeps camping and accommodation apart: camping is the night's stay", () => {
    expect(read({ ...standard, stay: true, activities: ["camping", "tentHire"] })?.activities).toEqual([]);
    expect(read({ ...standard, stay: true, activities: ["campingMihindi"] })?.activities).toEqual([]);
    expect(read({ ...standard, stay: "yes" })?.stay).toBe(false);
  });
});

/* ─── dates and shared rules ─────────────────────────────────────────── */

describe("trip dates", () => {
  it("offers the first date whose latest pickup is far enough ahead", () => {
    expect(earliestTripDate(rates, NOW)).toBe("2026-11-08");
    // Just after midnight in Kigali, the next morning is still too soon.
    expect(earliestTripDate(rates, new Date("2026-11-06T22:30:00Z"))).toBe("2026-11-08");
    // Before 05:00 in Kigali, tomorrow's 05:00 is more than 24 hours away.
    expect(earliestTripDate(rates, new Date("2026-11-06T02:00:00Z"))).toBe("2026-11-07");
  });

  it("checks real dates and times only", () => {
    expect(startsInTime("2026-11-10", "5:00", NOW)).toBe(false);
    expect(startsInTime("2026-13-01", "05:00", NOW)).toBe(false);
  });
});

describe("shared rules", () => {
  it("treats camping and the night drive as overnight, in the price and the plan alike", () => {
    expect(staysOvernight(["camping"])).toBe(true);
    expect(staysOvernight(["nightDrive", "boatSunset"])).toBe(true);
    expect(staysOvernight(["boatSunset", "gameDriveHalf"])).toBe(false);
  });

  it("drops the later of two activities that can't go together", () => {
    expect(activeActivities(["boatPrivate", "boatScheduled"], twoInternational)).toEqual(["boatPrivate"]);
    expect(activeActivities(["boatScheduled", "gameDriveFull"], twoInternational)).toEqual(["boatScheduled"]);
  });
});

/* ─── Nyungwe ────────────────────────────────────────────────────────── */

describe("Nyungwe", () => {
  const ny = (patch: Partial<TripSelection> = {}) =>
    selection({ tripId: "nyungwe", pkg: "basic", vehicle: "comfort", pickupTime: "04:00", lunch: "buffet", guide: false, ...patch });
  const four = guests({ international: { adults: 4, children: 0 } });

  it("offers every car class, by package", () => {
    expect(vehiclesFor("basic", "nyungwe")).toEqual(["comfort", "sedan"]);
    expect(vehiclesFor("standard", "nyungwe")).toEqual(["premium", "luxury", "minibus"]);
    expect(vehiclesFor("standard", "akagera")).toEqual(["safari", "premium", "luxury"]);
  });

  it("prices the car once over 225 km each way plus driving at the park, with no guide or car entry", () => {
    expect(tripKm(rates, "nyungwe")).toBe(510);
    const q = quoteTrip(ny(), rates);
    expect(q.car).toBe(carPrice("comfort", rates, DEFAULT_PRICING, "nyungwe"));
    expect(q.car).toBeGreaterThan(carPrice("comfort", rates));
    expect(q.guide).toBe(0);
    expect(q.vehicleFee).toBe(0);
    expect(q.snacks).toBe(2 * rates.snacksPerGuest);
    expect(q.entry).toBe(2 * usd(100));
    expect(q.lunch).toBe(2 * 10_000);
    expect(q.total).toBe(q.car + q.entry + q.lunch + q.snacks);
  });

  it("charges Nyungwe's own entry by group", () => {
    const g = guests({ citizen: { adults: 1, children: 1 }, foreignResident: { adults: 1, children: 0 }, panAfrican: { adults: 1, children: 0 } });
    expect(quoteTrip(ny({ guests: g, vehicle: "comfort" }), rates).entry).toBe(10_000 + 5_000 + 2 * usd(60));
  });

  it("prices activities in the park's three bands", () => {
    const g = guests({ citizen: { adults: 1, children: 0 }, foreignResident: { adults: 1, children: 0 }, international: { adults: 2, children: 0 } });
    expect(activityRwf("zipline", g, rates)).toBe(20_000 + usd(80 + 2 * 100));
    expect(activityRwf("canopyWalk", g, rates)).toBe(5_000 + usd(20 + 2 * 40));
  });

  it("makes one guest pay for two on the canopy walk", () => {
    const one = guests({ international: { adults: 1, children: 0 } });
    expect(activityRwf("canopyWalk", one, rates)).toBe(2 * usd(40));
  });

  it("keeps chimpanzees to ages 15 and over, and habituation to 4 guests", () => {
    const family = guests({ international: { adults: 2, children: 1 } });
    expect(activityBlock("chimpTracking", family)).toEqual({ kind: "age" });
    expect(activityBlock("chimpTracking", four)).toBeNull();
    const five = guests({ international: { adults: 5, children: 0 } });
    expect(activityBlock("chimpHabituation", five)).toEqual({ kind: "max", count: 4 });
  });

  it("opens chimpanzees and the night walk only with a night's stay", () => {
    const base = { tripId: "nyungwe", pkg: "basic", vehicle: "comfort", pickupTime: "04:00", lunch: "buffet", guests: four };
    expect(read({ ...base, activities: ["chimpTracking", "nightWalk"] })?.activities).toEqual([]);
    expect(read({ ...base, stay: true, activities: ["chimpTracking", "nightWalk"] })?.activities).toEqual(["chimpTracking", "nightWalk"]);
    expect(quoteTrip(ny({ guests: four, stay: true, activities: ["chimpTracking"] }), rates).hasQuotedItems).toBe(true);
  });

  it("chooses a zipline package or its parts, never both", () => {
    expect(activeActivities(["ziplineCanopy", "zipline", "canopyWalk", "ropeCourse"], four)).toEqual(["ziplineCanopy", "ropeCourse"]);
    expect(activeActivities(["ziplineRopeCanopy", "ropeCourse"], four)).toEqual(["ziplineRopeCanopy"]);
  });

  it("checks a Nyungwe request against Nyungwe's rules", () => {
    const base = { tripId: "nyungwe", pkg: "basic", vehicle: "sedan", pickupTime: "04:00", lunch: "buffet" };
    expect(read(base)).toMatchObject({ tripId: "nyungwe", vehicle: "sedan", guide: false });
    expect(read({ ...base, vehicle: "safari" })).toBeNull();
    expect(read({ ...base, pickupTime: "05:00" })).toBeNull();
    expect(read({ ...base, activities: ["gameDriveHalf", "trails"] })?.activities).toEqual(["trails"]);
    expect(read({ ...base, pkg: "standard", vehicle: "minibus", lunch: "chosen", lunchBudget: 10_000 })?.lunchBudget).toBe(10_000);
    expect(lunchBudgets(rates, "nyungwe")[0]).toBe(10_000);
    expect(pickupTimes(rates, "nyungwe")).toEqual(["03:30", "04:00", "04:30"]);
  });

  it("plans a long day: 5 hours each way, activities from 09:30, home about 20:00", () => {
    const p = dayPlan(ny({ activities: ["canopyWalk", "trails"] }));
    expect(p[0]).toEqual({ time: "04:00", id: "pickup" });
    expect(at(p, "arrival")?.time).toBe("09:00");
    expect(at(p, "canopyWalk")).toMatchObject({ time: "09:30", until: "11:30" });
    expect(at(p, "lunch")?.time).toBe("12:30");
    expect(at(p, "trails")).toMatchObject({ time: "13:30", until: "15:00" });
    expect(at(p, "leave")?.time).toBe("15:00");
    expect(at(p, "kigali")?.time).toBe("20:00");
  });

  it("puts chimpanzee tracking on the second morning", () => {
    const p = dayPlan(ny({ guests: four, stay: true, activities: ["chimpTracking"] }));
    expect(p.slice(-3)).toEqual([{ time: "day2", id: "chimpTracking", activity: true }, { time: "day2", id: "leave" }, { time: "day2", id: "kigali" }]);
  });
});

describe("Movana round trips", () => {
  it("charge the outside-Kigali fee once: not on a round trip with a driver", () => {
    const round = quote(trips.destination("akagera", { returnTrip: true })!, "suv");
    const oneWay = quote(trips.destination("akagera")!, "suv");
    expect(round.breakdown.locationSurcharge).toBe(0);
    expect(oneWay.breakdown.locationSurcharge).toBe(50_000);
    const selfDrive = quote(trips.destination("akagera", { returnTrip: true, withDriver: false })!, "suv");
    expect(selfDrive.breakdown.locationSurcharge).toBe(50_000);
  });
});
