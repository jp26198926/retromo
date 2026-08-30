import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { retros, columns, retroParticipants } from "@/db/schema";
import { getSession } from "@/lib/session";
import { generateShareToken, randomColor, randomDisplayName } from "@/lib/utils";
import { eq } from "drizzle-orm";
import { getCurrentUserPlan, getPlanFeatures, hasActiveAccess } from "@/lib/plans";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const session = await getSession();

    const {
      title,
      topic,
      engagement = "anonymous",
      visibility = "regular",
      columns: cols = [],
      votesPerParticipant = 3,
      votesPerColumn = 3,
      votesPerCard = 3,
      secretVoting = true,
      timerDuration = 0,
      teamId = null,
    } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }
    if (!cols.length) {
      return NextResponse.json({ error: "At least one column is required" }, { status: 400 });
    }

    // Determine the effective plan for this retro based on the creator's subscription.
    // Anonymous (not-logged-in) users and free users get the "anonymous" plan retro.
    // Paid users with active access get their plan's features.
    // Platform admins are resolved to the Company plan by getCurrentUserPlan().
    let retroPlan: "anonymous" | "individual" | "company" = "anonymous";
    let privateRetrosAllowed = false;
    let advancedFacilitation = false;
    let configurableRetention = false;
    let zeroKnowledgeEncryption = false;
    let maxColumns = getPlanFeatures("anonymous").maxColumns;

    if (session?.user) {
      const plan = await getCurrentUserPlan();
      if (hasActiveAccess(plan)) {
        retroPlan = plan.plan;
        privateRetrosAllowed = plan.privateRetros;
        advancedFacilitation = plan.advancedFacilitation;
        configurableRetention = plan.configurableRetention;
        zeroKnowledgeEncryption = plan.zeroKnowledgeEncryption;
        maxColumns = plan.maxColumns;
      }
    }

    // Enforce the column limit — the free plan is capped at 3 columns per retro.
    // maxColumns === -1 means unlimited.
    if (maxColumns !== -1 && cols.length > maxColumns) {
      return NextResponse.json(
        {
          error: `The free plan is limited to ${maxColumns} columns per retrospective. Upgrade to add more.`,
        },
        { status: 403 }
      );
    }

    // Enforce private retros — only Individual/Company plans can create private retros
    const resolvedVisibility: "regular" | "private" =
      visibility === "private" ? "private" : "regular";
    if (resolvedVisibility === "private" && !privateRetrosAllowed) {
      return NextResponse.json(
        { error: "Private retrospectives are available on the Individual and Company plans. Upgrade to create a private retro." },
        { status: 403 }
      );
    }

    // Enforce advanced facilitation: moderation is a paid feature
    const moderated = body.moderated === true;
    if (moderated && !advancedFacilitation) {
      return NextResponse.json(
        { error: "Moderation is an advanced facilitation feature available on paid plans." },
        { status: 403 }
      );
    }

    // Configurable data retention — paid plans (Individual/Company) can set a custom
    // retention period. Anonymous plan is always 365 days. null = keep forever.
    let resolvedRetentionDays: number | null;
    if (retroPlan === "anonymous") {
      resolvedRetentionDays = 365;
    } else if (configurableRetention && body.retentionDays !== undefined && body.retentionDays !== null) {
      const rd = Number(body.retentionDays);
      // Allow 1-3650 days, or 0 / -1 for "forever"
      if (Number.isInteger(rd) && (rd === 0 || rd === -1 || (rd >= 1 && rd <= 3650))) {
        resolvedRetentionDays = rd === 0 || rd === -1 ? null : rd;
      } else {
        return NextResponse.json(
          { error: "Retention days must be a whole number between 1 and 3650, or 0 for forever." },
          { status: 400 }
        );
      }
    } else {
      // Paid plan but no custom value provided — keep forever
      resolvedRetentionDays = null;
    }

    // Zero-knowledge encryption — Company plan only. The password is never sent to
    // the server; only a boolean flag is stored so the board knows to prompt for it.
    const encryptionEnabled = body.encryptionEnabled === true;
    if (encryptionEnabled && !zeroKnowledgeEncryption) {
      return NextResponse.json(
        { error: "Zero-knowledge encryption is available on the Company plan only." },
        { status: 403 }
      );
    }

    const retroId = crypto.randomUUID();
    const now = new Date();

    const [retro] = await db
      .insert(retros)
      .values({
        id: retroId,
        title: title.trim(),
        topic: topic?.trim() || null,
        engagement,
        visibility: resolvedVisibility,
        votesPerParticipant,
        votesPerColumn,
        votesPerCard,
        secretVoting,
        moderated,
        timerDuration,
        teamId: teamId || null,
        ownerId: session?.user.id || null,
        plan: retroPlan,
        shareToken: generateShareToken(),
        retentionDays: resolvedRetentionDays,
        encryptionEnabled,
        timerEndsAt: timerDuration > 0 ? new Date(now.getTime() + timerDuration * 1000) : null,
      })
      .returning();

    // insert columns
    if (cols.length) {
      await db.insert(columns).values(
        cols.map((c: { name: string; description?: string; color: string }, i: number) => ({
          id: crypto.randomUUID(),
          retroId,
          name: c.name.trim() || `Column ${i + 1}`,
          description: c.description?.trim() || null,
          color: c.color || "#facc15",
          position: i,
        }))
      );
    }

    // add creator as participant + facilitator if logged in
    if (session?.user) {
      await db.insert(retroParticipants).values({
        id: crypto.randomUUID(),
        retroId,
        userId: session.user.id,
        displayName: session.user.name,
        color: randomColor(),
        isFacilitator: true,
      });
    }

    return NextResponse.json({ id: retro.id, shareToken: retro.shareToken });
  } catch (e) {
    console.error("[POST /api/retros]", e);
    return NextResponse.json({ error: "Failed to create retro" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ retros: [] });
    }
    const userRetros = await db.query.retros.findMany({
      where: eq(retros.ownerId, session.user.id),
      orderBy: (retros, { desc }) => [desc(retros.updatedAt)],
      limit: 50,
    });
    return NextResponse.json({ retros: userRetros });
  } catch (e) {
    console.error("[GET /api/retros]", e);
    return NextResponse.json({ error: "Failed to fetch retros" }, { status: 500 });
  }
}
