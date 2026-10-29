import { useFormatter, useTranslations } from "next-intl";
import { VEHICLES } from "@/lib/pricing";
import type { Booking } from "@/lib/types";
import { rwf } from "./format";

/**
 * Words for a booking: { trip: "Airport transfer", detail: "Premium SUV · Diesel · Self-drive" },
 * or for a booking without a car its own details ("Acme Ltd · 3 vehicles", "Akagera · Weekend · 4 guests").
 */
export function useTripLabel() {
  const t = useTranslations("Admin");
  const tv = useTranslations("BookingForm.vehicles");
  const format = useFormatter();
  const vehicleName = (id: string) => (VEHICLES.some((v) => v.id === id) ? tv(`${id}.name`) : id);
  /** "Petrol", "Diesel" or "Electric" for a vehicle class. */
  const fuelName = (id: string) => {
    const v = VEHICLES.find((x) => x.id === id);
    return v ? t(`fuel.${v.fuel}`) : "";
  };
  const label = (b: Pick<Booking, "service" | "tripType" | "vehicleId" | "withDriver" | "details">) => {
    const d = b.details;
    // The service names the booking; older bookings without one fall back on how they were priced.
    const trip = b.service ? t(`services.${b.service}`) : b.tripType ? t(`tripTypes.${b.tripType}`) : "—";
    if (!b.vehicleId) {
      return {
        trip,
        detail: [
          d.company,
          d.experienceTitle,
          d.packageTitle,
          d.vehicles && t("bookings.details.vehiclesCount", { count: d.vehicles }),
          d.trips && t("bookings.details.tripsCount", { count: d.trips }),
          d.guests && t("bookings.details.guestsCount", { count: d.guests }),
          d.budget && t(`bookings.budget.${d.budget}`),
        ].filter(Boolean).join(" · "),
      };
    }
    const fuel = VEHICLES.find((x) => x.id === b.vehicleId)?.fuel;
    return {
      trip,
      // Electric classes already say so in their name.
      detail: [vehicleName(b.vehicleId), fuel && fuel !== "electric" && fuelName(b.vehicleId), !b.withDriver && t("common.selfDrive")]
        .filter(Boolean)
        .join(" · "),
    };
  };
  /** "155,800 RWF", or "Quote on request" while the team hasn't priced it. */
  const total = (amount: number | null, compact = false) =>
    amount === null ? t("common.quoteOnRequest") : rwf(format, amount, compact);
  return Object.assign(label, { vehicleName, fuelName, total });
}
