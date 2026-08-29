import { NextRequest, NextResponse } from "next/server";
import { createPayPalOrder } from "@/lib/paypal/orders";
import { PAYPAL_PLANS, type PlanKey } from "@/lib/paypal/client";
import { getSession } from "@/lib/session";

// Create a PayPal order for a subscription plan
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "You must be logged in to subscribe" }, { status: 401 });
    }

    const body = await req.json();
    const { plan } = body as { plan: string };

    if (!plan || !(plan in PAYPAL_PLANS)) {
      return NextResponse.json({ error: "Invalid plan. Choose 'individual' or 'company'." }, { status: 400 });
    }

    const orderId = await createPayPalOrder(plan as PlanKey);
    return NextResponse.json({ id: orderId });
  } catch (e) {
    console.error("[POST /api/paypal/create-order]", e);
    const message = e instanceof Error ? e.message : "Failed to create PayPal order";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
