import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { retros, retroParticipants } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getSession } from "@/lib/session";
import { getCurrentUserPlan, hasActiveAccess } from "@/lib/plans";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  const body = await req.json();

  // Only facilitators/owner can change settings
  const retro = await db.query.retros.findFirst({ where: eq(retros.id, id) });
  if (!retro) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isOwner = retro.ownerId && session?.user?.id === retro.ownerId;
  const participant = session?.user
    ? await db.query.retroParticipants.findFirst({
        where: and(eq(retroParticipants.retroId, id), eq(retroParticipants.userId, session.user.id)),
      })
    : null;
  const isFacilitator = isOwner || participant?.isFacilitator;

  if (!isFacilitator) {
    return NextResponse.json({ error: "Only facilitators can change settings" }, { status: 403 });
  }

  // If attempting to set visibility to private, enforce plan feature
  if (body.visibility === "private" && session?.user) {
    const plan = await getCurrentUserPlan();
    if (!hasActiveAccess(plan) || !plan.privateRetros) {
      return NextResponse.json(
        { error: "Private retrospectives require the Individual or Company plan." },
        { status: 403 }
      );
    }
  }

  // If attempting to enable moderation, enforce advanced facilitation feature
  if (body.moderated === true && session?.user) {
    const plan = await getCurrentUserPlan();
    if (!hasActiveAccess(plan) || !plan.advancedFacilitation) {
      return NextResponse.json(
        { error: "Moderation is an advanced facilitation feature on paid plans." },
        { status: 403 }
      );
    }
  }

  const patch: Record<string, unknown> = { updatedAt: new Date() };
  if (body.locked !== undefined) patch.locked = body.locked;
  if (body.secretVoting !== undefined) patch.secretVoting = body.secretVoting;
  if (body.moderated !== undefined) patch.moderated = body.moderated;
  if (body.visibility !== undefined) patch.visibility = body.visibility;
  if (body.timerMinutes !== undefined) {
    // timerMinutes is in minutes; store timerDuration in seconds
    patch.timerDuration = body.timerMinutes * 60;
    if (body.timerMinutes > 0) {
      patch.timerEndsAt = new Date(Date.now() + body.timerMinutes * 60 * 1000);
    } else {
      patch.timerEndsAt = null;
    }
  }

  const [updated] = await db.update(retros).set(patch).where(eq(retros.id, id)).returning();
  return NextResponse.json(updated);
}
