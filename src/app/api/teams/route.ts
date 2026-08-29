import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { teams, teamMembers } from "@/db/schema";
import { getSession } from "@/lib/session";
import { eq, count } from "drizzle-orm";
import { getCurrentUserPlan, hasActiveAccess } from "@/lib/plans";

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

    // Enforce plan-based team limit.
    // anonymous = 0 teams, individual = 3 teams, company = unlimited (-1)
    const plan = await getCurrentUserPlan();
    if (!hasActiveAccess(plan)) {
      return NextResponse.json(
        { error: "Your subscription has expired. Upgrade to a paid plan to manage teams." },
        { status: 403 }
      );
    }
    if (plan.maxTeams === 0) {
      return NextResponse.json(
        { error: "The Anonymous plan does not include team management. Upgrade to Individual or Company to create teams." },
        { status: 403 }
      );
    }
    if (plan.maxTeams > 0) {
      const [{ value: teamCount }] = await db
        .select({ value: count() })
        .from(teamMembers)
        .where(eq(teamMembers.userId, session.user.id));
      if (teamCount >= plan.maxTeams) {
        return NextResponse.json(
          { error: `Your plan allows up to ${plan.maxTeams} team${plan.maxTeams === 1 ? "" : "s"}. Upgrade to create more.` },
          { status: 403 }
        );
      }
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
