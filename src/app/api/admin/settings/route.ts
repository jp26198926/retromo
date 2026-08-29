import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { appSettings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getAdminSession } from "@/lib/admin";
import { getAppSettings, AppSettingsData } from "@/lib/app-settings";

// GET — current app settings (admin only)
export async function GET() {
  try {
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    const settings = await getAppSettings();
    return NextResponse.json(settings);
  } catch (e) {
    console.error("[GET /api/admin/settings]", e);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

// PUT — update app settings (admin only)
export async function PUT(req: NextRequest) {
  try {
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const body = await req.json();
    const patch: Partial<AppSettingsData> = {};
    if (typeof body.appName === "string") patch.appName = body.appName.trim().slice(0, 100);
    if (typeof body.appDescription === "string") patch.appDescription = body.appDescription.trim().slice(0, 500);
    if (typeof body.appIconUrl === "string") patch.appIconUrl = body.appIconUrl || null;
    if (typeof body.faviconUrl === "string") patch.faviconUrl = body.faviconUrl || null;
    if (typeof body.individualPrice === "string") patch.individualPrice = body.individualPrice;
    if (typeof body.companyPrice === "string") patch.companyPrice = body.companyPrice;
    if (typeof body.anonymousParticipantLimit === "number") {
      patch.anonymousParticipantLimit = Math.max(1, Math.min(10000, body.anonymousParticipantLimit));
    }

    // Ensure the singleton row exists, then update
    const existing = await db.query.appSettings.findFirst({ where: eq(appSettings.id, "singleton") });
    if (!existing) {
      await db.insert(appSettings).values({ id: "singleton", ...patch } as any);
    } else {
      await db
        .update(appSettings)
        .set({ ...patch, updatedAt: new Date() })
        .where(eq(appSettings.id, "singleton"));
    }

    const updated = await getAppSettings();
    return NextResponse.json(updated);
  } catch (e) {
    console.error("[PUT /api/admin/settings]", e);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
