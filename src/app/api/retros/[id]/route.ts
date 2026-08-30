import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { retros, columns, cards, votes, actionPoints, retroParticipants } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getSession } from "@/lib/session";
import { getCurrentUserPlan, hasActiveAccess } from "@/lib/plans";
import { isAdmin } from "@/lib/admin";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getSession();
  const url = new URL(req.url);
  const anonymousSessionId = url.searchParams.get("anon") || undefined;

  const retro = await db.query.retros.findFirst({ where: eq(retros.id, id) });
  if (!retro) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const cols = await db.query.columns.findMany({
    where: eq(columns.retroId, id),
    orderBy: (columns, { asc }) => [asc(columns.position)],
  });

  const allCards = await db.query.cards.findMany({
    where: eq(cards.retroId, id),
    orderBy: (cards, { asc }) => [asc(cards.position)],
  });

  const allVotes = await db.query.votes.findMany({
    where: eq(votes.retroId, id),
  });

  const aps = await db.query.actionPoints.findMany({
    where: eq(actionPoints.retroId, id),
    orderBy: (actionPoints, { asc }) => [asc(actionPoints.createdAt)],
  });

  const participants = await db.query.retroParticipants.findMany({
    where: eq(retroParticipants.retroId, id),
  });

  // Map votes onto cards
  const cardsWithVotes = allCards.map((c) => ({
    ...c,
    votes: allVotes.filter((v) => v.cardId === c.id),
  }));

  // Determine current participant
  let currentParticipant = null;
  if (session?.user) {
    currentParticipant = participants.find((p) => p.userId === session.user.id) || null;
  } else if (anonymousSessionId) {
    currentParticipant =
      participants.find((p) => p.anonymousSessionId === anonymousSessionId) || null;
  }

  // Filter private cards: only show private cards belonging to the current participant.
  // Public cards are always visible. Private cards from other users are hidden.
  const currentParticipantId = currentParticipant?.id || null;
  const currentUserId = session?.user?.id || null;

  const visibleCards = cardsWithVotes.filter((c) => {
    if (c.isPublic) return true;
    // Private card — only visible if it belongs to the current participant
    if (currentParticipantId) {
      // Match by authorId (logged-in) or by authorName matching displayName
      // For anonymous users, cards are tagged with the participant's display name
      if (c.authorId === currentUserId) return true;
      if (!currentUserId && c.authorName && currentParticipant?.displayName === c.authorName) return true;
    }
    return false;
  });

  return NextResponse.json({
    retro,
    columns: cols,
    cards: visibleCards,
    actionPoints: aps,
    participants,
    currentUserId,
    currentParticipant,
  });
}

// PATCH — toggle archived status on a retro.
// Only the retro owner can archive/unarchive. Archiving is a paid feature
// (infinite archive is available on Individual and Company plans).
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    const body = await req.json();
    const { archived } = body;

    if (typeof archived !== "boolean") {
      return NextResponse.json({ error: "archived (boolean) is required" }, { status: 400 });
    }

    const retro = await db.query.retros.findFirst({ where: eq(retros.id, id) });
    if (!retro) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Only the owner (or a platform admin) can archive/unarchive
    const admin = await isAdmin();
    if (retro.ownerId !== session.user.id && !admin) {
      return NextResponse.json({ error: "Only the retro owner can archive or unarchive" }, { status: 403 });
    }

    // Archiving requires a paid plan (infinite archive feature).
    // Admins are resolved to the Company plan, so this passes for them.
    const plan = await getCurrentUserPlan();
    const hasPaidAccess = hasActiveAccess(plan) && plan.plan !== "anonymous";
    if (!hasPaidAccess) {
      return NextResponse.json(
        { error: "Archiving retrospectives is available on the Personal and Company plans." },
        { status: 403 }
      );
    }

    const [updated] = await db
      .update(retros)
      .set({ archived, updatedAt: new Date() })
      .where(eq(retros.id, id))
      .returning();

    return NextResponse.json({ ok: true, archived: updated.archived });
  } catch (e) {
    console.error("[PATCH /api/retros/[id]]", e);
    return NextResponse.json({ error: "Failed to update retro" }, { status: 500 });
  }
}
