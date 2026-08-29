import { NextResponse } from "next/server";
import { getAppSettings } from "@/lib/app-settings";

// Public endpoint — returns only the public-facing app settings (no secrets).
// Used by client components (Logo, etc.) to render the admin-configured
// app name and icon.
export async function GET() {
  try {
    const settings = await getAppSettings();
    return NextResponse.json({
      appName: settings.appName,
      appDescription: settings.appDescription,
      appIconUrl: settings.appIconUrl,
      faviconUrl: settings.faviconUrl,
      individualPrice: settings.individualPrice,
      companyPrice: settings.companyPrice,
      anonymousParticipantLimit: settings.anonymousParticipantLimit,
    });
  } catch {
    return NextResponse.json({
      appName: "RetroMo",
      appDescription: "Your online retrospective made easy",
      appIconUrl: null,
      faviconUrl: null,
      individualPrice: "10.00",
      companyPrice: "20.00",
      anonymousParticipantLimit: 50,
    });
  }
}
