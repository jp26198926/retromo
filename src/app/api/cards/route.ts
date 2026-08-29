import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { cards, columns, retroParticipants } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { getSession } from "@/lib/session";
import { CARD_COLOR_KEYS } from "@/lib/card-colors";
import { randomColor } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const session = await getSession();
    const { columnId, retroId, content, color, authorName, participantId, isPublic = false } = body;

    if (!columnId || !content?.trim()) {
      return NextResponse.json({ error: "columnId and content required" }, { status: 400 });
    }

    const col = await db.query.columns.findFirst({ where: eq(columns.id, columnId) });
    if (!col) return NextResponse.json({ error: "Column not found" }, { status: 404 });

    // Determine author name and card color
    let resolvedAuthorName = session?.user?.name || authorName || null;
    let resolvedColor = color || "yellow";

    // For anonymous users, look up their participant record to get their name and color
    if (!session?.user && participantId) {
      const participant = await db.query.retroParticipants.findFirst({
        where: eq(retroParticipants.id, participantId),
      });
      if (participant) {
        resolvedAuthorName = participant.displayName || resolvedAuthorName;
        // Use participant's avatar color to pick a card color
        if (!color && participant.color) {
          // Map participant color hex to nearest card color
          resolvedColor = mapHexToCardColor(participant.color);
        }
      }
    }

    const id = crypto.randomUUID();
    const [card] = await db
      .insert(cards)
      .values({
        id,
        columnId,
        retroId,
        content: content.trim(),
        color: resolvedColor as typeof cards.$inferSelect.color,
        authorId: session?.user?.id || null,
        authorName: resolvedAuthorName,
        isPublic,
        position: 0,
      })
      .returning();

    return NextResponse.json(card);
  } catch (e) {
    console.error("[POST /api/cards]", e);
    return NextResponse.json({ error: "Failed to create card" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, content, color, isPublic, columnId, position, imageUrl } = body;

    const patch: Record<string, unknown> = { updatedAt: new Date() };
    if (content !== undefined) patch.content = content;
    if (color !== undefined) patch.color = color;
    if (isPublic !== undefined) patch.isPublic = isPublic;
    if (columnId !== undefined) patch.columnId = columnId;
    if (position !== undefined) patch.position = position;
    if (imageUrl !== undefined) patch.imageUrl = imageUrl;

    const [updated] = await db
      .update(cards)
      .set(patch)
      .where(eq(cards.id, id))
      .returning();

    if (!updated) return NextResponse.json({ error: "Card not found" }, { status: 404 });
    return NextResponse.json(updated);
  } catch (e) {
    console.error("[PATCH /api/cards]", e);
    return NextResponse.json({ error: "Failed to update card" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    await db.delete(cards).where(eq(cards.id, id));
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[DELETE /api/cards]", e);
    return NextResponse.json({ error: "Failed to delete card" }, { status: 500 });
  }
}

// Map a participant avatar hex color to the nearest card color key
function mapHexToCardColor(hex: string): string {
  const colorMap: Record<string, string> = {
    "#ef4444": "pink",
    "#f97316": "orange",
    "#f59e0b": "yellow",
    "#22c55e": "green",
    "#10b981": "green",
    "#06b6d4": "blue",
    "#3b82f6": "blue",
    "#6366f1": "blue",
    "#8b5cf6": "blue",
    "#ec4899": "pink",
  };
  return colorMap[hex] || CARD_COLOR_KEYS[Math.floor(Math.random() * CARD_COLOR_KEYS.length)];
}
