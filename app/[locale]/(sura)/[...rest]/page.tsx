import { notFound } from "next/navigation";

// Unknown pages like /fr/xyz show the SURA Essence 404 (../not-found.tsx) with its header and footer.
export default function CatchAllPage() {
  notFound();
}
