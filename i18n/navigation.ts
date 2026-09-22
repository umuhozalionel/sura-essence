import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

// Use these instead of `next/link` and `next/navigation` so links keep the current language.
// e.g. <Link href="/contact"> renders /fr/contact for French visitors.
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
