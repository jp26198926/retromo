"use client";

import { useState } from "react";
import {
  PayPalProvider,
  PayPalOneTimePaymentButton,
} from "@paypal/react-paypal-js/sdk-v6";
import { useSession } from "@/lib/auth-client";

interface PayPalCheckoutProps {
  plan: "individual" | "company";
  amount: string;
  onSuccess?: (plan: string) => void;
}

export function PayPalCheckout({ plan, amount, onSuccess }: PayPalCheckoutProps) {
  const { data: sessionData } = useSession();
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
  const environment = (process.env.NEXT_PUBLIC_PAYPAL_ENVIRONMENT as "sandbox" | "production") || "sandbox";

  // If PayPal is not configured, show a message
  if (!clientId) {
    return (
      <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        <p className="font-semibold">PayPal not configured</p>
        <p className="mt-1">
          Add <code className="rounded bg-amber-100 px-1">NEXT_PUBLIC_PAYPAL_CLIENT_ID</code> and{" "}
          <code className="rounded bg-amber-100 px-1">PAYPAL_CLIENT_SECRET</code> to your environment
          variables to enable payments.
        </p>
      </div>
    );
  }

  if (!sessionData?.session) {
    return (
      <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-700">
        Please <a href="/sign-in" className="font-semibold text-indigo-600 hover:underline">sign in</a> or{" "}
        <a href="/sign-up" className="font-semibold text-indigo-600 hover:underline">create an account</a> to subscribe.
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="rounded-lg border border-green-500 bg-green-50 px-4 py-4 text-center">
        <div className="text-2xl">✓</div>
        <p className="mt-1 font-semibold text-green-700">Payment successful!</p>
        <p className="mt-1 text-sm text-green-600">Your {plan} plan is now active.</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {status === "error" && (
        <div className="mb-3 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {errorMsg}
        </div>
      )}
      {status === "loading" && (
        <div className="mb-2 text-center text-sm text-neutral-500">Processing payment…</div>
      )}
      <PayPalProvider
        clientId={clientId}
        environment={environment}
        components={["paypal-payments"]}
        pageType="checkout"
      >
        <PayPalOneTimePaymentButton
          createOrder={async () => {
            setStatus("loading");
            const res = await fetch("/api/paypal/create-order", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ plan }),
            });
            if (!res.ok) {
              const data = await res.json().catch(() => ({}));
              throw new Error(data.error || "Failed to create order");
            }
            const data = await res.json();
            return { orderId: data.id };
          }}
          onApprove={async ({ orderId }) => {
            try {
              const res = await fetch("/api/paypal/capture-order", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orderId }),
              });
              if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || "Failed to capture payment");
              }
              const data = await res.json();
              setStatus("success");
              onSuccess?.(data.plan);
            } catch (e) {
              setStatus("error");
              setErrorMsg(e instanceof Error ? e.message : "Payment capture failed");
            }
          }}
          onError={(err) => {
            setStatus("error");
            setErrorMsg(err?.message || "Payment failed. Please try again.");
          }}
          presentationMode="auto"
        />
      </PayPalProvider>
      <p className="mt-2 text-center text-xs text-neutral-400">
        You will be charged ${amount} for 1 month of the {plan} plan.
      </p>
    </div>
  );
}
