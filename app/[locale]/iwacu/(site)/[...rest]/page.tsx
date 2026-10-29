import { notFound } from "next/navigation";

// Unknown pages like /en/iwacu/xyz show the Iwacu 404 (../not-found.tsx) with its header and footer.
export default function CatchAllPage() {
  notFound();
}
