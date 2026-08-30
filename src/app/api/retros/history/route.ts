import { NextResponse } from "next/server";
import { db } from "@/db";
import { retros, retroParticipants, teams } from "@/db/schema";
import { getSession } from "@/lib/session";
import { eq, or, desc, asc, sql, and } from "drizzle-orm";

// GET /api/retros/history — returns retros the user created OR participated in
// Supports query params: search, plan, teamId, sortBy, sortDir, page, pageSize
export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    const url = new URL(req.url);
    const search = url.searchParams.get("search")?.trim().toLowerCase() || "";
    const planFilter = url.searchParams.get("plan") || "";
    const teamFilter = url.searchParams.get("teamId") || "";
    const roleFilter = url.searchParams.get("role") || ""; // "owner" | "participant" | ""
    // Archived retros are hidden by default; the list page has a toggle that
    // sets includeArchived=true to bring them back into view.
    const includeArchived = url.searchParams.get("includeArchived") === "true";
    const sortBy = url.searchParams.get("sortBy") || "updatedAt";
    const sortDir = url.searchParams.get("sortDir") || "desc";
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(url.searchParams.get("pageSize") || "10", 10)));

    // Find retro IDs where the user is a participant (but not necessarily the owner)
    const participatedRows = await db
      .select({ retroId: retroParticipants.retroId })
      .from(retroParticipants)
      .where(eq(retroParticipants.userId, userId));

    const participatedIds = participatedRows.map((r) => r.retroId);

    // Build the base condition: user is owner OR user is a participant
    const conditions = [
      eq(retros.ownerId, userId),
      ...(participatedIds.length > 0
        ? [sql`${retros.id} IN (${sql.join(participatedIds.map((id) => sql`${id}`), sql`,`)})`]
        : []),
    ];

    // If role filter is "owner", only show retros the user owns
    if (roleFilter === "owner") {
      conditions.length = 0;
      conditions.push(eq(retros.ownerId, userId));
    }
    // If role filter is "participant", only show retros the user participated in but doesn't own
    if (roleFilter === "participant" && participatedIds.length > 0) {
      conditions.length = 0;
      conditions.push(
        sql`${retros.id} IN (${sql.join(participatedIds.map((id) => sql`${id}`), sql`,`)})`,
        sql`${retros.ownerId} IS DISTINCT FROM ${userId}`
      );
    }

    let whereClause = or(...conditions);
    if (conditions.length === 1) {
      whereClause = conditions[0];
    }

    // Apply text search filter
    if (search) {
      whereClause = and(
        whereClause,
        sql`(LOWER(${retros.title}) LIKE ${`%${search}%`} OR LOWER(COALESCE(${retros.topic}, '')) LIKE ${`%${search}%`})`
      ) as typeof whereClause;
    }

    // Apply plan filter
    if (planFilter && ["anonymous", "individual", "company"].includes(planFilter)) {
      whereClause = and(whereClause, eq(retros.plan, planFilter as "anonymous" | "individual" | "company")) as typeof whereClause;
    }

    // Apply team filter
    if (teamFilter === "none") {
      whereClause = and(whereClause, sql`${retros.teamId} IS NULL`) as typeof whereClause;
    } else if (teamFilter) {
      whereClause = and(whereClause, eq(retros.teamId, teamFilter)) as typeof whereClause;
    }

    // Count how many archived retros are available, so the UI can label the
    // "show archived" toggle. This is computed before the archived filter is
    // applied so the number is stable whether the toggle is on or off.
    const archivedCountRows = await db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(retros)
      .where(and(whereClause, eq(retros.archived, true)));
    const archivedCount = archivedCountRows[0]?.count || 0;

    // Hide archived retros unless explicitly requested
    if (!includeArchived) {
      whereClause = and(whereClause, eq(retros.archived, false)) as typeof whereClause;
    }

    // Determine sort
    const sortColumn =
      sortBy === "title" ? retros.title :
      sortBy === "plan" ? retros.plan :
      sortBy === "createdAt" ? retros.createdAt :
      retros.updatedAt;
    const orderBy = sortDir === "asc" ? asc(sortColumn) : desc(sortColumn);

    // Get total count for pagination
    const countRows = await db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(retros)
      .where(whereClause);
    const total = countRows[0]?.count || 0;

    // Get paginated results
    const rows = await db
      .select({
        id: retros.id,
        title: retros.title,
        topic: retros.topic,
        plan: retros.plan,
        visibility: retros.visibility,
        locked: retros.locked,
        archived: retros.archived,
        teamId: retros.teamId,
        ownerId: retros.ownerId,
        createdAt: retros.createdAt,
        updatedAt: retros.updatedAt,
        teamName: teams.name,
        teamColor: teams.color,
        participantCount: sql<number>`(SELECT COUNT(*) FROM ${retroParticipants} WHERE ${retroParticipants.retroId} = ${retros.id})::int`,
      })
      .from(retros)
      .leftJoin(teams, eq(retros.teamId, teams.id))
      .where(whereClause)
      .orderBy(orderBy)
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    const items = rows.map((r) => ({
      ...r,
      isOwner: r.ownerId === userId,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }));

    return NextResponse.json({
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      archivedCount,
      includeArchived,
    });
  } catch (e) {
    console.error("[GET /api/retros/history]", e);
    return NextResponse.json({ error: "Failed to fetch retro history" }, { status: 500 });
  }
}
