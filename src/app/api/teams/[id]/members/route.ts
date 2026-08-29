import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { teams, teamMembers, user } from "@/db/schema";
import { getSession } from "@/lib/session";
import { eq, and } from "drizzle-orm";

// POST — add a member to a team (by email). Owner only.
export async function POST(
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
      return NextResponse.json({ error: "Only the team owner can add members" }, { status: 403 });
    }

    const body = await req.json();
    const { email, role = "member" } = body;
    if (!email?.trim()) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const targetUser = await db.query.user.findFirst({
      where: eq(user.email, email.trim().toLowerCase()),
    });
    if (!targetUser) {
      return NextResponse.json({ error: "No user found with that email. They must sign up first." }, { status: 404 });
    }

    const existing = await db.query.teamMembers.findFirst({
      where: and(eq(teamMembers.teamId, id), eq(teamMembers.userId, targetUser.id)),
    });
    if (existing) {
      return NextResponse.json({ error: "User is already a member" }, { status: 409 });
    }

    await db.insert(teamMembers).values({
      id: crypto.randomUUID(),
      teamId: id,
      userId: targetUser.id,
      role,
    });

    return NextResponse.json({ ok: true, userId: targetUser.id });
  } catch (e) {
    console.error("[POST /api/teams/[id]/members]", e);
    return NextResponse.json({ error: "Failed to add member" }, { status: 500 });
  }
}

// DELETE — remove a member. Owner can remove anyone; members can remove themselves.
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const userIdToRemove = searchParams.get("userId");

    if (!userIdToRemove) {
      return NextResponse.json({ error: "userId query param is required" }, { status: 400 });
    }

    const myMember = await db.query.teamMembers.findFirst({
      where: and(eq(teamMembers.teamId, id), eq(teamMembers.userId, session.user.id)),
    });

    const isOwner = myMember?.role === "owner";
    const isSelf = userIdToRemove === session.user.id;

    if (!isOwner && !isSelf) {
      return NextResponse.json({ error: "You can only remove yourself unless you are the owner" }, { status: 403 });
    }

    // prevent owner from removing themselves if they're the only owner
    if (isOwner && isSelf) {
      const ownerId = (await db.query.teams.findFirst({ where: eq(teams.id, id) }))?.ownerId;
      if (ownerId === session.user.id) {
        return NextResponse.json({ error: "Transfer ownership before leaving. Delete the team instead." }, { status: 400 });
      }
    }

    await db
      .delete(teamMembers)
      .where(and(eq(teamMembers.teamId, id), eq(teamMembers.userId, userIdToRemove)));

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[DELETE /api/teams/[id]/members]", e);
    return NextResponse.json({ error: "Failed to remove member" }, { status: 500 });
  }
}
