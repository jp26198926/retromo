import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { teams, teamMembers, teamInvitations, user } from "@/db/schema";
import { getSession } from "@/lib/session";
import { eq, and } from "drizzle-orm";
import { sendTeamInvitationEmail, isEmailConfigured } from "@/lib/email";
import { getAppSettings } from "@/lib/app-settings";

// POST — add a member to a team (by email). Owner only.
// If the user already has an account, they're added directly.
// If not, a team invitation is created and an email is sent with
// an accept link (and a registration link for users without an account).
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

    const normalizedEmail = email.trim().toLowerCase();

    // Look up the team (for the email body)
    const team = await db.query.teams.findFirst({ where: eq(teams.id, id) });
    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Check if the invited user already has an account
    const targetUser = await db.query.user.findFirst({
      where: eq(user.email, normalizedEmail),
    });

    if (targetUser) {
      // User exists — add them directly as a member
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

      return NextResponse.json({
        ok: true,
        added: true,
        userId: targetUser.id,
        message: "Member added successfully.",
      });
    }

    // User doesn't exist — create a team invitation and send an email
    // Check if there's already a pending invitation for this email
    const existingInvite = await db.query.teamInvitations.findFirst({
      where: and(
        eq(teamInvitations.teamId, id),
        eq(teamInvitations.email, normalizedEmail),
        eq(teamInvitations.status, "pending")
      ),
    });
    if (existingInvite) {
      return NextResponse.json({
        ok: true,
        invited: true,
        message: "An invitation has already been sent to this email.",
      });
    }

    // Generate a unique token
    const token = crypto.randomUUID();

    await db.insert(teamInvitations).values({
      id: crypto.randomUUID(),
      teamId: id,
      email: normalizedEmail,
      token,
      invitedBy: session.user.id,
      role,
      status: "pending",
    });

    // Build the invitation URLs
    const appSettings = await getAppSettings();
    const baseUrl = process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const acceptUrl = `${baseUrl}/teams/invite?token=${token}`;
    const signUpUrl = `${baseUrl}/sign-up?redirect=${encodeURIComponent(acceptUrl)}`;

    // Try to send the invitation email
    const emailResult = await sendTeamInvitationEmail({
      to: normalizedEmail,
      teamName: team.name,
      inviterName: session.user.name,
      acceptUrl,
      signUpUrl,
      hasAccount: false,
    });

    if (!emailResult.sent) {
      // SMTP not configured — still return success since the invitation was created.
      // Include the accept URL in the response so it can be shown in the UI for manual sharing.
      return NextResponse.json({
        ok: true,
        invited: true,
        message: `Invitation created. SMTP is not configured, so no email was sent. Share this link: ${acceptUrl}`,
        inviteUrl: acceptUrl,
        emailNotConfigured: true,
      });
    }

    return NextResponse.json({
      ok: true,
      invited: true,
      message: `Invitation sent to ${normalizedEmail}. They will receive an email with a link to join the team.`,
    });
  } catch (e) {
    console.error("[POST /api/teams/[id]/members]", e);
    return NextResponse.json({ error: "Failed to add member" }, { status: 500 });
  }
}

// DELETE — remove a member. Only the team owner (host/creator) can remove members.
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

    if (!myMember || myMember.role !== "owner") {
      return NextResponse.json({ error: "Only the team owner can remove members" }, { status: 403 });
    }

    // Prevent the owner from removing themselves via this endpoint
    if (userIdToRemove === session.user.id) {
      return NextResponse.json({ error: "Transfer ownership before leaving. Delete the team instead." }, { status: 400 });
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
