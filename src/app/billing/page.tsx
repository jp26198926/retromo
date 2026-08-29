"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/Button";
import { ConfirmModal } from "@/components/ConfirmModal";
import { PayPalCheckout } from "@/components/PayPalCheckout";
import { useSession } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

type BillingHistoryItem = {
  id: string;
  plan: string;
  amount: string;
  currency: string;
  status: string;
  type: string;
  previousPlan: string | null;
  description: string | null;
  paypalOrderId: string | null;
  createdAt: string;
};

type SubscriptionData = {
  subscriptionPlan: string;
  effectivePlan: string;
  subscriptionStatus: string;
  paypalSubscriptionId: string | null;
  subscriptionCurrentPeriodEnd: string | null;
  subscriptionCancelledAt: string | null;
  hasActiveAccess: boolean;
  billingHistory: BillingHistoryItem[];
};

export default function BillingPage() {
  const { data: sessionData, isPending } = useSession();
  const [sub, setSub] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showChangePlan, setShowChangePlan] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelMsg, setCancelMsg] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);

  function fetchSub() {
    fetch("/api/subscription")
      .then((r) => r.json())
      .then((data) => setSub(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (sessionData?.session) {
      fetchSub();
    } else {
      setLoading(false);
    }
  }, [sessionData?.session]);

  async function handleCancel() {
    setShowCancelModal(true);
  }

  async function performCancel() {
    setCancelLoading(true);
    setCancelMsg(null);
    try {
      const res = await fetch("/api/subscription/cancel", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setCancelMsg(data.error || "Failed to cancel");
      } else {
        setCancelMsg(data.message || "Subscription cancelled.");
        fetchSub();
      }
    } catch {
      setCancelMsg("Failed to cancel subscription");
    } finally {
      setCancelLoading(false);
      setShowCancelModal(false);
    }
  }

  if (isPending || loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <div className="flex flex-1 items-center justify-center">
          <p className="text-neutral-500">Loading…</p>
        </div>
      </div>
    );
  }

  if (!sessionData?.session) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <div className="flex flex-1 flex-col items-center justify-center gap-4">
          <p className="text-neutral-600">Please sign in to view your billing information.</p>
          <a href="/sign-in"><Button>Sign in</Button></a>
        </div>
        <Footer />
      </div>
    );
  }

  const planLabel = sub?.subscriptionPlan === "individual" ? "Individual" :
                    sub?.subscriptionPlan === "company" ? "Company" : "Anonymous (Free)";
  const isActive = sub?.subscriptionStatus === "active";
  const isCancelled = sub?.subscriptionStatus === "cancelled";
  const hasAccess = sub?.hasActiveAccess;
  const periodEnd = sub?.subscriptionCurrentPeriodEnd
    ? new Date(sub.subscriptionCurrentPeriodEnd).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })
    : null;
  const cancelledAt = sub?.subscriptionCancelledAt
    ? new Date(sub.subscriptionCancelledAt).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })
    : null;

  const otherPlan = sub?.subscriptionPlan === "individual" ? "company" : "individual";
  const otherPlanLabel = otherPlan === "individual" ? "Individual ($10/mo)" : "Company ($20/mo)";
  const otherPlanAmount = otherPlan === "individual" ? "10.00" : "20.00";

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
          <h1 className="text-3xl font-bold text-neutral-900">Billing & Subscription</h1>
          <p className="mt-2 text-neutral-600">Manage your RetroMo subscription plan.</p>

          {cancelMsg && (
            <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {cancelMsg}
            </div>
          )}

          {/* Current plan card */}
          <div className="mt-8 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-500">Current Plan</p>
                <p className="mt-1 text-2xl font-bold text-neutral-900">{planLabel}</p>
              </div>
              <span
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-semibold",
                  isActive ? "bg-green-100 text-green-700" :
                  isCancelled ? "bg-amber-100 text-amber-700" :
                  "bg-neutral-100 text-neutral-600"
                )}
              >
                {isActive ? "Active" : isCancelled ? "Cancelled" : sub?.subscriptionStatus || "Free"}
              </span>
            </div>

            {hasAccess && periodEnd && (
              <div className="mt-4 border-t border-neutral-100 pt-4">
                {isCancelled ? (
                  <p className="text-sm text-amber-700">
                    Your subscription was cancelled on{" "}
                    <span className="font-semibold">{cancelledAt}</span>.
                    You will keep access to your plan until{" "}
                    <span className="font-semibold text-neutral-900">{periodEnd}</span>{" "}
                    (non-refundable). After that, you will revert to the free Anonymous plan.
                  </p>
                ) : (
                  <p className="text-sm text-neutral-600">
                    Your subscription is <span className="font-semibold text-neutral-900">recurring</span> and renews on{" "}
                    <span className="font-semibold text-neutral-900">{periodEnd}</span>.
                  </p>
                )}
                {sub?.paypalSubscriptionId && (
                  <p className="mt-1 text-xs text-neutral-400">
                    PayPal transaction ID: {sub.paypalSubscriptionId}
                  </p>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="mt-6 flex flex-wrap gap-3">
              {(sub?.subscriptionPlan === "anonymous" || !hasAccess) ? (
                <a href="/plans">
                  <Button variant="primary">Upgrade your plan</Button>
                </a>
              ) : (
                <>
                  {!isCancelled && (
                    <Button
                      variant="outline"
                      onClick={handleCancel}
                      disabled={cancelLoading}
                    >
                      {cancelLoading ? "Cancelling…" : "Cancel subscription"}
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => setShowChangePlan((v) => !v)}
                  >
                    {showChangePlan ? "Close" : "Change plan"}
                  </Button>
                </>
              )}
            </div>

            {/* Change plan panel */}
            {showChangePlan && hasAccess && (
              <div className="mt-4 rounded-xl border border-indigo-200 bg-indigo-50/50 p-4">
                <h3 className="text-sm font-semibold text-neutral-900">
                  Switch to the {otherPlanLabel} plan
                </h3>
                <p className="mt-1 text-xs text-neutral-600">
                  You will be charged for the new plan and your subscription will switch immediately.
                  Your previous plan&apos;s remaining time is non-refundable, but you keep access
                  to all features of the new plan for a full month.
                </p>
                <div className="mt-3">
                  <PayPalCheckout
                    plan={otherPlan as "individual" | "company"}
                    amount={otherPlanAmount}
                    type="change_plan"
                    onSuccess={() => {
                      setTimeout(() => {
                        setShowChangePlan(false);
                        fetchSub();
                      }, 1500);
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Billing history */}
          <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-neutral-900">Billing History</h2>
            {sub?.billingHistory && sub.billingHistory.length > 0 ? (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-neutral-200 text-xs uppercase tracking-wide text-neutral-400">
                      <th className="pb-2 pr-4 font-medium">Date</th>
                      <th className="pb-2 pr-4 font-medium">Description</th>
                      <th className="pb-2 pr-4 font-medium">Amount</th>
                      <th className="pb-2 pr-4 font-medium">Status</th>
                      <th className="pb-2 font-medium">Transaction ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sub.billingHistory.map((h) => (
                      <tr key={h.id} className="border-b border-neutral-100 last:border-0">
                        <td className="py-3 pr-4 text-neutral-600">
                          {new Date(h.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
                        </td>
                        <td className="py-3 pr-4 text-neutral-700">
                          {h.description || `${h.type} — ${h.plan}`}
                        </td>
                        <td className="py-3 pr-4 text-neutral-700">
                          {h.currency === "USD" ? "$" : ""}{h.amount}
                        </td>
                        <td className="py-3 pr-4">
                          <span className={cn(
                            "rounded-full px-2 py-0.5 text-xs font-medium",
                            h.status === "completed" ? "bg-green-100 text-green-700" :
                            h.status === "cancelled" ? "bg-amber-100 text-amber-700" :
                            h.status === "failed" ? "bg-red-100 text-red-700" :
                            "bg-neutral-100 text-neutral-600"
                          )}>
                            {h.status}
                          </span>
                        </td>
                        <td className="py-3 text-xs text-neutral-400">
                          {h.paypalOrderId ? h.paypalOrderId.slice(0, 12) + "…" : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="mt-4 text-sm text-neutral-500">
                No billing history yet. Your payment transactions will appear here once you subscribe to a paid plan.
              </p>
            )}
          </div>

          {/* Payment method info */}
          <div className="mt-6 rounded-2xl border border-neutral-200 bg-neutral-50 p-6">
            <h2 className="text-lg font-semibold text-neutral-900">Payment Method</h2>
            <p className="mt-2 text-sm text-neutral-600">
              Payments are processed securely through PayPal. All subscriptions are recurring
              by default — you will be charged monthly until you cancel. You can cancel anytime
              and keep access until the end of your current billing period (non-refundable).
            </p>
          </div>
        </section>
      </main>
      <Footer />

      {/* Cancel subscription confirmation modal */}
      <ConfirmModal
        open={showCancelModal}
        title="Cancel subscription"
        message="Cancel your subscription? You will keep access until your current billing period ends (non-refundable). After that, you will revert to the free Anonymous plan."
        confirmLabel="Yes, cancel subscription"
        variant="danger"
        loading={cancelLoading}
        onConfirm={performCancel}
        onCancel={() => setShowCancelModal(false)}
      />
    </div>
  );
}
