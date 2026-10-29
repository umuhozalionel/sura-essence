import { NotFoundContent } from "@/components/chrome/not-found-content";
import { getBrand } from "@/lib/brands";

// Unknown pages under /movana, inside the Movana header and footer.
export default function NotFoundPage() {
  return <NotFoundContent homeHref={getBrand("movana").homeHref} />;
}
