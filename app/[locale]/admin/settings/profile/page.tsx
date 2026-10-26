import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { Languages, Palette, UserRound } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { requirePage } from "@/lib/admin-page";
import { getOwnProfile } from "@/lib/admin-users";
import { isCloudinaryConfigured, UPLOAD_LIMITS } from "@/lib/cloudinary";
import { isMongoConfigured } from "@/lib/mongodb";
import type { OwnProfile } from "@/lib/admin-profile";
import { cn } from "@/lib/utils";
import { Panel } from "@/components/admin/page-header";
import { SettingsRow } from "@/components/admin/settings-row";
import { ThemePicker } from "@/components/admin/admin-theme";
import { SignOutButton } from "@/components/admin/admin-header";
import { ProfileEditor } from "@/components/admin/profile-editor";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Admin.settings.tabs");
  return { title: t("profile") };
}

/**
 * Settings → My profile, for every role (profile:edit): photo, name, job title,
 * phone, bio, CV, password, sessions, plus this browser's appearance and language.
 * The first-run ADMIN_PASSWORD sign-in has no account, so it only gets the preferences.
 */
export default async function AdminProfilePage() {
  const access = await requirePage("profile:edit");
  if (!access.ok) return access.block;
  const { session } = access;
  const [t, locale] = await Promise.all([getTranslations("Admin.settings"), getLocale()]);

  let profile: OwnProfile | null = null;
  let loadFailed = false;
  if (session.source === "account" && isMongoConfigured) {
    try {
      profile = await getOwnProfile(session.userId);
    } catch (err) {
      console.error("[admin] loading own profile failed:", err);
      loadFailed = true;
    }
  }

  return (
    <div className="space-y-6">
      {session.source !== "account" ? (
        <Panel>
          <SettingsRow icon={UserRound}>
            <p className="text-sm text-muted-foreground">{t("profile.setupOnly")}</p>
          </SettingsRow>
        </Panel>
      ) : profile ? (
        <ProfileEditor
          initial={profile}
          userId={session.userId}
          uploads={isCloudinaryConfigured() ? { avatar: UPLOAD_LIMITS.avatar, cv: UPLOAD_LIMITS.cv } : null}
        />
      ) : (
        <Panel>
          <p role="alert" className="text-sm font-medium">{t(loadFailed ? "profile.unavailable" : "profile.notConfigured")}</p>
        </Panel>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title={t("appearance.title")} description={t("appearance.subtitle")}>
          <SettingsRow icon={Palette}>
            <ThemePicker />
          </SettingsRow>
        </Panel>

        <Panel title={t("language.title")} description={t("language.subtitle")}>
          <SettingsRow icon={Languages}>
            <div className="inline-flex rounded-lg border bg-muted p-1">
              {routing.locales.map((l) => (
                <Link
                  key={l}
                  href="/admin/settings/profile"
                  locale={l}
                  aria-current={l === locale ? "true" : undefined}
                  className={cn(
                    "inline-flex h-8 items-center rounded-md px-3 text-sm font-medium transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
                    l === locale ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {t(`language.${l}`)}
                </Link>
              ))}
            </div>
          </SettingsRow>
        </Panel>
      </div>

      {session.source !== "account" && (
        <Panel title={t("security.title")}>
          <SignOutButton />
        </Panel>
      )}
    </div>
  );
}
