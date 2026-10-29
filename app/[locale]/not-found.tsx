import { NotFoundContent } from "@/components/chrome/not-found-content";

// 404 for pages inside /en or /fr that no brand folder catches (e.g. a missing
// admin record). Brand pages use the not-found.tsx in their own folder, which
// keeps their header and footer.
export default function NotFoundPage() {
  return <NotFoundContent />;
}
