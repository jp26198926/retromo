import { NextResponse } from "next/server";
import { sendContactMessage } from "@/lib/email";

// POST /api/contact — send a message to the admin
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, message } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    if (!email || !email.trim()) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }
    if (!message || !message.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Please provide a valid email address" }, { status: 400 });
    }

    const result = await sendContactMessage({
      name: name.trim(),
      email: email.trim(),
      message: message.trim(),
    });

    if (!result.sent) {
      // SMTP or ADMIN_EMAIL not configured — return a graceful message
      return NextResponse.json({
        error: "Email delivery is not configured. Please contact the administrator directly.",
        details: result.error,
      }, { status: 503 });
    }

    return NextResponse.json({ ok: true, message: "Your message has been sent. We'll get back to you soon!" });
  } catch (e) {
    console.error("[POST /api/contact]", e);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
