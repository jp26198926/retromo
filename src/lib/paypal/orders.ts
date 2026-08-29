import {
  OrdersController,
  CheckoutPaymentIntent,
} from "@paypal/paypal-server-sdk";
import { paypalClient } from "./client";
import { getAppSettings } from "@/lib/app-settings";

export type PurchaseType = "subscribe" | "change_plan";

/**
 * Create a PayPal order for a subscription plan payment.
 * Returns the PayPal order ID.
 * Pricing is read from the app settings (admin-configurable).
 */
export async function createPayPalOrder(
  plan: "individual" | "company",
  type: PurchaseType = "subscribe"
): Promise<string> {
  if (!paypalClient) {
    throw new Error("PayPal is not configured. Set NEXT_PUBLIC_PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET.");
  }

  const settings = await getAppSettings();
  const amount = plan === "individual" ? settings.individualPrice : settings.companyPrice;
  const planName = plan === "individual" ? "Individual Plan" : "Company Plan";
  const description =
    type === "change_plan"
      ? `RetroMo plan change to ${planName} — 1 month (recurring)`
      : `RetroMo ${planName} subscription — 1 month (recurring)`;

  const ordersController = new OrdersController(paypalClient);

  const { result } = await ordersController.createOrder({
    body: {
      intent: CheckoutPaymentIntent.Capture,
      purchaseUnits: [
        {
          amount: {
            currencyCode: "USD",
            value: amount,
          },
          description,
        },
      ],
    },
    prefer: "return=representation",
  });

  if (!result.id) {
    throw new Error("PayPal order creation failed: missing order ID");
  }

  return result.id;
}

/**
 * Capture (finalize) an approved PayPal order.
 * Returns the capture result including the amount paid so the caller
 * can determine which plan was purchased.
 */
export async function capturePayPalOrder(orderId: string): Promise<{
  id: string;
  status: string;
  amount: string | null;
  plan: "individual" | "company" | null;
}> {
  if (!paypalClient) {
    throw new Error("PayPal is not configured. Set NEXT_PUBLIC_PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET.");
  }

  const ordersController = new OrdersController(paypalClient);

  const { result } = await ordersController.captureOrder({
    id: orderId,
    prefer: "return=representation",
  });

  const amount = result.purchaseUnits?.[0]?.payments?.captures?.[0]?.amount?.value || null;

  // Determine plan from amount using current app settings pricing
  let plan: "individual" | "company" | null = null;
  if (amount) {
    const settings = await getAppSettings();
    if (amount === settings.individualPrice) plan = "individual";
    else if (amount === settings.companyPrice) plan = "company";
  }

  return {
    id: result.id || orderId,
    status: result.status || "UNKNOWN",
    amount,
    plan,
  };
}
