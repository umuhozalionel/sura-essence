/**
 * The check at the top of every /admin page. SERVER ONLY.
 *
 *   const access = await requirePage("fleet:view");
 *   if (!access.ok) return access.block;
 *
 * Not signed in (or the session ended) → the SessionGuard, which brings back
 * the sign-in form. Signed in without the permission → a "no access" panel.
 * The API routes check again on every request; this only decides what to show.
 */
import React from "react";
import { getAdminSession, type AdminSession } from "./admin-auth";
import { can, type Permission } from "./admin-rbac";
import { SessionGuard } from "@/components/admin/session-guard";
import { NoAccess } from "@/components/admin/no-access";

export async function requirePage(
  permission: Permission,
): Promise<{ ok: true; session: AdminSession } | { ok: false; block: React.ReactElement }> {
  const session = await getAdminSession();
  if (!session) return { ok: false, block: <SessionGuard /> };
  if (!can(session.role, permission)) return { ok: false, block: <NoAccess /> };
  return { ok: true, session };
}
