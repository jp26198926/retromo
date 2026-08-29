import { NextRequest, NextResponse } from "next/server";
import { capturePayPalOrder } from "@/lib/paypal/orders";
import { db } from "@/db";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/session";

// Capture a PayPal order and activate the user's subscription
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "You must be logged in to subscribe" }, { status: 401 });
    }

    const body = await req.json();
    const { orderId } = body as { orderId?: string };

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

    // Update user subscription — set plan to active for 1 month
    const periodEnd = new Date();
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    await db
      .update(user)
      .set({
        subscriptionPlan: result.plan,
        subscriptionStatus: "active",
        paypalSubscriptionId: result.id,
        subscriptionCurrentPeriodEnd: periodEnd,
        updatedAt: new Date(),
      })
      .where(eq(user.id, session.user.id));

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
