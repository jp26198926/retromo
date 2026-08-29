import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { user, billingHistory } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/session";

// Cancel the current user's subscription.
// The subscription remains active until subscriptionCurrentPeriodEnd (non-refundable).
// After it expires, the plan reverts to "anonymous".
export async function POST() {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "You must be logged in" }, { status: 401 });
    }

    const currentUser = await db.query.user.findFirst({ where: eq(user.id, session.user.id) });
    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (currentUser.subscriptionStatus !== "active" && currentUser.subscriptionStatus !== "cancelled") {
      return NextResponse.json({ error: "No active subscription to cancel" }, { status: 400 });
    }

    const now = new Date();
    await db
      .update(user)
      .set({
        subscriptionStatus: "cancelled",
        subscriptionCancelledAt: now,
        updatedAt: now,
      })
      .where(eq(user.id, session.user.id));

    // Record cancellation in billing history
    await db.insert(billingHistory).values({
      id: crypto.randomUUID(),
      userId: session.user.id,
      plan: currentUser.subscriptionPlan as any,
      amount: "0.00",
      currency: "USD",
      status: "cancelled",
      type: "cancel",
      description: `Subscription cancelled — access remains until ${
        currentUser.subscriptionCurrentPeriodEnd
          ? new Date(currentUser.subscriptionCurrentPeriodEnd).toLocaleDateString()
          : "end of billing period"
      } (non-refundable)`,
    });

    return NextResponse.json({
      success: true,
      status: "cancelled",
      currentPeriodEnd: currentUser.subscriptionCurrentPeriodEnd,
      message: "Subscription cancelled. You will keep access until your current period ends.",
    });
  } catch (e) {
    console.error("[POST /api/subscription/cancel]", e);
    return NextResponse.json({ error: "Failed to cancel subscription" }, { status: 500 });
  }
}
