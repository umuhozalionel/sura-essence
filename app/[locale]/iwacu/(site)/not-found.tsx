import { NotFoundContent } from "@/components/chrome/not-found-content";
import { getBrand } from "@/lib/brands";

// Unknown pages under /iwacu (and unknown experience slugs), inside the Iwacu header and footer.
export default function NotFoundPage() {
  return <NotFoundContent homeHref={getBrand("iwacu").homeHref} />;
}
