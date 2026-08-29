import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { teams, teamMembers } from "@/db/schema";
import { getSession } from "@/lib/session";
import { eq } from "drizzle-orm";

// POST — create a team
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "You must be signed in to create a team" }, { status: 401 });
    }

    const body = await req.json();
    const { name, color = "#6366f1" } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Team name is required" }, { status: 400 });
    }

    const teamId = crypto.randomUUID();
    const [team] = await db
      .insert(teams)
      .values({
        id: teamId,
        name: name.trim(),
        color,
        ownerId: session.user.id,
      })
      .returning();

    // add creator as owner member
    await db.insert(teamMembers).values({
      id: crypto.randomUUID(),
      teamId,
      userId: session.user.id,
      role: "owner",
    });

    return NextResponse.json({ team });
  } catch (e) {
    console.error("[POST /api/teams]", e);
    return NextResponse.json({ error: "Failed to create team" }, { status: 500 });
  }
}

// GET — list teams the current user belongs to
export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ teams: [] });
    }

    const userTeams = await db.query.teamMembers.findMany({
      where: eq(teamMembers.userId, session.user.id),
      with: {
        team: {
          with: {
            members: { with: { user: true } },
          },
        },
      },
    });

    const result = userTeams.map((tm) => ({
      ...tm.team,
      myRole: tm.role,
      memberCount: tm.team.members.length,
    }));

    return NextResponse.json({ teams: result });
  } catch (e) {
    console.error("[GET /api/teams]", e);
    return NextResponse.json({ error: "Failed to fetch teams" }, { status: 500 });
  }
}
