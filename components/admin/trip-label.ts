import { useTranslations } from "next-intl";
import { VEHICLES } from "@/lib/pricing";
import type { Booking } from "@/lib/types";

/** Words for a booking's trip: { trip: "Long trip", detail: "Executive (SUV) · Self-drive" }. */
export function useTripLabel() {
  const t = useTranslations("Admin");
  const tv = useTranslations("BookingForm.vehicles");
  const vehicleName = (id: string) => (VEHICLES.some((v) => v.id === id) ? tv(`${id}.name`) : id);
  const label = (b: Pick<Booking, "tripType" | "vehicleId" | "withDriver">) => ({
    trip: t(`tripTypes.${b.tripType}`),
    detail: [vehicleName(b.vehicleId), !b.withDriver && t("common.selfDrive")].filter(Boolean).join(" · "),
  });
  return Object.assign(label, { vehicleName });
}
