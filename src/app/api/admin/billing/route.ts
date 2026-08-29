import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { billingHistory, user } from "@/db/schema";
import { eq, desc, count } from "drizzle-orm";
import { getAdminSession } from "@/lib/admin";

// GET — list all billing transactions across all users (admin only, paginated)
export async function GET(req: NextRequest) {
  try {
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get("page") || "1"));
    const limit = Math.min(200, Math.max(1, Number(searchParams.get("limit") || "100")));
    const offset = (page - 1) * limit;

    const records = await db.query.billingHistory.findMany({
      orderBy: [desc(billingHistory.createdAt)],
      limit,
      offset,
      with: {
        user: true,
      },
    });

    const [{ value: total }] = await db.select({ value: count() }).from(billingHistory);

    return NextResponse.json({
      transactions: records.map((r) => ({
        id: r.id,
        userId: r.userId,
        userName: r.user?.name || null,
        userEmail: r.user?.email || null,
        plan: r.plan,
        amount: r.amount,
        currency: r.currency,
        status: r.status,
        type: r.type,
        previousPlan: r.previousPlan,
        description: r.description,
        paypalOrderId: r.paypalOrderId,
        createdAt: r.createdAt,
      })),
      total,
      page,
      limit,
    });
  } catch (e) {
    console.error("[GET /api/admin/billing]", e);
    return NextResponse.json({ error: "Failed to fetch billing" }, { status: 500 });
  }
}
