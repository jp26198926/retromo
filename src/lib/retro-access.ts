import { db } from "@/db";
import { retroParticipants, retros, user } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { getSession } from "@/lib/session";

type Retro = typeof retros.$inferSelect;
type Session = Awaited<ReturnType<typeof getSession>>;

/**
 * Returns true when the session user is a platform admin.
 * Kept local (rather than importing from admin.ts) so this module can be used
 * with an already-resolved session and avoid a second session lookup.
 */
async function sessionIsAdmin(session: Session): Promise<boolean> {
  if (!session?.user) return false;
  const adminEmail = process.env.ADMIN_EMAIL;
  if (adminEmail && adminEmail.toLowerCase() === session.user.email?.toLowerCase()) {
    return true;
  }
  const u = await db.query.user.findFirst({ where: eq(user.id, session.user.id) });
  return u?.role === "admin";
}

/**
 * Moderation exemption.
 *
 * When a retro is moderated, the people who run the session should not have to
 * moderate themselves. The host (retro owner), any facilitator, and platform
 * admins post straight to the public board without entering the review queue.
 *
 * Everyone else has their cards held for review at the moment they are
 * published to the shared/public space.
 */
export async function isModerationExempt(
  retro: Pick<Retro, "id" | "ownerId">,
  session: Session,
  participantId?: string | null
): Promise<boolean> {
  // Host (retro owner)
  if (session?.user && retro.ownerId && retro.ownerId === session.user.id) return true;

  // Platform admin
  if (await sessionIsAdmin(session)) return true;

  // Facilitator — resolved either from the logged-in user or the participant id
  if (session?.user) {
    const p = await db.query.retroParticipants.findFirst({
      where: and(
        eq(retroParticipants.retroId, retro.id),
        eq(retroParticipants.userId, session.user.id)
      ),
    });
    if (p?.isFacilitator) return true;
  }

  if (participantId) {
    const p = await db.query.retroParticipants.findFirst({
      where: and(
        eq(retroParticipants.retroId, retro.id),
        eq(retroParticipants.id, participantId)
      ),
    });
    if (p?.isFacilitator) return true;
  }

  return false;
}

/**
 * Result of a private-retro access check.
 * `ok: false` carries the HTTP status and message the caller should return.
 */
export type RetroAccess =
  | { ok: true }
  | { ok: false; status: number; error: string; reason: "auth_required" };

/**
 * Private retrospectives require an authenticated account.
 *
 * A retro with `visibility === "private"` is only readable/writable by signed-in
 * users. Anonymous (not logged-in) visitors are rejected with 401 so the client
 * can redirect them to the sign-in page.
 *
 * Public retros remain open to anonymous participants as before.
 */
export function checkRetroAccess(
  retro: Pick<Retro, "visibility">,
  session: Session
): RetroAccess {
  if (retro.visibility === "private" && !session?.user) {
    return {
      ok: false,
      status: 401,
      reason: "auth_required",
      error: "This retrospective is private. Please sign in to continue.",
    };
  }
  return { ok: true };
}

/**
 * Convenience helper: load a retro by id and check private access in one go.
 */
export async function loadRetroWithAccess(retroId: string, session: Session) {
  const retro = await db.query.retros.findFirst({ where: eq(retros.id, retroId) });
  if (!retro) return { retro: null, access: null };
  return { retro, access: checkRetroAccess(retro, session) };
}
