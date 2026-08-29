import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { user, billingHistory } from "@/db/schema";
import { eq, desc, count } from "drizzle-orm";
import { getAdminSession, isAdminEmail } from "@/lib/admin";

// GET — list all users with their subscription info (admin only, paginated)
export async function GET(req: NextRequest) {
  try {
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") || "50")));
    const offset = (page - 1) * limit;

    const users = await db.query.user.findMany({
      orderBy: (user, { desc }) => [desc(user.createdAt)],
      limit,
      offset,
    });

    const [{ value: total }] = await db.select({ value: count() }).from(user);

    return NextResponse.json({
      users: users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        subscriptionPlan: u.subscriptionPlan,
        subscriptionStatus: u.subscriptionStatus,
        subscriptionCurrentPeriodEnd: u.subscriptionCurrentPeriodEnd,
        subscriptionCancelledAt: u.subscriptionCancelledAt,
        createdAt: u.createdAt,
      })),
      total,
      page,
      limit,
    });
  } catch (e) {
    console.error("[GET /api/admin/users]", e);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

// PATCH — update a user's role or plan (admin only)
export async function PATCH(req: NextRequest) {
  try {
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const body = await req.json();
    const { userId, role, plan, status } = body;
    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }

    // Don't allow demoting the configured admin email
    const target = await db.query.user.findFirst({ where: eq(user.id, userId) });
    if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

    if (isAdminEmail(target.email) && role && role !== "admin") {
      return NextResponse.json(
        { error: "Cannot change the role of the configured admin (ADMIN_EMAIL)" },
        { status: 400 }
      );
    }

    const patch: Record<string, unknown> = { updatedAt: new Date() };
    if (role === "admin" || role === "user") patch.role = role;
    if (plan === "anonymous" || plan === "individual" || plan === "company") {
      patch.subscriptionPlan = plan;
    }
    if (typeof status === "string") patch.subscriptionStatus = status;

    const [updated] = await db.update(user).set(patch).where(eq(user.id, userId)).returning();

    // Record a billing-history note if the plan was changed by admin
    if (plan && plan !== target.subscriptionPlan) {
      await db.insert(billingHistory).values({
        id: crypto.randomUUID(),
        userId,
        plan: plan as any,
        amount: "0.00",
        currency: "USD",
        status: "completed",
        type: "admin_change",
        previousPlan: target.subscriptionPlan as any,
        description: `Plan changed to ${plan} by admin (${admin.user.email})`,
      });
    }

    return NextResponse.json({
      id: updated.id,
      name: updated.name,
      email: updated.email,
      role: updated.role,
      subscriptionPlan: updated.subscriptionPlan,
      subscriptionStatus: updated.subscriptionStatus,
    });
  } catch (e) {
    console.error("[PATCH /api/admin/users]", e);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}
