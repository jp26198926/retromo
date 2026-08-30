import { NextResponse } from "next/server";
import { db } from "@/db";
import { user, billingHistory } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getSession } from "@/lib/session";
import { hasActiveAccess, getPlanFeatures } from "@/lib/plans";

// Get current user's subscription status + billing history
export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const u = await db.query.user.findFirst({ where: eq(user.id, session.user.id) });
    if (!u) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Fetch billing history (most recent first)
    const history = await db.query.billingHistory.findMany({
      where: eq(billingHistory.userId, session.user.id),
      orderBy: [desc(billingHistory.createdAt)],
      limit: 50,
    });

    const features = getPlanFeatures(u.subscriptionPlan);
    const activeAccess = hasActiveAccess({
      ...features,
      status: u.subscriptionStatus,
      isActive: u.subscriptionStatus === "active",
      currentPeriodEnd: u.subscriptionCurrentPeriodEnd,
    });

    const isCancelled = u.subscriptionStatus === "cancelled";
    const periodEnd = u.subscriptionCurrentPeriodEnd
      ? new Date(u.subscriptionCurrentPeriodEnd)
      : null;
    // If cancelled and period has expired, the effective plan is anonymous
    const effectivePlanKey =
      isCancelled && periodEnd && periodEnd < new Date()
        ? "anonymous"
        : u.subscriptionPlan;
    // The effective features reflect the effective plan
    const effectiveFeatures = getPlanFeatures(effectivePlanKey);

    return NextResponse.json({
      subscriptionPlan: u.subscriptionPlan,
      effectivePlan: effectivePlanKey,
      subscriptionStatus: u.subscriptionStatus,
      paypalSubscriptionId: u.paypalSubscriptionId,
      subscriptionCurrentPeriodEnd: u.subscriptionCurrentPeriodEnd,
      subscriptionCancelledAt: u.subscriptionCancelledAt,
      hasActiveAccess: activeAccess,
      // Full plan feature set for the effective plan (used by the setup wizard
      // and other UI to know which features to show)
      plan: {
        ...effectiveFeatures,
        plan: effectivePlanKey,
        status: u.subscriptionStatus,
        isActive: activeAccess,
        currentPeriodEnd: u.subscriptionCurrentPeriodEnd,
      },
      billingHistory: history.map((h) => ({
        id: h.id,
        plan: h.plan,
        amount: h.amount,
        currency: h.currency,
        status: h.status,
        type: h.type,
        previousPlan: h.previousPlan,
        description: h.description,
        paypalOrderId: h.paypalOrderId,
        createdAt: h.createdAt,
      })),
    });
  } catch (e) {
    console.error("[GET /api/subscription]", e);
    return NextResponse.json({ error: "Failed to fetch subscription" }, { status: 500 });
  }
}
