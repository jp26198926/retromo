import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { account, retros, retroParticipants, teamMembers, user } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { getSession } from "@/lib/session";
import { isAdmin } from "@/lib/admin";
import { getCurrentUserPlan, hasActiveAccess } from "@/lib/plans";

/**
 * GET /api/profile — the signed-in user's profile.
 *
 * Returns the account details plus a little context the page needs:
 *  - `hasPassword`  : whether a credential account exists. Users who signed up
 *                     with Google/GitHub have no password, so the page hides
 *                     the change-password form for them.
 *  - `providers`    : the social providers linked to this account.
 *  - `stats`        : lightweight activity counters.
 */
export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const u = await db.query.user.findFirst({ where: eq(user.id, session.user.id) });
    if (!u) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Linked accounts tell us how this user can sign in.
    const accounts = await db.query.account.findMany({
      where: eq(account.userId, u.id),
    });
    // better-auth stores email+password logins with providerId "credential"
    const hasPassword = accounts.some(
      (a) => a.providerId === "credential" && !!a.password
    );
    const providers = accounts
      .filter((a) => a.providerId !== "credential")
      .map((a) => a.providerId);

    const [plan, admin] = await Promise.all([getCurrentUserPlan(), isAdmin()]);

    // Activity counters — cheap aggregate queries
    const [retroRows, participantRows, teamRows] = await Promise.all([
      db
        .select({ count: sql<number>`COUNT(*)::int` })
        .from(retros)
        .where(eq(retros.ownerId, u.id)),
      db
        .select({ count: sql<number>`COUNT(*)::int` })
        .from(retroParticipants)
        .where(eq(retroParticipants.userId, u.id)),
      db
        .select({ count: sql<number>`COUNT(*)::int` })
        .from(teamMembers)
        .where(eq(teamMembers.userId, u.id)),
    ]);

    return NextResponse.json({
      profile: {
        id: u.id,
        name: u.name,
        email: u.email,
        image: u.image,
        emailVerified: u.emailVerified,
        role: u.role,
        createdAt: u.createdAt.toISOString(),
      },
      auth: {
        hasPassword,
        providers,
      },
      plan: {
        // The plan actually in force (admins are resolved to Company)
        effectivePlan: plan.plan,
        status: plan.status,
        isActive: hasActiveAccess(plan),
        isAdminOverride: !!plan.isAdminOverride,
        currentPeriodEnd: plan.currentPeriodEnd
          ? new Date(plan.currentPeriodEnd).toISOString()
          : null,
      },
      isAdmin: admin,
      stats: {
        retrosCreated: retroRows[0]?.count ?? 0,
        retrosJoined: participantRows[0]?.count ?? 0,
        teams: teamRows[0]?.count ?? 0,
      },
    });
  } catch (e) {
    console.error("[GET /api/profile]", e);
    return NextResponse.json({ error: "Failed to load profile" }, { status: 500 });
  }
}

/**
 * PATCH /api/profile — update the signed-in user's editable profile fields.
 *
 * Only `name` and `image` can be changed here. Email changes and password
 * changes are handled by better-auth so its verification and session-revocation
 * rules are respected.
 */
export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const patch: { name?: string; image?: string | null; updatedAt: Date } = {
      updatedAt: new Date(),
    };

    if (body.name !== undefined) {
      const name = String(body.name).trim();
      if (name.length < 2) {
        return NextResponse.json(
          { error: "Name must be at least 2 characters." },
          { status: 400 }
        );
      }
      if (name.length > 60) {
        return NextResponse.json(
          { error: "Name must be 60 characters or fewer." },
          { status: 400 }
        );
      }
      patch.name = name;
    }

    if (body.image !== undefined) {
      const raw = body.image === null ? "" : String(body.image).trim();
      if (raw === "") {
        patch.image = null;
      } else {
        // Only allow http(s) URLs so we never render arbitrary schemes
        let parsed: URL;
        try {
          parsed = new URL(raw);
        } catch {
          return NextResponse.json(
            { error: "Avatar must be a valid URL." },
            { status: 400 }
          );
        }
        if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
          return NextResponse.json(
            { error: "Avatar URL must start with http:// or https://" },
            { status: 400 }
          );
        }
        patch.image = parsed.toString();
      }
    }

    if (patch.name === undefined && patch.image === undefined) {
      return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
    }

    const [updated] = await db
      .update(user)
      .set(patch)
      .where(eq(user.id, session.user.id))
      .returning();

    return NextResponse.json({
      ok: true,
      profile: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        image: updated.image,
      },
    });
  } catch (e) {
    console.error("[PATCH /api/profile]", e);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
