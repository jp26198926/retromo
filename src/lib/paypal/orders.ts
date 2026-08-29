import {
  OrdersController,
  CheckoutPaymentIntent,
} from "@paypal/paypal-server-sdk";
import { paypalClient, PAYPAL_PLANS, type PlanKey } from "./client";

/**
 * Create a PayPal order for a subscription plan payment.
 * Returns the PayPal order ID.
 */
export async function createPayPalOrder(plan: PlanKey): Promise<string> {
  if (!paypalClient) {
    throw new Error("PayPal is not configured. Set NEXT_PUBLIC_PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET.");
  }

  const planConfig = PAYPAL_PLANS[plan];
  if (!planConfig) {
    throw new Error(`Unknown plan: ${plan}`);
  }

  const ordersController = new OrdersController(paypalClient);

  const { result } = await ordersController.createOrder({
    body: {
      intent: CheckoutPaymentIntent.Capture,
      purchaseUnits: [
        {
          amount: {
            currencyCode: "USD",
            value: planConfig.amount,
          },
          description: planConfig.description,
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
 * Returns the full capture result.
 */
export async function capturePayPalOrder(orderId: string): Promise<{
  id: string;
  status: string;
  plan: PlanKey | null;
}> {
  if (!paypalClient) {
    throw new Error("PayPal is not configured. Set NEXT_PUBLIC_PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET.");
  }

  const ordersController = new OrdersController(paypalClient);

  const { result } = await ordersController.captureOrder({
    id: orderId,
    prefer: "return=representation",
  });

  // Extract the amount to determine which plan was purchased
  const amount = result.purchaseUnits?.[0]?.payments?.captures?.[0]?.amount?.value;
  let plan: PlanKey | null = null;
  if (amount === PAYPAL_PLANS.individual.amount) plan = "individual";
  else if (amount === PAYPAL_PLANS.company.amount) plan = "company";

  return {
    id: result.id || orderId,
    status: result.status || "UNKNOWN",
    plan,
  };
}
