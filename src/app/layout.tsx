import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { getAppSettings } from "@/lib/app-settings";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Fetch app settings at build/request time so the app name, description,
// icon and favicon are all admin-configurable.
async function getMetadataSettings() {
  try {
    const settings = await getAppSettings();
    return settings;
  } catch {
    return null;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getMetadataSettings();
  const appName = settings?.appName || "RetroMo";
  const appDescription =
    settings?.appDescription ||
    "RetroMo is the easiest to use tool for running engaging online retrospectives for your remote or hybrid teams.";
  const faviconUrl = settings?.faviconUrl || undefined;
  const iconUrl = settings?.appIconUrl || undefined;

  const icons: Metadata["icons"] = {};
  if (faviconUrl) icons.icon = [{ url: faviconUrl }];
  if (iconUrl && iconUrl !== faviconUrl) {
    icons.icon = [...(icons.icon as any[]), { url: iconUrl }];
  }

  return {
    title: `${appName} | ${settings?.appDescription || "Your online retrospective made easy"}`,
    description: appDescription,
    icons: faviconUrl || iconUrl ? icons : undefined,
  };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const settings = await getAppSettings().catch(() => null);
  const appName = settings?.appName || "RetroMo";

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white text-neutral-900">
        {children}
        {/* Expose the admin-configured app name to the client for the Logo */}
        <script
          dangerouslySetInnerHTML={{
            __html: `window.__APP_NAME__=${JSON.stringify(appName)};`,
          }}
        />
      </body>
    </html>
  );
}
