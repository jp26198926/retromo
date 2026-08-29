import { Client, Environment } from "@paypal/paypal-server-sdk";

/**
 * Shared PayPal server SDK client.
 * Reads credentials from environment variables:
 *   - NEXT_PUBLIC_PAYPAL_CLIENT_ID  (safe for browser)
 *   - PAYPAL_CLIENT_SECRET           (server-only, never exposed)
 *   - NEXT_PUBLIC_PAYPAL_ENVIRONMENT  ("sandbox" | "production")
 */
function createPayPalClient() {
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return null;
  }

  return new Client({
    clientCredentialsAuthCredentials: {
      oAuthClientId: clientId,
      oAuthClientSecret: clientSecret,
    },
    environment:
      process.env.NEXT_PUBLIC_PAYPAL_ENVIRONMENT === "production"
        ? Environment.Production
        : Environment.Sandbox,
  });
}

export const paypalClient = createPayPalClient();

export const PAYPAL_PLANS = {
  individual: {
    name: "Individual Plan",
    amount: "10.00",
    description: "RetroMo Individual subscription — 1 month",
  },
  company: {
    name: "Company Plan",
    amount: "20.00",
    description: "RetroMo Company subscription — 1 month",
  },
} as const;

export type PlanKey = keyof typeof PAYPAL_PLANS;
