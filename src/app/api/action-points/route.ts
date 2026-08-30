import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { actionPoints, retros } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/session";
import { checkRetroAccess } from "@/lib/retro-access";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const session = await getSession();
    const { retroId, teamId, text, assigneeName, dueDate } = body;

    if (!retroId || !text?.trim()) {
      return NextResponse.json({ error: "retroId and text required" }, { status: 400 });
    }

    // Private retrospectives require a signed-in account
    const parentRetro = await db.query.retros.findFirst({ where: eq(retros.id, retroId) });
    if (parentRetro) {
      const access = checkRetroAccess(parentRetro, session);
      if (!access.ok) {
        return NextResponse.json({ error: access.error, reason: access.reason }, { status: access.status });
      }
    }

    const [ap] = await db
      .insert(actionPoints)
      .values({
        id: crypto.randomUUID(),
        retroId,
        teamId: teamId || null,
        text: text.trim(),
        assigneeId: session?.user?.id || null,
        assigneeName: assigneeName || session?.user?.name || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        status: "open",
      })
      .returning();

    return NextResponse.json(ap);
  } catch (e) {
    console.error("[POST /api/action-points]", e);
    return NextResponse.json({ error: "Failed to create action point" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, text, assigneeName, dueDate, status } = body;

    const patch: Record<string, unknown> = { updatedAt: new Date() };
    if (text !== undefined) patch.text = text;
    if (assigneeName !== undefined) patch.assigneeName = assigneeName;
    if (dueDate !== undefined) patch.dueDate = dueDate ? new Date(dueDate) : null;
    if (status !== undefined) patch.status = status;

    const [updated] = await db
      .update(actionPoints)
      .set(patch)
      .where(eq(actionPoints.id, id))
      .returning();

    if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(updated);
  } catch (e) {
    console.error("[PATCH /api/action-points]", e);
    return NextResponse.json({ error: "Failed to update action point" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    await db.delete(actionPoints).where(eq(actionPoints.id, id));
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[DELETE /api/action-points]", e);
    return NextResponse.json({ error: "Failed to delete action point" }, { status: 500 });
  }
}
