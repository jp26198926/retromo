"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/Button";
import { useSession } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

type SubscriptionData = {
  subscriptionPlan: string;
  subscriptionStatus: string;
  paypalSubscriptionId: string | null;
  subscriptionCurrentPeriodEnd: string | null;
};

export default function BillingPage() {
  const { data: sessionData, isPending } = useSession();
  const [sub, setSub] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (sessionData?.session) {
      fetch("/api/subscription")
        .then((r) => r.json())
        .then((data) => setSub(data))
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [sessionData?.session]);

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
  const periodEnd = sub?.subscriptionCurrentPeriodEnd
    ? new Date(sub.subscriptionCurrentPeriodEnd).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })
    : null;

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
          <h1 className="text-3xl font-bold text-neutral-900">Billing & Subscription</h1>
          <p className="mt-2 text-neutral-600">Manage your RetroMo subscription plan.</p>

          <div className="mt-8 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-500">Current Plan</p>
                <p className="mt-1 text-2xl font-bold text-neutral-900">{planLabel}</p>
              </div>
              <span
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-semibold",
                  isActive ? "bg-green-100 text-green-700" : "bg-neutral-100 text-neutral-600"
                )}
              >
                {isActive ? "Active" : sub?.subscriptionStatus || "Free"}
              </span>
            </div>

            {isActive && periodEnd && (
              <div className="mt-4 border-t border-neutral-100 pt-4">
                <p className="text-sm text-neutral-600">
                  Your subscription renews on <span className="font-semibold text-neutral-900">{periodEnd}</span>.
                </p>
                {sub?.paypalSubscriptionId && (
                  <p className="mt-1 text-xs text-neutral-400">
                    PayPal transaction ID: {sub.paypalSubscriptionId}
                  </p>
                )}
              </div>
            )}

            <div className="mt-6">
              {sub?.subscriptionPlan === "anonymous" || !isActive ? (
                <a href="/plans">
                  <Button variant="primary">Upgrade your plan</Button>
                </a>
              ) : (
                <div className="flex gap-3">
                  <a href="/plans">
                    <Button variant="outline">Change plan</Button>
                  </a>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-neutral-200 bg-neutral-50 p-6">
            <h2 className="text-lg font-semibold text-neutral-900">Payment Method</h2>
            <p className="mt-2 text-sm text-neutral-600">
              Payments are processed securely through PayPal. You can manage your payment methods
              and billing history in your PayPal account.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
