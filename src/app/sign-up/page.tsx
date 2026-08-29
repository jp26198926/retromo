"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { signUp, signIn } from "@/lib/auth-client";
import { Button } from "@/components/Button";
import { Logo } from "@/components/Logo";
import { useSocialProviders } from "@/components/useSocialProviders";

export default function SignUpPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><p className="text-neutral-500">Loading…</p></div>}>
      <SignUpForm />
    </Suspense>
  );
}

function SignUpForm() {
  const router = useRouter();
  const params = useSearchParams();
  const plan = params.get("plan");
  const redirect = params.get("redirect");
  // If a redirect URL is provided (e.g. from a team invitation), use it after signup.
  // Otherwise fall back to the plan-based dashboard URL.
  const callbackURL = redirect || (plan ? `/dashboard?plan=${plan}` : "/dashboard");
  const { providers } = useSocialProviders();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await signUp.email({ name, email, password }, {
      onError: (ctx) => {
        setError(ctx.error.message || "Sign up failed");
        setLoading(false);
      },
      onSuccess: () => router.push(callbackURL),
    });
    // Only show error if there's actually an error and no success redirect happened
    if (res?.error && !res.data) {
      setError(res.error.message || "Sign up failed");
    }
    setLoading(false);
  }

  async function handleGoogle() {
    setLoading(true);
    await (signIn as any).social?.({ provider: "google", callbackURL });
  }
  async function handleGithub() {
    setLoading(true);
    await (signIn as any).social?.({ provider: "github", callbackURL });
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center"><Logo /></div>
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h1 className="text-xl font-bold text-neutral-900">Create your account</h1>
          <p className="mt-1 text-sm text-neutral-500">{plan ? `Start your ${plan} 90 day trial.` : "Start your free 90 day trial."} Cancel anytime.</p>

          {error && <div className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700">Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                placeholder="Your name"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                placeholder="you@team.com"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700">Password</label>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                placeholder="At least 8 characters"
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Creating account…" : "Create account"}
            </Button>
          </form>

          {(providers.google || providers.github) && (
            <div className="my-4 flex items-center gap-3">
              <div className="h-px flex-1 bg-neutral-200" />
              <span className="text-xs text-neutral-400">or</span>
              <div className="h-px flex-1 bg-neutral-200" />
            </div>
          )}

          <div className="space-y-2">
            {providers.google && (
              <Button variant="outline" className="w-full" onClick={handleGoogle} disabled={loading}>
                <span>Continue with Google</span>
              </Button>
            )}
            {providers.github && (
              <Button variant="outline" className="w-full" onClick={handleGithub} disabled={loading}>
                <span>Continue with GitHub</span>
              </Button>
            )}
          </div>

          <p className="mt-6 text-center text-sm text-neutral-500">
            Already have an account?{" "}
            <Link href={`/sign-in${plan ? `?plan=${plan}` : ""}`} className="font-semibold text-indigo-600 hover:text-indigo-700">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
