import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { cards, retros } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/session";
import { isModerationExempt } from "@/lib/retro-access";

/**
 * Moderation endpoint — approve or reject a pending card.
 *
 * Only a facilitator of the retro (or the retro owner / an admin) can moderate.
 * - "approve": sets approved = true so the card becomes visible to all participants
 * - "reject": deletes the card
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, action, retroId } = body;

    if (!id || !action) {
      return NextResponse.json({ error: "id and action required" }, { status: 400 });
    }
    if (action !== "approve" && action !== "reject") {
      return NextResponse.json({ error: "action must be 'approve' or 'reject'" }, { status: 400 });
    }

    const session = await getSession();

    // Find the card
    const card = await db.query.cards.findFirst({ where: eq(cards.id, id) });
    if (!card) return NextResponse.json({ error: "Card not found" }, { status: 404 });

    // Find the retro to check moderation
    const retro = await db.query.retros.findFirst({ where: eq(retros.id, retroId || card.retroId) });
    if (!retro) return NextResponse.json({ error: "Retro not found" }, { status: 404 });
    if (!retro.moderated) {
      return NextResponse.json({ error: "This retro is not moderated" }, { status: 400 });
    }

    // Check authorization: must be a facilitator, the retro owner, or an admin.
    // This is exactly the same set of people who are exempt from moderation.
    const isAuthorized = await isModerationExempt(retro, session);

    if (!isAuthorized) {
      return NextResponse.json(
        { error: "Only facilitators and hosts can moderate cards" },
        { status: 403 }
      );
    }

    if (action === "approve") {
      // Approving publishes the card to the shared board.
      const [updated] = await db
        .update(cards)
        .set({ approved: true, isPublic: true, updatedAt: new Date() })
        .where(eq(cards.id, id))
        .returning();
      return NextResponse.json(updated);
    } else {
      // reject = delete the card
      await db.delete(cards).where(eq(cards.id, id));
      return NextResponse.json({ ok: true });
    }
  } catch (e) {
    console.error("[POST /api/cards/moderation]", e);
    return NextResponse.json({ error: "Failed to moderate card" }, { status: 500 });
  }
}
