import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { retroParticipants } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/session";
import { randomColor, randomDisplayName } from "@/lib/utils";

// Join a retro as a participant (creates or returns existing)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const session = await getSession();
    const { retroId, displayName, isFacilitator = false } = body;

    if (!retroId) return NextResponse.json({ error: "retroId required" }, { status: 400 });

    // If logged in, find existing by userId
    if (session?.user) {
      const existing = await db.query.retroParticipants.findFirst({
        where: eq(retroParticipants.retroId, retroId),
      });
      const mine = await db.query.retroParticipants.findMany({
        where: eq(retroParticipants.retroId, retroId),
      });
      const found = mine.find((p) => p.userId === session.user.id);
      if (found) return NextResponse.json(found);

      const [p] = await db
        .insert(retroParticipants)
        .values({
          id: crypto.randomUUID(),
          retroId,
          userId: session.user.id,
          displayName: session.user.name,
          color: randomColor(),
          isFacilitator,
        })
        .returning();
      void existing;
      return NextResponse.json(p);
    }

    // Anonymous guest
    const [p] = await db
      .insert(retroParticipants)
      .values({
        id: crypto.randomUUID(),
        retroId,
        displayName: displayName || randomDisplayName(),
        color: randomColor(),
        isFacilitator: false,
      })
      .returning();
    return NextResponse.json(p);
  } catch (e) {
    console.error("[POST /api/participants]", e);
    return NextResponse.json({ error: "Failed to join" }, { status: 500 });
  }
}

// Update participant (ready state, name)
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ready, displayName } = body;
    const patch: Record<string, unknown> = {};
    if (ready !== undefined) patch.ready = ready;
    if (displayName !== undefined) patch.displayName = displayName;

    const [updated] = await db
      .update(retroParticipants)
      .set(patch)
      .where(eq(retroParticipants.id, id))
      .returning();
    if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(updated);
  } catch (e) {
    console.error("[PATCH /api/participants]", e);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}
