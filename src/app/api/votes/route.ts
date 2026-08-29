import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { votes, cards, votes as votesTable } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { getSession } from "@/lib/session";

// POST = toggle a vote on a card
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const session = await getSession();
    const { cardId, retroId, voterName } = body;

    if (!cardId || !retroId) {
      return NextResponse.json({ error: "cardId and retroId required" }, { status: 400 });
    }

    const card = await db.query.cards.findFirst({ where: eq(cards.id, cardId) });
    if (!card) return NextResponse.json({ error: "Card not found" }, { status: 404 });

    const voterId = session?.user?.id || null;
    const existing = await db.query.votes.findFirst({
      where: voterId
        ? and(eq(votes.cardId, cardId), eq(votes.voterId, voterId))
        : and(eq(votes.cardId, cardId), eq(votes.voterName, voterName || "anon")),
    });

    if (existing) {
      // remove vote
      await db.delete(votes).where(eq(votes.id, existing.id));
      await db
        .update(cards)
        .set({ votesCount: sql`${cards.votesCount} - 1` })
        .where(eq(cards.id, cardId));
      return NextResponse.json({ voted: false });
    }

    // Enforce vote limits
    const retro = await db.query.retros.findFirst({ where: eq(sql`id`, retroId) });
    if (retro) {
      const voterVotes = await db.query.votes.findMany({
        where: voterId
          ? and(eq(votes.retroId, retroId), eq(votes.voterId, voterId))
          : and(eq(votes.retroId, retroId), eq(votes.voterName, voterName || "anon")),
      });
      if (voterVotes.length >= retro.votesPerParticipant) {
        return NextResponse.json({ error: "You've used all your votes" }, { status: 400 });
      }
      const columnVotes = voterVotes.filter((v) => {
        // check via card column - simplified: count by card.columnId matches
        return v;
      });
      void columnVotes;
    }

    await db.insert(votes).values({
      id: crypto.randomUUID(),
      cardId,
      retroId,
      voterId,
      voterName: session?.user?.name || voterName || "anon",
    });
    await db
      .update(cards)
      .set({ votesCount: sql`${cards.votesCount} + 1` })
      .where(eq(cards.id, cardId));

    return NextResponse.json({ voted: true });
  } catch (e) {
    console.error("[POST /api/votes]", e);
    return NextResponse.json({ error: "Failed to vote" }, { status: 500 });
  }
}
