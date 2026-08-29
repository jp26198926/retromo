import { NextRequest, NextResponse } from "next/server";
import { createPayPalOrder } from "@/lib/paypal/orders";
import { getAppSettings } from "@/lib/app-settings";
import { getSession } from "@/lib/session";

// Create a PayPal order for a subscription plan payment
// Body: { plan: "individual" | "company", type?: "subscribe" | "change_plan" }
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "You must be logged in to subscribe" }, { status: 401 });
    }

    const body = await req.json();
    const { plan, type = "subscribe" } = body as { plan: string; type?: string };

    if (plan !== "individual" && plan !== "company") {
      return NextResponse.json({ error: "Invalid plan. Choose 'individual' or 'company'." }, { status: 400 });
    }

    const orderId = await createPayPalOrder(plan as "individual" | "company", type as "subscribe" | "change_plan");
    return NextResponse.json({ id: orderId });
  } catch (e) {
    console.error("[POST /api/paypal/create-order]", e);
    const message = e instanceof Error ? e.message : "Failed to create PayPal order";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
