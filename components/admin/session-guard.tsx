"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

/**
 * Rendered by an admin page when the session has ended between two clicks.
 * Refreshing makes the layout check the cookie again and show the sign-in form.
 */
export function SessionGuard() {
  const t = useTranslations("Admin.common");
  const router = useRouter();
  useEffect(() => {
    router.refresh();
  }, [router]);
  return <p className="py-16 text-center text-sm text-muted-foreground">{t("sessionEnded")}</p>;
}
