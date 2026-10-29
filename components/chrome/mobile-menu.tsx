"use client";

import { ChevronRight, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useScrollLock } from "@/lib/use-scroll-lock";
import { getBrand, type BrandId } from "@/lib/brands";
import { BrandLogo } from "./brand-logo";
import { BrandSwitcher } from "./brand-switcher";
import { WhatsAppButton } from "./whatsapp-button";

/**
 * The full-screen menu below 2xl: the brand switcher, every nav item (mega
 * menus opened out as lists) and the WhatsApp button. Holds the counted page
 * scroll lock while open.
 */
export function MobileMenu({ brand, open, onClose }: { brand: BrandId; open: boolean; onClose: () => void }) {
  const config = getBrand(brand);
  const t = useTranslations(config.headerMessages);
  const tHeader = useTranslations("Header");

  useScrollLock(open);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-card z-[70] flex flex-col 2xl:hidden"
        >
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="flex justify-between items-center p-6 border-b border-border"
          >
            <BrandLogo brand={brand} tone="dark" />
            <button
              type="button"
              onClick={onClose}
              className="flex h-12 w-12 items-center justify-center bg-muted/40 rounded-lg text-foreground border border-border hover:bg-muted/70 transition-colors"
              aria-label={tHeader("closeMenu")}
            >
              <X size={20} strokeWidth={2.5} />
            </button>
          </motion.div>

          <div className="flex-1 overflow-y-auto p-6">
            <div className="flex flex-col gap-6">
              <BrandSwitcher current={brand} variant="menu" onNavigate={onClose} />

              {config.nav.map((item, idx) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.2 + (idx * 0.1) }}
                >
                  {item.type === "mega" ? (
                    <div className="space-y-4">
                      <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        {t(`nav.${item.id}`)}
                      </h3>
                      <div className="flex flex-col gap-3 pl-2">
                        {item.links.map((sub) => (
                          <Link
                            key={sub.id}
                            href={sub.href}
                            onClick={onClose}
                            className="group flex items-start gap-3 p-4 rounded-lg bg-muted/40 border border-border hover:border-primary hover:bg-card transition-all active:scale-[0.98]"
                          >
                            <ChevronRight
                              className="w-5 h-5 text-primary mt-0.5 transition-transform group-hover:translate-x-1"
                              strokeWidth={2.5}
                            />
                            <div className="flex flex-col gap-1">
                              <span className="text-base font-bold text-foreground">
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
                  ) : (
                    <Link
                      href={item.href}
                      onClick={onClose}
                      className="flex items-center justify-between p-4 rounded-lg bg-muted/40 border border-border hover:border-primary hover:bg-card transition-all active:scale-[0.98] group"
                    >
                      <span className="text-lg font-bold text-foreground">
                        {t(`nav.${item.id}`)}
                      </span>
                      <ChevronRight
                        className="w-5 h-5 text-primary transition-transform group-hover:translate-x-1"
                        strokeWidth={2.5}
                      />
                    </Link>
                  )}
                </motion.div>
              ))}
            </div>
          </div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.5 }}
            className="p-6 border-t border-border bg-muted/40"
          >
            <WhatsAppButton variant="full" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
