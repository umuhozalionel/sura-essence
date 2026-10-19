/**
 * GET  /api/admin/board-members → every board member, hidden ones included, in display order.
 *                                 The first call copies in the founders from the message files.
 * POST /api/admin/board-members → add one (body: BoardMemberInput in lib/board-members.ts)
 * Admin only.
 */
import { NextResponse } from "next/server";
import { isAdmin, isSameOrigin } from "@/lib/admin-auth";
import { isMongoConfigured } from "@/lib/mongodb";
import { createBoardMember, listBoardForAdmin, parseMember } from "@/lib/board-members-server";
import { readJsonBody } from "@/lib/read-json-body";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "no-store" };
const fail = (error: string, status: number, extra?: object) =>
  NextResponse.json({ error, ...extra }, { status, headers: noStore });

export async function GET() {
  if (!(await isAdmin())) return fail("unauthorized", 401);
  if (!isMongoConfigured) return fail("not_configured", 503);
  try {
    return NextResponse.json({ items: await listBoardForAdmin() }, { headers: noStore });
  } catch (err) {
    console.error("[admin] list board members failed:", err);
    return fail("unavailable", 500);
  }
}

export async function POST(req: Request) {
  if (!(await isAdmin())) return fail("unauthorized", 401);
  if (!isSameOrigin(req)) return fail("forbidden", 403);
  if (!isMongoConfigured) return fail("not_configured", 503);

  const body = await readJsonBody(req);
  if (!body.ok) return fail(body.error, body.status);
  const parsed = parseMember(body.value);
  if (!parsed.ok) return fail("invalid", 400, { reason: parsed.reason, field: parsed.field });

  try {
    const result = await createBoardMember(parsed.value, parsed.photo);
    return result.ok
      ? NextResponse.json({ item: result.item }, { status: 201, headers: noStore })
      : fail("too_many", 409);
  } catch (err) {
    console.error("[admin] create board member failed:", err);
    return fail("unavailable", 500);
  }
}
