import { Client, Environment } from "@paypal/paypal-server-sdk";
import { getAppSettings } from "@/lib/app-settings";

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

export type PlanKey = "individual" | "company";

/**
 * Get the current plan pricing from app settings (admin-configurable).
 */
export async function getPlanPricing() {
  const settings = await getAppSettings();
  return {
    individual: { name: "Individual Plan", amount: settings.individualPrice },
    company: { name: "Company Plan", amount: settings.companyPrice },
  };
}

// Keep a synchronous fallback for places that need the default amounts
export const PAYPAL_PLANS = {
  individual: { name: "Individual Plan", amount: "10.00" },
  company: { name: "Company Plan", amount: "20.00" },
} as const;
