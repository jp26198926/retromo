import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { teams, teamMembers, retros, actionPoints } from "@/db/schema";
import { getSession } from "@/lib/session";
import { eq, and } from "drizzle-orm";

// GET — team detail with members, retros, action points
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    const { id } = await params;

    const team = await db.query.teams.findFirst({
      where: eq(teams.id, id),
      with: {
        members: {
          with: { user: true },
        },
      },
    });

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // membership check
    const myMember = session?.user
      ? await db.query.teamMembers.findFirst({
          where: and(eq(teamMembers.teamId, id), eq(teamMembers.userId, session.user.id)),
        })
      : null;

    const teamRetros = await db.query.retros.findMany({
      where: eq(retros.teamId, id),
      orderBy: (retros, { desc }) => [desc(retros.updatedAt)],
      limit: 50,
    });

    // action points across team retros
    const retroIds = teamRetros.map((r) => r.id);
    let teamActionPoints: typeof actionPoints.$inferSelect[] = [];
    if (retroIds.length) {
      const all = await db.query.actionPoints.findMany({
        with: { retro: true },
      });
      teamActionPoints = all.filter((ap) => ap.retro && retroIds.includes(ap.retro.id));
    }

    // flatten members out of team for easier frontend access
    const { members, ...teamFields } = team;

    return NextResponse.json({
      team: teamFields,
      members,
      myRole: myMember?.role || null,
      isMember: !!myMember,
      retros: teamRetros,
      actionPoints: teamActionPoints,
    });
  } catch (e) {
    console.error("[GET /api/teams/[id]]", e);
    return NextResponse.json({ error: "Failed to fetch team" }, { status: 500 });
  }
}

// PATCH — update team (name, color) — owner only
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

    const member = await db.query.teamMembers.findFirst({
      where: and(eq(teamMembers.teamId, id), eq(teamMembers.userId, session.user.id)),
    });
    if (!member || member.role !== "owner") {
      return NextResponse.json({ error: "Only the team owner can update the team" }, { status: 403 });
    }

    const body = await req.json();
    const updates: { name?: string; color?: string } = {};
    if (body.name?.trim()) updates.name = body.name.trim();
    if (body.color) updates.color = body.color;

    const [updated] = await db
      .update(teams)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(teams.id, id))
      .returning();

    return NextResponse.json({ team: updated });
  } catch (e) {
    console.error("[PATCH /api/teams/[id]]", e);
    return NextResponse.json({ error: "Failed to update team" }, { status: 500 });
  }
}

// DELETE — delete team — owner only
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;

    const member = await db.query.teamMembers.findFirst({
      where: and(eq(teamMembers.teamId, id), eq(teamMembers.userId, session.user.id)),
    });
    if (!member || member.role !== "owner") {
      return NextResponse.json({ error: "Only the team owner can delete the team" }, { status: 403 });
    }

    await db.delete(teams).where(eq(teams.id, id));
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[DELETE /api/teams/[id]]", e);
    return NextResponse.json({ error: "Failed to delete team" }, { status: 500 });
  }
}
