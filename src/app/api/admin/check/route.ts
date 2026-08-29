import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin";

// Returns whether the current session user is an admin.
// Safe to expose to the client — only returns a boolean, no secrets.
export async function GET() {
  try {
    const admin = await isAdmin();
    return NextResponse.json({ isAdmin: admin });
  } catch {
    return NextResponse.json({ isAdmin: false });
  }
}
