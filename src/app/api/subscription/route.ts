import { NextResponse } from "next/server";
import { db } from "@/db";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/session";

// Get current user's subscription status
export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const u = await db.query.user.findFirst({ where: eq(user.id, session.user.id) });
    if (!u) return NextResponse.json({ error: "User not found" }, { status: 404 });

    return NextResponse.json({
      subscriptionPlan: u.subscriptionPlan,
      subscriptionStatus: u.subscriptionStatus,
      paypalSubscriptionId: u.paypalSubscriptionId,
      subscriptionCurrentPeriodEnd: u.subscriptionCurrentPeriodEnd,
    });
  } catch (e) {
    console.error("[GET /api/subscription]", e);
    return NextResponse.json({ error: "Failed to fetch subscription" }, { status: 500 });
  }
}
