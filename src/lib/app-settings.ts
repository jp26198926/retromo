import { db } from "@/db";
import { appSettings } from "@/db/schema";
import { eq } from "drizzle-orm";

export type AppSettingsData = {
  appName: string;
  appDescription: string;
  appIconUrl: string | null;
  faviconUrl: string | null;
  individualPrice: string;
  companyPrice: string;
  anonymousParticipantLimit: number;
};

const DEFAULT_SETTINGS: AppSettingsData = {
  appName: "RetroMo",
  appDescription: "Your online retrospective made easy",
  appIconUrl: null,
  faviconUrl: null,
  individualPrice: "10.00",
  companyPrice: "20.00",
  anonymousParticipantLimit: 50,
};

/**
 * Get the current app settings from the database.
 * Falls back to defaults if no row exists yet.
 */
export async function getAppSettings(): Promise<AppSettingsData> {
  try {
    const row = await db.query.appSettings.findFirst({
      where: eq(appSettings.id, "singleton"),
    });
    if (!row) return DEFAULT_SETTINGS;
    return {
      appName: row.appName,
      appDescription: row.appDescription,
      appIconUrl: row.appIconUrl,
      faviconUrl: row.faviconUrl,
      individualPrice: row.individualPrice,
      companyPrice: row.companyPrice,
      anonymousParticipantLimit: row.anonymousParticipantLimit,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

/**
 * Ensure a singleton settings row exists; if not, create it.
 */
export async function ensureAppSettings() {
  const existing = await db.query.appSettings.findFirst({
    where: eq(appSettings.id, "singleton"),
  });
  if (!existing) {
    await db.insert(appSettings).values({ id: "singleton" });
  }
}
