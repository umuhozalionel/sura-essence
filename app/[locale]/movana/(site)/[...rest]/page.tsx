import { notFound } from "next/navigation";

// Unknown pages like /en/movana/xyz show the Movana 404 (../not-found.tsx) with its header and footer.
export default function CatchAllPage() {
  notFound();
}
