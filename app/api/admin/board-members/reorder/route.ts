/**
 * POST /api/admin/board-members/reorder  { ids: string[] } → new display order, first to last.
 * Needs team:manage (lib/admin-rbac.ts).
 */
import { NextResponse } from "next/server";
import { adminGuard } from "@/lib/cms/server";
import { reorderBoard } from "@/lib/board-members-server";
import { BOARD_LIMITS } from "@/lib/board-members";
import { readJsonBody } from "@/lib/read-json-body";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "no-store" };
const fail = (error: string, status: number) => NextResponse.json({ error }, { status, headers: noStore });

export async function POST(req: Request) {
  const blocked = await adminGuard(req, { write: true, perm: "team:manage" });
  if (blocked) return blocked;

  const body = await readJsonBody(req, 8 * 1024);
  if (!body.ok) return fail(body.error, body.status);
  const ids = (body.value as { ids?: unknown } | null)?.ids;
  if (!Array.isArray(ids) || ids.length > BOARD_LIMITS.members || ids.some((x) => typeof x !== "string")) {
    return fail("invalid_ids", 400);
  }
  try {
    return NextResponse.json({ items: await reorderBoard(ids as string[]) }, { headers: noStore });
  } catch (err) {
    console.error("[admin] reorder board failed:", err);
    return fail("unavailable", 500);
  }
}
