import { NextRequest, NextResponse } from "next/server";
import { capturePayPalOrder } from "@/lib/paypal/orders";
import { db } from "@/db";
import { user, billingHistory } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/session";

// Capture a PayPal order and activate the user's subscription.
// Body: { orderId, type?: "subscribe" | "change_plan" }
// The subscription is recurring by default — we set a 1-month period and the
// user keeps access until the period ends. Renewal is handled by the next
// payment (or by PayPal billing agreements in production).
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "You must be logged in to subscribe" }, { status: 401 });
    }

    const body = await req.json();
    const { orderId, type = "subscribe" } = body as { orderId?: string; type?: string };

    if (!orderId) {
      return NextResponse.json({ error: "orderId required" }, { status: 400 });
    }

    const result = await capturePayPalOrder(orderId);

    if (result.status !== "COMPLETED") {
      return NextResponse.json({ error: `Payment not completed (status: ${result.status})` }, { status: 400 });
    }

    if (!result.plan) {
      return NextResponse.json({ error: "Could not determine plan from payment amount" }, { status: 400 });
    }

    // Look up the current user to get their existing plan (for change-plan tracking)
    const currentUser = await db.query.user.findFirst({ where: eq(user.id, session.user.id) });
    const previousPlan = currentUser?.subscriptionPlan || "anonymous";

    // Set subscription active for 1 month (recurring)
    const periodEnd = new Date();
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    await db
      .update(user)
      .set({
        subscriptionPlan: result.plan,
        subscriptionStatus: "active",
        paypalSubscriptionId: result.id,
        subscriptionCurrentPeriodEnd: periodEnd,
        subscriptionCancelledAt: null,
        updatedAt: new Date(),
      })
      .where(eq(user.id, session.user.id));

    // Record in billing history
    await db.insert(billingHistory).values({
      id: crypto.randomUUID(),
      userId: session.user.id,
      paypalOrderId: result.id,
      plan: result.plan,
      amount: result.amount || (result.plan === "individual" ? "10.00" : "20.00"),
      currency: "USD",
      status: "completed",
      type: type === "change_plan" ? "change_plan" : "subscribe",
      previousPlan: type === "change_plan" ? (previousPlan as any) : null,
      description:
        type === "change_plan"
          ? `Plan changed from ${previousPlan} to ${result.plan}`
          : `${result.plan} subscription — 1 month (recurring)`,
    });

    return NextResponse.json({
      success: true,
      plan: result.plan,
      status: result.status,
      currentPeriodEnd: periodEnd.toISOString(),
    });
  } catch (e) {
    console.error("[POST /api/paypal/capture-order]", e);
    const message = e instanceof Error ? e.message : "Failed to capture PayPal order";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
