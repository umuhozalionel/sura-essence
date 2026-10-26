/**
 * GET  /api/admin/users → every admin account (no password hashes)
 * POST /api/admin/users  { name, email, role, password } → add a staff member
 *        422 { fields } when something is missing or wrong, 409 when the email already has an account.
 * Needs users:manage (lib/admin-rbac.ts): Main Admin only.
 */
import { adminBody, adminGuard, adminJson, fail, serverError } from "@/lib/cms/server";
import { parseNewAccount } from "@/lib/admin-accounts";
import { createAccount, listAccounts } from "@/lib/admin-users";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const blocked = await adminGuard(req, { write: false, perm: "users:manage" });
  if (blocked) return blocked;
  try {
    return adminJson({ items: await listAccounts() });
  } catch (err) {
    return serverError("list admin accounts", err);
  }
}

export async function POST(req: Request) {
  const blocked = await adminGuard(req, { write: true, perm: "users:manage" });
  if (blocked) return blocked;
  const body = await adminBody(req, 4 * 1024);
  if (!body.ok) return fail(body.error, body.status);
  const parsed = parseNewAccount(body.value);
  if (!parsed.ok) return fail("invalid", 422, { fields: parsed.errors });
  try {
    const result = await createAccount(parsed.value);
    if (!result.ok) return fail("duplicate_email", 409, { fields: { email: "duplicate" } });
    return adminJson({ item: result.account }, 201);
  } catch (err) {
    return serverError("create admin account", err);
  }
}
