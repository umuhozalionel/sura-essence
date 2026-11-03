/**
 * The three faces of the site: SURA Essence (the parent hub), SURA Movana
 * (rides and transfers) and SURA Iwacu (tours and experiences).
 *
 * Each brand's header and footer (components/chrome/) read everything from
 * here, so a brand is one config entry plus its words in messages/*.json.
 * Colours come from `data-brand="<id>"` in app/globals.css; SURA Essence has
 * no attribute rules, so it keeps today's palette.
 *
 * Safe to import anywhere (no server code).
 */
import { SURA_NAV } from "./sura-nav";
import { MOVANA_NAV } from "./movana-nav";
import { IWACU_NAV } from "./iwacu-nav";

export const BRAND_IDS = ["sura", "movana", "iwacu"] as const;
export type BrandId = (typeof BRAND_IDS)[number];

/** One entry in a mega menu. Words live at `<namespace>.menu.<id>.name` and `.desc`. */
export type NavMenuLink = { id: string; href: string };

/** A header item: a plain link or a mega menu. Its label lives at `<namespace>.nav.<id>`. */
export type NavItem =
  | { type: "link"; id: string; href: string }
  | { type: "mega"; id: string; links: NavMenuLink[] };

export type BrandLogo =
  | { type: "image"; src: string; alt: string }
  /** No logo file yet: the header draws the name as text. */
  | { type: "wordmark" };

export type BrandConfig = {
  id: BrandId;
  /** Proper names, the same in every language. */
  name: string;
  shortName: string;
  /** The brand's home page, before the locale prefix. */
  homeHref: string;
  logo: BrandLogo;
  /**
   * messages/*.json namespace for the header: `nav.<id>`, `menu.<id>.name|desc`
   * and `featured.title|subtitle`.
   */
  headerMessages: string;
  /** messages/*.json namespace for the footer: `description` and `columns` (same shape as Footer.columns). */
  footerMessages: string;
  nav: NavItem[];
  /** Where the alert bar and its "Details" link go. */
  alertsHref: string;
  /**
   * Tailwind classes for where the header swaps its menu button for the full text
   * menu. Written out in full so Tailwind finds them. SURA Essence has shorter labels,
   * so its menu fits from lg; the others from `nav` (app/globals.css).
   */
  fullNav: { flex: string; block: string; hidden: string };
  /** Pages whose top is light, so the header starts solid instead of transparent. */
  solidHeaderRoutes: string[];
  /** The other sub-brand, linked from the footer. null for the parent hub. */
  sibling: BrandId | null;
};

/** Who built the site, credited on the chooser and in every footer. */
export const BRAVONET_URL = "https://bravonet-technologies.com";

export const BRANDS: Record<BrandId, BrandConfig> = {
  sura: {
    id: "sura",
    name: "SURA Essence",
    shortName: "SURA Essence",
    homeHref: "/",
    logo: { type: "image", src: "/brand/sura-logo.png", alt: "SURA Essence" },
    headerMessages: "Header",
    footerMessages: "Footer",
    nav: SURA_NAV,
    // Trip alerts belong to Movana; the hub's alert bar leads there too.
    alertsHref: "/movana/trip-alerts",
    fullNav: { flex: "lg:flex", block: "lg:block", hidden: "lg:hidden" },
    solidHeaderRoutes: [],
    sibling: null,
  },
  movana: {
    id: "movana",
    name: "SURA Movana",
    shortName: "Movana",
    homeHref: "/movana",
    // PLACEHOLDER wordmark (Phase 3): swap in the real file under the same name.
    logo: { type: "image", src: "/brand/movana-logo.svg", alt: "SURA Movana" },
    headerMessages: "Brands.movana",
    footerMessages: "Brands.movana.footer",
    nav: MOVANA_NAV,
    alertsHref: "/movana/trip-alerts",
    fullNav: { flex: "nav:flex", block: "nav:block", hidden: "nav:hidden" },
    solidHeaderRoutes: ["/movana/fleet"],
    sibling: "iwacu",
  },
  iwacu: {
    id: "iwacu",
    name: "SURA Iwacu",
    shortName: "Iwacu",
    homeHref: "/iwacu",
    // PLACEHOLDER wordmark (Phase 3): swap in the real file under the same name.
    logo: { type: "image", src: "/brand/iwacu-logo.svg", alt: "SURA Iwacu" },
    headerMessages: "Brands.iwacu",
    footerMessages: "Brands.iwacu.footer",
    nav: IWACU_NAV,
    // Trip alerts belong to Movana; Iwacu visitors read the same page.
    alertsHref: "/movana/trip-alerts",
    fullNav: { flex: "nav:flex", block: "nav:block", hidden: "nav:hidden" },
    solidHeaderRoutes: ["/iwacu/experiences", "/iwacu/kigali-guide"],
    sibling: "movana",
  },
};

export const isBrandId = (v: unknown): v is BrandId => BRAND_IDS.includes(v as BrandId);

export const getBrand = (id: BrandId): BrandConfig => BRANDS[id];

/** True when `pathname` is `route` or a page below it. */
export const isRouteOrChild = (pathname: string, route: string) =>
  pathname === route || pathname.startsWith(`${route}/`);

/** Whether this brand's header should start solid on `pathname` (no locale prefix). */
export const wantsSolidHeader = (id: BrandId, pathname: string) =>
  BRANDS[id].solidHeaderRoutes.some((route) => isRouteOrChild(pathname, route));
