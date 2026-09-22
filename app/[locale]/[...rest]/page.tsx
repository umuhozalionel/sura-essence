import { notFound } from "next/navigation";

// Unknown pages like /fr/xyz show the 404 inside the site layout (right language, fonts, styles).
export default function CatchAllPage() {
  notFound();
}
