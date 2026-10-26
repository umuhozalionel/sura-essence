import React from "react";
import { useTranslations } from "next-intl";
import { ArrowLeft, Lock } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

/** Shown instead of a screen this person's role doesn't include (e.g. a typed-in address). */
export function NoAccess() {
  const t = useTranslations("Admin.noAccess");
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground" aria-hidden>
        <Lock className="size-5" />
      </span>
      <h1 className="mt-4 text-xl font-semibold tracking-tight">{t("title")}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{t("body")}</p>
      <Button asChild variant="outline" className="mt-6">
        <Link href="/admin">
          <ArrowLeft aria-hidden />
          {t("back")}
        </Link>
      </Button>
    </div>
  );
}
