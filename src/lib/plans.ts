import { db } from "@/db";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/session";
import { getAppSettings } from "@/lib/app-settings";

export type PlanKey = "anonymous" | "individual" | "company";

export type PlanFeatures = {
  plan: PlanKey;
  status: string; // none | active | cancelled | past_due
  isActive: boolean;
  currentPeriodEnd: Date | null;
  // feature flags
  maxTeams: number; // 0 = none, -1 = unlimited
  participantLimit: number; // 0 = unlimited
  privateRetros: boolean;
  advancedFacilitation: boolean; // secret voting, timer, moderation
  extendedCustomization: boolean; // custom columns, image filters
  infiniteArchive: boolean; // vs 12-month retention
  configurableRetention: boolean;
  zeroKnowledgeEncryption: boolean;
  prioritySupport: "none" | "high" | "top";
};

const ANONYMOUS_FEATURES: Omit<PlanFeatures, "plan" | "status" | "isActive" | "currentPeriodEnd"> = {
  maxTeams: 0,
  participantLimit: 50, // default; overridden by app settings at runtime
  privateRetros: false,
  advancedFacilitation: false,
  extendedCustomization: false,
  infiniteArchive: false,
  configurableRetention: false,
  zeroKnowledgeEncryption: false,
  prioritySupport: "none",
};

const INDIVIDUAL_FEATURES: Omit<PlanFeatures, "plan" | "status" | "isActive" | "currentPeriodEnd"> = {
  maxTeams: 3,
  participantLimit: 0, // unlimited
  privateRetros: true,
  advancedFacilitation: true,
  extendedCustomization: true,
  infiniteArchive: true,
  configurableRetention: true,
  zeroKnowledgeEncryption: false,
  prioritySupport: "high",
};

const COMPANY_FEATURES: Omit<PlanFeatures, "plan" | "status" | "isActive" | "currentPeriodEnd"> = {
  maxTeams: -1, // unlimited
  participantLimit: 0,
  privateRetros: true,
  advancedFacilitation: true,
  extendedCustomization: true,
  infiniteArchive: true,
  configurableRetention: true,
  zeroKnowledgeEncryption: true,
  prioritySupport: "top",
};

/**
 * Get the feature set for a given plan key.
 */
export function getPlanFeatures(plan: string): Omit<PlanFeatures, "status" | "isActive" | "currentPeriodEnd"> {
  switch (plan) {
    case "individual":
      return { ...INDIVIDUAL_FEATURES, plan: "individual" };
    case "company":
      return { ...COMPANY_FEATURES, plan: "company" };
    default:
      return { ...ANONYMOUS_FEATURES, plan: "anonymous" };
  }
}

/**
 * Get the current user's subscription and feature set.
 * For anonymous (not logged in) users, returns the anonymous plan.
 */
export async function getCurrentUserPlan(): Promise<PlanFeatures> {
  const session = await getSession();
  if (!session?.user) {
    const settings = await getAppSettings();
    return {
      ...ANONYMOUS_FEATURES,
      plan: "anonymous",
      status: "none",
      isActive: false,
      currentPeriodEnd: null,
      participantLimit: settings.anonymousParticipantLimit,
    };
  }

  const u = await db.query.user.findFirst({ where: eq(user.id, session.user.id) });
  if (!u) {
    return {
      ...ANONYMOUS_FEATURES,
      plan: "anonymous",
      status: "none",
      isActive: false,
      currentPeriodEnd: null,
    };
  }

  const plan = u.subscriptionPlan as PlanKey;
  const isActive = u.subscriptionStatus === "active";
  const base = getPlanFeatures(plan);

  // For anonymous plan, use the configurable participant limit from app settings
  let participantLimit = base.participantLimit;
  if (plan === "anonymous") {
    const settings = await getAppSettings();
    participantLimit = settings.anonymousParticipantLimit;
  }

  return {
    ...base,
    status: u.subscriptionStatus,
    isActive,
    currentPeriodEnd: u.subscriptionCurrentPeriodEnd,
    participantLimit,
  };
}

/**
 * Check if a cancelled subscription is still within its paid period.
 * Cancelled plans keep access until subscriptionCurrentPeriodEnd.
 */
export function hasActiveAccess(features: PlanFeatures): boolean {
  if (features.isActive) return true;
  if (features.status === "cancelled" && features.currentPeriodEnd) {
    return new Date(features.currentPeriodEnd) > new Date();
  }
  return false;
}
