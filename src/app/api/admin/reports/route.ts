import { NextResponse } from "next/server";
import { db } from "@/db";
import { user, billingHistory, retros, teams, actionPoints, cards } from "@/db/schema";
import { eq, gt, and, sql, count } from "drizzle-orm";
import { getAdminSession } from "@/lib/admin";

// GET — aggregate reports / stats for the admin dashboard
export async function GET() {
  try {
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    // Total users
    const [{ value: totalUsers }] = await db.select({ value: count() }).from(user);

    // Active paying subscribers (status = active)
    const [{ value: activeSubs }] = await db
      .select({ value: count() })
      .from(user)
      .where(eq(user.subscriptionStatus, "active"));

    // Subscribers by plan
    const individualCount = await db
      .select({ value: count() })
      .from(user)
      .where(and(eq(user.subscriptionPlan, "individual"), eq(user.subscriptionStatus, "active")));
    const companyCount = await db
      .select({ value: count() })
      .from(user)
      .where(and(eq(user.subscriptionPlan, "company"), eq(user.subscriptionStatus, "active")));

    // Cancelled subscriptions
    const [{ value: cancelledSubs }] = await db
      .select({ value: count() })
      .from(user)
      .where(eq(user.subscriptionStatus, "cancelled"));

    // Total revenue — sum of completed billing-history amounts for subscribe/change_plan.
    // The amount column is stored as text, so we cast to numeric before summing.
    const revenueRows = await db
      .select({
        total: sql<string>`COALESCE(SUM(${billingHistory.amount}::numeric), 0)::text`,
      })
      .from(billingHistory)
      .where(
        and(
          eq(billingHistory.status, "completed"),
          sql`${billingHistory.type} IN ('subscribe', 'change_plan')`
        )
      );
    const totalRevenue = revenueRows[0]?.total || "0.00";

    // This-month revenue
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const monthRevenueRows = await db
      .select({
        total: sql<string>`COALESCE(SUM(${billingHistory.amount}::numeric), 0)::text`,
      })
      .from(billingHistory)
      .where(
        and(
          eq(billingHistory.status, "completed"),
          sql`${billingHistory.type} IN ('subscribe', 'change_plan')`,
          gt(billingHistory.createdAt, monthStart)
        )
      );
    const monthRevenue = monthRevenueRows[0]?.total || "0.00";

    // Total transactions
    const [{ value: totalTransactions }] = await db.select({ value: count() }).from(billingHistory);

    // Retros / teams / cards / action points counts
    const [{ value: totalRetros }] = await db.select({ value: count() }).from(retros);
    const [{ value: totalTeams }] = await db.select({ value: count() }).from(teams);
    const [{ value: totalCards }] = await db.select({ value: count() }).from(cards);
    const [{ value: totalActionPoints }] = await db.select({ value: count() }).from(actionPoints);

    // Active retros (not archived)
    const [{ value: activeRetros }] = await db
      .select({ value: count() })
      .from(retros)
      .where(eq(retros.archived, false));

    return NextResponse.json({
      users: {
        total: totalUsers ?? 0,
        activeSubs: activeSubs ?? 0,
        cancelledSubs: cancelledSubs ?? 0,
        byPlan: {
          individual: individualCount[0]?.value || 0,
          company: companyCount[0]?.value || 0,
        },
      },
      revenue: {
        total: totalRevenue,
        thisMonth: monthRevenue,
        totalTransactions: totalTransactions ?? 0,
      },
      content: {
        totalRetros: totalRetros ?? 0,
        activeRetros: activeRetros ?? 0,
        totalTeams: totalTeams ?? 0,
        totalCards: totalCards ?? 0,
        totalActionPoints: totalActionPoints ?? 0,
      },
    });
  } catch (e) {
    console.error("[GET /api/admin/reports]", e);
    return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 });
  }
}
