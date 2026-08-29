"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { signIn } from "@/lib/auth-client";
import { Button } from "@/components/Button";
import { Logo } from "@/components/Logo";
import { useSocialProviders } from "@/components/useSocialProviders";

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><p className="text-neutral-500">Loading…</p></div>}>
      <SignInForm />
    </Suspense>
  );
}

function SignInForm() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackURL = params.get("callbackURL") || "/dashboard";
  const plan = params.get("plan");
  const { providers } = useSocialProviders();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await signIn.email({ email, password }, {
      onError: (ctx) => {
        setError(ctx.error.message || "Sign in failed");
        setLoading(false);
      },
      onSuccess: () => router.push(callbackURL),
    });
    if (res?.error && !res.data) {
      setError(res.error.message || "Sign in failed");
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

  const hasSocial = providers.google || providers.github;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center"><Logo /></div>
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h1 className="text-xl font-bold text-neutral-900">Welcome back</h1>
          <p className="mt-1 text-sm text-neutral-500">Sign in to your RetroMo account{plan ? ` to start your ${plan} trial` : ""}.</p>

          {error && <div className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                placeholder="••••••••"
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Signing in…" : "Sign in"}
            </Button>
          </form>

          {hasSocial && (
            <>
              <div className="my-4 flex items-center gap-3">
                <div className="h-px flex-1 bg-neutral-200" />
                <span className="text-xs text-neutral-400">or</span>
                <div className="h-px flex-1 bg-neutral-200" />
              </div>

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
            </>
          )}

          <p className="mt-6 text-center text-sm text-neutral-500">
            No account?{" "}
            <Link href={`/sign-up${plan ? `?plan=${plan}` : ""}`} className="font-semibold text-indigo-600 hover:text-indigo-700">
              Sign up
            </Link>
          </p>
        </div>
        <p className="mt-4 text-center text-xs text-neutral-400">
          Just want a quick retro?{" "}
          <Link href="/new-retrospective" className="text-indigo-600 hover:underline">Create one anonymously</Link>
        </p>
      </div>
    </div>
  );
}
