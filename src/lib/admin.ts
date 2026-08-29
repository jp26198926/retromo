import { getSession } from "@/lib/session";
import { db } from "@/db";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * The admin email is defined in the .env file via ADMIN_EMAIL.
 * A user is an admin if their email matches ADMIN_EMAIL or their
 * role field in the database is "admin".
 */
export function getAdminEmail(): string | null {
  return process.env.ADMIN_EMAIL || null;
}

/**
 * Returns true if the given email is the configured admin email.
 */
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const adminEmail = getAdminEmail();
  if (!adminEmail) return false;
  return adminEmail.toLowerCase() === email.toLowerCase();
}

/**
 * Check if the current session user is an admin.
 * A user is admin if:
 *   - their email matches ADMIN_EMAIL env var, OR
 *   - their role in the DB is "admin"
 */
export async function isAdmin(): Promise<boolean> {
  const session = await getSession();
  if (!session?.user) return false;
  if (isAdminEmail(session.user.email)) return true;
  // Also check DB role (in case admin promoted them)
  const u = await db.query.user.findFirst({ where: eq(user.id, session.user.id) });
  return u?.role === "admin";
}

/**
 * Returns the current session user if they are an admin, otherwise null.
 */
export async function getAdminSession() {
  const admin = await isAdmin();
  if (!admin) return null;
  return await getSession();
}
