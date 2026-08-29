import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { retros, columns, cards, votes, actionPoints, retroParticipants, votes as votesTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/session";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getSession();

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
  const currentParticipant = session?.user
    ? participants.find((p) => p.userId === session.user.id) || null
    : null;

  return NextResponse.json({
    retro,
    columns: cols,
    cards: cardsWithVotes,
    actionPoints: aps,
    participants,
    currentUserId: session?.user?.id || null,
    currentParticipant,
  });
}
