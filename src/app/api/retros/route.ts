import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { retros, columns, retroParticipants } from "@/db/schema";
import { getSession } from "@/lib/session";
import { generateShareToken, randomColor, randomDisplayName } from "@/lib/utils";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const session = await getSession();

    const {
      title,
      topic,
      engagement = "anonymous",
      columns: cols = [],
      votesPerParticipant = 3,
      votesPerColumn = 3,
      votesPerCard = 3,
      secretVoting = true,
      timerDuration = 0,
      teamId = null,
      plan = "anonymous",
    } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }
    if (!cols.length) {
      return NextResponse.json({ error: "At least one column is required" }, { status: 400 });
    }

    const retroId = crypto.randomUUID();
    const now = new Date();

    const [retro] = await db
      .insert(retros)
      .values({
        id: retroId,
        title: title.trim(),
        topic: topic?.trim() || null,
        engagement,
        votesPerParticipant,
        votesPerColumn,
        votesPerCard,
        secretVoting,
        timerDuration,
        teamId: teamId || null,
        ownerId: session?.user.id || null,
        plan,
        shareToken: generateShareToken(),
        retentionDays: plan === "anonymous" ? 365 : null,
        timerEndsAt: timerDuration > 0 ? new Date(now.getTime() + timerDuration * 1000) : null,
      })
      .returning();

    // insert columns
    if (cols.length) {
      await db.insert(columns).values(
        cols.map((c: { name: string; description?: string; color: string }, i: number) => ({
          id: crypto.randomUUID(),
          retroId,
          name: c.name.trim() || `Column ${i + 1}`,
          description: c.description?.trim() || null,
          color: c.color || "#facc15",
          position: i,
        }))
      );
    }

    // add creator as participant + facilitator if logged in
    if (session?.user) {
      await db.insert(retroParticipants).values({
        id: crypto.randomUUID(),
        retroId,
        userId: session.user.id,
        displayName: session.user.name,
        color: randomColor(),
        isFacilitator: true,
      });
    }

    return NextResponse.json({ id: retro.id, shareToken: retro.shareToken });
  } catch (e) {
    console.error("[POST /api/retros]", e);
    return NextResponse.json({ error: "Failed to create retro" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ retros: [] });
    }
    const userRetros = await db.query.retros.findMany({
      where: eq(retros.ownerId, session.user.id),
      orderBy: (retros, { desc }) => [desc(retros.updatedAt)],
      limit: 50,
    });
    return NextResponse.json({ retros: userRetros });
  } catch (e) {
    console.error("[GET /api/retros]", e);
    return NextResponse.json({ error: "Failed to fetch retros" }, { status: 500 });
  }
}
