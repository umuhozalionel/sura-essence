"use client";

import { ChevronDown, ChevronRight, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { getBrand, isRouteOrChild, type BrandId, type NavItem } from "@/lib/brands";
import { AlertBar } from "./alert-bar";
import { BrandLogo } from "./brand-logo";
import { LocaleSwitcher } from "./locale-switcher";
import { MobileMenu } from "./mobile-menu";
import { WhatsAppButton } from "./whatsapp-button";

type MegaItem = Extract<NavItem, { type: "mega" }>;

/**
 * The fixed alert bar + header for one brand. Everything brand-specific (logo,
 * nav, where alerts lead) comes from lib/brands; colours come from the
 * `data-brand` tokens in app/globals.css. Total height is --header-h.
 *
 * `forceSolid`: use the solid skin from the start, for pages whose top is light
 * (see BrandConfig.solidHeaderRoutes and useSolidHeader in brand-chrome.tsx).
 *
 * `slim`: the chooser's header. Just the logo and language switch under the alert
 * bar: no menu, no WhatsApp button, no weather.
 */
export function BrandHeader({ brand, forceSolid = false, slim = false }: { brand: BrandId; forceSolid?: boolean; slim?: boolean }) {
  const config = getBrand(brand);
  const t = useTranslations(config.headerMessages);
  const tHeader = useTranslations("Header");
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeMega, setActiveMega] = useState<string | null>(null);
  const pathname = usePathname();

  // The header stays mounted between pages, so close its menus when the page changes.
  const [menuPath, setMenuPath] = useState(pathname);
  if (menuPath !== pathname) {
    setMenuPath(pathname);
    setOpen(false);
    setActiveMega(null);
  }

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    // Read the position now too: a reload or back-navigation can land mid-page.
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!open && !activeMega) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setActiveMega(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, activeMega]);

  /* Transparent over the hero image; solid white once the visitor scrolls.
     An open mega menu also forces the solid skin, so its white panel has a
     matching bar above it. */
  const solid = forceSolid || scrolled || activeMega !== null;
  const mega = config.nav.find((item): item is MegaItem => item.type === "mega" && item.id === activeMega);

  // Links with a query lead to a tab of another item's page, so they never count as the current page.
  const isCurrent = (href: string) =>
    !href.includes("?") && (href === config.homeHref ? pathname === href : isRouteOrChild(pathname, href));
  // One look for every item in every brand: the current page is underlined, nothing gets a box.
  const skin = (current: boolean) =>
    current
      ? `${solid ? "text-primary" : "text-white"} underline decoration-secondary decoration-2 underline-offset-8`
      : solid
        ? "text-muted-foreground hover:text-foreground"
        : "text-white/85 hover:text-white";

  return (
    // `contents`: no box of its own, it only carries the brand's colour tokens down to the fixed bars.
    <div data-brand={brand} className="contents">
      {/* One scrim spanning the alert bar AND the header, so the pre-scroll state
          is a single unbroken block with no hairline between the two. */}
      <div
        aria-hidden="true"
        className={`pointer-events-none fixed top-0 left-0 right-0 z-[55] h-[150px] bg-gradient-to-b from-black/60 via-black/30 to-transparent transition-opacity duration-300 ${
          solid ? "opacity-0" : "opacity-100"
        }`}
      />

      <AlertBar brand={brand} alertsHref={config.alertsHref} solid={solid} slim={slim} />

      <header
        onMouseLeave={() => setActiveMega(null)}
        className={`fixed top-9 left-0 right-0 z-50 w-full transition-all duration-300 ${
          slim
            ? scrolled ? "bg-black/60 backdrop-blur-md border-b border-white/10" : "bg-transparent"
            : solid
            ? "bg-white/95 backdrop-blur-md shadow-sm border-b border-border"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 flex items-center justify-between h-16 md:h-18">

          <div className="flex-shrink-0 z-20">
            <Link
              href={config.homeHref}
              aria-label={config.name}
              className="flex min-h-12 items-center transition-opacity hover:opacity-75 duration-300"
            >
              <BrandLogo brand={brand} tone={solid && !slim ? "dark" : "light"} preload />
            </Link>
          </div>

          {/* Full text menu from the brand's fullNav width: below that the French labels don't fit
              beside the logo and buttons, so laptops get the menu button instead. */}
          {!slim && <nav className={`hidden ${config.fullNav.flex} flex-1 justify-center items-center z-10 px-4`}>
            <div className="flex items-center gap-1">
              {config.nav.map((item) => {
                if (item.type === "mega" && item.href) {
                  const on = activeMega === item.id;
                  const look = skin(on || isCurrent(item.href) || item.links.some((sub) => isCurrent(sub.href)));
                  return (
                    <div key={item.id} className="flex items-center" onMouseEnter={() => setActiveMega(item.id)}>
                      <Link
                        href={item.href}
                        className={`flex min-h-12 items-center pl-2 2xl:pl-3 pr-1 py-2 text-xs font-bold uppercase tracking-wide whitespace-nowrap transition-colors duration-200 ${look}`}
                      >
                        {t(`nav.${item.id}`)}
                      </Link>
                      <button
                        type="button"
                        aria-expanded={on}
                        aria-haspopup="true"
                        aria-label={t(`nav.${item.id}`)}
                        onClick={() => setActiveMega(on ? null : item.id)}
                        className={`flex min-h-12 items-center pr-2 2xl:pr-3 pl-1 transition-colors duration-200 ${look}`}
                      >
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${on ? "rotate-180" : ""}`} strokeWidth={2.5} />
                      </button>
                    </div>
                  );
                }
                if (item.type === "mega") {
                  return (
                    <button
                      key={item.id}
                      type="button"
                      aria-expanded={activeMega === item.id}
                      aria-haspopup="true"
                      onMouseEnter={() => setActiveMega(item.id)}
                      onClick={() => setActiveMega(activeMega === item.id ? null : item.id)}
                      className={`min-h-12 px-2 2xl:px-3 py-2 text-xs font-bold uppercase tracking-wide whitespace-nowrap transition-colors duration-200 relative flex items-center gap-1.5 group ${skin(activeMega === item.id || item.links.some((sub) => isCurrent(sub.href)))}`}
                    >
                      {t(`nav.${item.id}`)}
                      <ChevronDown
                        className={`w-3.5 h-3.5 transition-transform ${activeMega === item.id ? "rotate-180" : ""}`}
                        strokeWidth={2.5}
                      />
                    </button>
                  );
                }
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={`flex min-h-12 items-center px-2 2xl:px-3 py-2 text-xs font-bold uppercase tracking-wide whitespace-nowrap transition-colors duration-200 relative ${skin(isCurrent(item.href))}`}
                  >
                    {t(`nav.${item.id}`)}
                  </Link>
                );
              })}
            </div>
          </nav>}

          {/* Language switch + WhatsApp */}
          {slim && <LocaleSwitcher solid={false} />}
          {!slim && <div className={`hidden ${config.fullNav.flex} flex-shrink-0 items-center gap-3 z-20`}>
            <LocaleSwitcher solid={solid} />
            <WhatsAppButton variant="icon" />
          </div>}

          {/* Below that width: language switch + menu button */}
          {!slim && <div className={`flex ${config.fullNav.hidden} items-center gap-2 z-20`}>
            <LocaleSwitcher solid={solid} />
            <button
              type="button"
              aria-expanded={open}
              onClick={() => setOpen(!open)}
              className={`flex h-12 w-12 items-center justify-center rounded-lg border transition-colors duration-300 ${
                solid
                  ? "bg-muted/40 border-border text-foreground hover:bg-muted/70"
                  : "bg-white/10 border-white/25 text-white backdrop-blur-md hover:bg-white/20"
              }`}
              aria-label={tHeader("toggleMenu")}
            >
              {open ? <X size={20} strokeWidth={2.5} /> : <Menu size={20} strokeWidth={2.5} />}
            </button>
          </div>}
        </div>

        <AnimatePresence>
          {mega && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className={`absolute top-full left-0 w-full bg-card border-b border-border shadow-lg z-40 hidden ${config.fullNav.block}`}
            >
              <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-8">
                <div className="grid grid-cols-12 gap-8">
                  <div className="col-span-5">
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-5">
                      {t(`nav.${mega.id}`)}
                    </h4>
                    <div className="grid grid-cols-1 gap-3">
                      {mega.links.map((sub) => (
                        <Link
                          key={sub.id}
                          href={sub.href}
                          onClick={() => setActiveMega(null)}
                          className="group flex items-start gap-3 p-4 rounded-lg border border-border hover:border-primary/30 hover:bg-primary/5 transition-all duration-200"
                        >
                          <ChevronRight
                            className="w-4 h-4 text-primary mt-0.5 transition-transform group-hover:translate-x-1"
                            strokeWidth={2.5}
                          />
                          <div className="flex flex-col gap-1">
                            <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                              {t(`menu.${sub.id}.name`)}
                            </span>
                            <span className="text-xs text-muted-foreground font-medium">
                              {t(`menu.${sub.id}.desc`)}
                            </span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>

                  <div className="col-span-7 border-l border-border pl-8 flex items-center justify-center">
                    <div className="text-center max-w-md">
                      <p className="font-display text-2xl font-bold text-muted-foreground leading-tight mb-3">
                        {t("featured.title")}
                      </p>
                      <p className="text-sm text-muted-foreground font-medium">
                        {t("featured.subtitle")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {!slim && <MobileMenu brand={brand} open={open} onClose={() => setOpen(false)} />}
    </div>
  );
}
