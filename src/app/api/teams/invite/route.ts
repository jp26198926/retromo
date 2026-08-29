import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { teamInvitations, teamMembers, teams } from "@/db/schema";
import { getSession } from "@/lib/session";
import { eq, and } from "drizzle-orm";

// GET — look up an invitation by token (to show invitation details before accepting)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");
    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 400 });
    }

    const invitation = await db.query.teamInvitations.findFirst({
      where: eq(teamInvitations.token, token),
    });

    if (!invitation) {
      return NextResponse.json({ error: "Invitation not found or has expired" }, { status: 404 });
    }

    if (invitation.status === "accepted") {
      return NextResponse.json({ error: "This invitation has already been accepted", alreadyAccepted: true }, { status: 410 });
    }

    const team = await db.query.teams.findFirst({ where: eq(teams.id, invitation.teamId) });
    if (!team) {
      return NextResponse.json({ error: "Team no longer exists" }, { status: 404 });
    }

    return NextResponse.json({
      teamName: team.name,
      teamColor: team.color,
      email: invitation.email,
      role: invitation.role,
      status: invitation.status,
    });
  } catch (e) {
    console.error("[GET /api/teams/invite]", e);
    return NextResponse.json({ error: "Failed to look up invitation" }, { status: 500 });
  }
}

// POST — accept an invitation by token. The user must be logged in.
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "You must be signed in to accept an invitation", requiresAuth: true }, { status: 401 });
    }

    const body = await req.json();
    const { token } = body;
    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 400 });
    }

    const invitation = await db.query.teamInvitations.findFirst({
      where: eq(teamInvitations.token, token),
    });

    if (!invitation) {
      return NextResponse.json({ error: "Invitation not found or has expired" }, { status: 404 });
    }

    if (invitation.status === "accepted") {
      return NextResponse.json({ error: "This invitation has already been accepted" }, { status: 410 });
    }

    // Check if the user is already a member
    const existing = await db.query.teamMembers.findFirst({
      where: and(eq(teamMembers.teamId, invitation.teamId), eq(teamMembers.userId, session.user.id)),
    });

    if (existing) {
      // Mark as accepted and return
      await db
        .update(teamInvitations)
        .set({ status: "accepted", acceptedAt: new Date() })
        .where(eq(teamInvitations.token, token));
      return NextResponse.json({ ok: true, alreadyMember: true, teamId: invitation.teamId });
    }

    // Add the user as a team member
    await db.insert(teamMembers).values({
      id: crypto.randomUUID(),
      teamId: invitation.teamId,
      userId: session.user.id,
      role: invitation.role,
    });

    // Mark the invitation as accepted
    await db
      .update(teamInvitations)
      .set({ status: "accepted", acceptedAt: new Date() })
      .where(eq(teamInvitations.token, token));

    return NextResponse.json({ ok: true, teamId: invitation.teamId });
  } catch (e) {
    console.error("[POST /api/teams/invite]", e);
    return NextResponse.json({ error: "Failed to accept invitation" }, { status: 500 });
  }
}
