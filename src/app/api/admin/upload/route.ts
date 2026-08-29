import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { appSettings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getAdminSession } from "@/lib/admin";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

// POST — upload an app icon or favicon (admin only)
// Accepts multipart/form-data with a "file" field and a "type" field ("icon" | "favicon")
export async function POST(req: NextRequest) {
  try {
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get("file");
    const type = (formData.get("type") as string) || "icon";

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (type !== "icon" && type !== "favicon") {
      return NextResponse.json({ error: "Invalid type (must be 'icon' or 'favicon')" }, { status: 400 });
    }

    // Validate file type
    const allowed = ["image/png", "image/jpeg", "image/jpg", "image/gif", "image/webp", "image/x-icon", "image/svg+xml", "image/vnd.microsoft.icon"];
    if (!allowed.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type. Allowed: PNG, JPEG, GIF, WEBP, ICO, SVG." }, { status: 400 });
    }
    // 2 MB limit
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large (max 2 MB)" }, { status: 400 });
    }

    // Ensure uploads directory exists
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Generate a unique filename
    const ext = file.name.split(".").pop() || "png";
    const filename = `${type}-${Date.now()}.${ext}`;
    const filepath = path.join(uploadsDir, filename);
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filepath, buffer);

    const url = `/uploads/${filename}`;

    // Save the URL into app settings
    const field = type === "icon" ? "appIconUrl" : "faviconUrl";
    const existing = await db.query.appSettings.findFirst({ where: eq(appSettings.id, "singleton") });
    if (!existing) {
      await db.insert(appSettings).values({ id: "singleton", [field]: url } as any);
    } else {
      await db.update(appSettings).set({ [field]: url, updatedAt: new Date() }).where(eq(appSettings.id, "singleton"));
    }

    return NextResponse.json({ url });
  } catch (e) {
    console.error("[POST /api/admin/upload]", e);
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
  }
}
