import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

// 404 for unknown pages inside /en or /fr, shown in the visitor's language.
export default function NotFoundPage() {
  const t = useTranslations("NotFound");

  return (
    <section className="min-h-screen flex flex-col items-center justify-center gap-6 px-6 text-center bg-foreground text-white">
      <span className="text-xs font-bold uppercase tracking-widest text-secondary">404</span>
      <h1 className="text-3xl md:text-5xl font-extrabold uppercase tracking-tight">{t("title")}</h1>
      <p className="text-sm text-white/70 max-w-md">{t("description")}</p>
      <Link
        href="/"
        className="px-6 py-3 rounded-sm bg-primary hover:bg-primary-hover text-xs font-bold uppercase tracking-widest transition-colors"
      >
        {t("backHome")}
      </Link>
    </section>
  );
}
