import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { user, billingHistory, retros, teams, teamMembers } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getAdminSession } from "@/lib/admin";

// GET — full detail of a single user (profile + billing history + their retros)
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { id } = await params;
    const u = await db.query.user.findFirst({ where: eq(user.id, id) });
    if (!u) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const history = await db.query.billingHistory.findMany({
      where: eq(billingHistory.userId, id),
      orderBy: [desc(billingHistory.createdAt)],
      limit: 100,
    });

    const userRetros = await db.query.retros.findMany({
      where: eq(retros.ownerId, id),
      orderBy: [desc(retros.updatedAt)],
      limit: 50,
    });

    const userTeams = await db.query.teamMembers.findMany({
      where: eq(teamMembers.userId, id),
      with: { team: true },
    });

    return NextResponse.json({
      user: {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        image: u.image,
        subscriptionPlan: u.subscriptionPlan,
        subscriptionStatus: u.subscriptionStatus,
        subscriptionCurrentPeriodEnd: u.subscriptionCurrentPeriodEnd,
        subscriptionCancelledAt: u.subscriptionCancelledAt,
        paypalSubscriptionId: u.paypalSubscriptionId,
        createdAt: u.createdAt,
      },
      billingHistory: history,
      retros: userRetros,
      teams: userTeams.map((tm) => ({ ...tm.team, myRole: tm.role })),
    });
  } catch (e) {
    console.error("[GET /api/admin/users/[id]]", e);
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 });
  }
}
