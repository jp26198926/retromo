import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";
import * as schema from "@/db/schema";

// Only enable social providers that have credentials configured in .env
const socialProviders: Record<string, unknown> = {};
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  socialProviders.google = {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  };
}
if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  socialProviders.github = {
    clientId: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
  };
}

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
    usePlural: false,
  }),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: socialProviders as any,
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  user: {
    additionalFields: {
      isAnonymous: {
        type: "boolean",
        defaultValue: false,
      },
      role: {
        type: "string",
        defaultValue: "user",
      },
      subscriptionPlan: {
        type: "string",
        defaultValue: "anonymous",
      },
      subscriptionStatus: {
        type: "string",
        defaultValue: "none",
      },
      paypalSubscriptionId: {
        type: "string",
        required: false,
      },
    },
  },
});

export type Session = typeof auth.$Infer.Session;
