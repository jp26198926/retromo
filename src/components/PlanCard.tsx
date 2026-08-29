"use client";

import { useState } from "react";
import { PayPalCheckout } from "@/components/PayPalCheckout";
import { Button } from "@/components/Button";
import { useSession } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

interface PlanCardProps {
  name: string;
  tagline: string;
  price: string;
  period: string;
  features: string[];
  highlight: boolean;
  planKey: "anonymous" | "individual" | "company" | null;
  amount: string;
}

export function PlanCard({
  name,
  tagline,
  price,
  period,
  features,
  highlight,
  planKey,
  amount,
}: PlanCardProps) {
  const { data: sessionData } = useSession();
  const [showCheckout, setShowCheckout] = useState(false);
  const isLoggedIn = !!sessionData?.session;

  return (
    <div
      className={cn(
        "relative flex flex-col rounded-3xl border bg-white p-8 shadow-sm",
        highlight ? "border-indigo-500 ring-2 ring-indigo-500" : "border-neutral-200"
      )}
    >
      {highlight && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 px-3 py-1 text-xs font-semibold text-white">
          Most popular
        </div>
      )}
      <h2 className="text-xl font-bold text-neutral-900">{name}</h2>
      <p className="mt-1 text-sm text-neutral-500">{tagline}</p>
      <div className="mt-6 flex items-baseline gap-1">
        <span className="text-4xl font-extrabold text-neutral-900">{price}</span>
        <span className="text-sm text-neutral-500">/ {period}</span>
      </div>
      <ul className="mt-6 flex-1 space-y-3">
        {features.map((f, i) => (
          <li key={i} className="flex gap-2 text-sm text-neutral-700">
            <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-indigo-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M16.7 5.3a1 1 0 010 1.4l-7.5 7.5a1 1 0 01-1.4 0L3.3 9.7a1 1 0 011.4-1.4l3.1 3.1 6.8-6.8a1 1 0 011.4 0z" clipRule="evenodd" />
            </svg>
            <span className={i === 0 && name !== "Anonymous" ? "font-semibold text-neutral-900" : ""}>{f}</span>
          </li>
        ))}
      </ul>

      <div className="mt-8">
        {planKey === "anonymous" ? (
          <a href="/new-retrospective">
            <Button className="w-full" variant={highlight ? "primary" : "outline"} size="lg">
              Start now
            </Button>
          </a>
        ) : !isLoggedIn ? (
          <a href={`/sign-up?plan=${planKey}`}>
            <Button className="w-full" variant={highlight ? "primary" : "outline"} size="lg">
              Sign up to subscribe
            </Button>
          </a>
        ) : showCheckout ? (
          <div className="space-y-3">
            <PayPalCheckout
              plan={planKey as "individual" | "company"}
              amount={amount}
              onSuccess={() => {
                setTimeout(() => window.location.reload(), 1500);
              }}
            />
            <button
              onClick={() => setShowCheckout(false)}
              className="w-full text-center text-xs text-neutral-500 hover:text-neutral-700"
            >
              Cancel
            </button>
          </div>
        ) : (
          <Button
            className="w-full"
            variant={highlight ? "primary" : "outline"}
            size="lg"
            onClick={() => setShowCheckout(true)}
          >
            Subscribe with PayPal
          </Button>
        )}
      </div>
    </div>
  );
}
