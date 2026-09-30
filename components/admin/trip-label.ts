import { useTranslations } from "next-intl";
import { VEHICLES } from "@/lib/pricing";
import type { Booking } from "@/lib/types";

/** Words for a booking's trip: { trip: "Long trip", detail: "Premium SUV · Diesel · Self-drive" }. */
export function useTripLabel() {
  const t = useTranslations("Admin");
  const tv = useTranslations("BookingForm.vehicles");
  const vehicleName = (id: string) => (VEHICLES.some((v) => v.id === id) ? tv(`${id}.name`) : id);
  /** "Petrol", "Diesel" or "Electric" for a vehicle class. */
  const fuelName = (id: string) => {
    const v = VEHICLES.find((x) => x.id === id);
    return v ? t(`fuel.${v.fuel}`) : "";
  };
  const label = (b: Pick<Booking, "tripType" | "vehicleId" | "withDriver">) => {
    const fuel = VEHICLES.find((x) => x.id === b.vehicleId)?.fuel;
    return {
      trip: t(`tripTypes.${b.tripType}`),
      // Electric classes already say so in their name.
      detail: [vehicleName(b.vehicleId), fuel && fuel !== "electric" && fuelName(b.vehicleId), !b.withDriver && t("common.selfDrive")]
        .filter(Boolean)
        .join(" · "),
    };
  };
  return Object.assign(label, { vehicleName, fuelName });
}
