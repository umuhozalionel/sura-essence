/**
 * PUT    /api/admin/board-members/<id>  full form body      → save changes
 * PATCH  /api/admin/board-members/<id>  { visible: bool }   → show / hide on the website
 * DELETE /api/admin/board-members/<id>                      → remove for good
 * Needs team:manage (lib/admin-rbac.ts).
 */
import { NextResponse } from "next/server";
import { adminGuard } from "@/lib/cms/server";
import {
  deleteBoardMember, parseMember, setBoardMemberVisible, updateBoardMember,
} from "@/lib/board-members-server";
import { readJsonBody } from "@/lib/read-json-body";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };
const noStore = { "Cache-Control": "no-store" };
const fail = (error: string, status: number, extra?: object) =>
  NextResponse.json({ error, ...extra }, { status, headers: noStore });

const guard = (req: Request) => adminGuard(req, { write: true, perm: "team:manage" });

export async function PUT(req: Request, { params }: Ctx) {
  const blocked = await guard(req);
  if (blocked) return blocked;
  const { id } = await params;

  const body = await readJsonBody(req);
  if (!body.ok) return fail(body.error, body.status);
  const parsed = parseMember(body.value);
  if (!parsed.ok) return fail("invalid", 400, { reason: parsed.reason, field: parsed.field });

  try {
    const item = await updateBoardMember(id, parsed.value, parsed.photo);
    return item ? NextResponse.json({ item }, { headers: noStore }) : fail("not_found", 404);
  } catch (err) {
    console.error("[admin] update board member failed:", err);
    return fail("unavailable", 500);
  }
}

export async function PATCH(req: Request, { params }: Ctx) {
  const blocked = await guard(req);
  if (blocked) return blocked;
  const { id } = await params;

  const body = await readJsonBody(req, 4 * 1024);
  if (!body.ok) return fail(body.error, body.status);
  const visible = (body.value as { visible?: unknown } | null)?.visible;
  if (typeof visible !== "boolean") return fail("invalid_visible", 400);

  try {
    const item = await setBoardMemberVisible(id, visible);
    return item ? NextResponse.json({ item }, { headers: noStore }) : fail("not_found", 404);
  } catch (err) {
    console.error("[admin] toggle board member failed:", err);
    return fail("unavailable", 500);
  }
}

export async function DELETE(req: Request, { params }: Ctx) {
  const blocked = await guard(req);
  if (blocked) return blocked;
  const { id } = await params;
  try {
    return (await deleteBoardMember(id))
      ? NextResponse.json({ ok: true }, { headers: noStore })
      : fail("not_found", 404);
  } catch (err) {
    console.error("[admin] delete board member failed:", err);
    return fail("unavailable", 500);
  }
}
