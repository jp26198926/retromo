"use client";

import { useEffect, useState } from "react";
import { PayPalCheckout } from "@/components/PayPalCheckout";
import { useAppSettings } from "@/components/useAppSettings";
import { cn } from "@/lib/utils";

type UpgradePlanModalProps = {
  open: boolean;
  currentPlan: string; // "anonymous" | "individual" | "company"
  onCancel: () => void;
  onSuccess: (plan: string) => void;
};

type PlanOption = {
  key: "individual" | "company";
  name: string;
  tagline: string;
  price: string;
  amount: string;
  features: string[];
};

export function UpgradePlanModal({ open, currentPlan, onCancel, onSuccess }: UpgradePlanModalProps) {
  const { settings, loaded } = useAppSettings();
  const [selectedPlan, setSelectedPlan] = useState<"individual" | "company" | null>(null);

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedPlan(null);
        onCancel();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onCancel]);

  // Reset selection when modal closes
  useEffect(() => {
    if (!open) setSelectedPlan(null);
  }, [open]);

  if (!open) return null;

  // Build list of available plans (exclude current plan)
  const allPlans: PlanOption[] = [
    {
      key: "individual",
      name: "Individual",
      tagline: "For team-focused professionals",
      price: loaded ? `$${settings.individualPrice}` : "$10",
      amount: settings.individualPrice,
      features: [
        "Unlimited columns per retrospective",
        "Data export to Markdown",
        "Private retrospectives — sign-in required to join",
        "Card moderation (approve / reject)",
        "Advanced facilitation tools",
        "Extended retro customization",
        "Manage up to 3 teams",
        "Infinite archive — archive & restore retros",
        "Configurable data retention",
        "High priority support",
      ],
    },
    {
      key: "company",
      name: "Company",
      tagline: "For companies of all sizes",
      price: loaded ? `$${settings.companyPrice}` : "$20",
      amount: settings.companyPrice,
      features: [
        "Everything from Individual, and:",
        "Unlimited teams in your company",
        "Assign teams to Scrum Masters & Team Leads",
        "Zero-knowledge encryption with custom passwords",
        "Top priority support",
      ],
    },
  ];

  const availablePlans = allPlans.filter((p) => p.key !== currentPlan);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => {
          setSelectedPlan(null);
          onCancel();
        }}
      />

      {/* Modal */}
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-xl font-bold text-neutral-900">Upgrade your plan</h3>
            <p className="mt-1 text-sm text-neutral-600">
              Choose a plan to unlock more features. Your current plan:{" "}
              <span className="font-semibold capitalize">{currentPlan}</span>
            </p>
          </div>
          <button
            onClick={() => {
              setSelectedPlan(null);
              onCancel();
            }}
            className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
            aria-label="Close"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Plan selection or PayPal checkout */}
        {selectedPlan ? (
          <div className="mt-6">
            {/* Selected plan summary */}
            <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-neutral-900">
                    {availablePlans.find((p) => p.key === selectedPlan)?.name} plan
                  </h4>
                  <p className="text-xs text-neutral-600">
                    {availablePlans.find((p) => p.key === selectedPlan)?.price} per month
                  </p>
                </div>
                <button
                  onClick={() => setSelectedPlan(null)}
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
                >
                  ← Back to plans
                </button>
              </div>
              <p className="mt-3 text-xs text-neutral-600">
                You will be charged for the new plan and your subscription will switch immediately.
                Your previous plan&apos;s remaining time is non-refundable, but you keep access
                to all features of the new plan for a full month.
              </p>
            </div>

            {/* PayPal checkout */}
            <div className="mt-4">
              <PayPalCheckout
                plan={selectedPlan}
                amount={availablePlans.find((p) => p.key === selectedPlan)?.amount || "10.00"}
                type="change_plan"
                onSuccess={(plan) => {
                  setSelectedPlan(null);
                  onSuccess(plan);
                }}
              />
            </div>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {availablePlans.map((plan) => (
              <div
                key={plan.key}
                className={cn(
                  "cursor-pointer rounded-xl border-2 p-5 transition-all",
                  "border-neutral-200 hover:border-indigo-400 hover:shadow-md"
                )}
                onClick={() => setSelectedPlan(plan.key)}
              >
                <div className="flex items-baseline justify-between">
                  <h4 className="text-lg font-bold text-neutral-900">{plan.name}</h4>
                  <div className="text-right">
                    <span className="text-2xl font-extrabold text-neutral-900">{plan.price}</span>
                    <span className="text-sm text-neutral-500">/mo</span>
                  </div>
                </div>
                <p className="mt-1 text-xs text-neutral-500">{plan.tagline}</p>
                <ul className="mt-4 space-y-1.5">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-neutral-600">
                      <svg className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <span className={i === 0 && f.startsWith("Everything from") ? "font-semibold text-neutral-900" : ""}>{f}</span>
                    </li>
                  ))}
                </ul>
                <button
                  className="mt-4 w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                >
                  Select {plan.name}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
