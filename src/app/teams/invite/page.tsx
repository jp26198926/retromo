"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/Button";
import { useSession } from "@/lib/auth-client";

export default function TeamInvitePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen flex-col">
          <Navbar />
          <main className="flex flex-1 items-center justify-center">
            <p className="text-neutral-500">Loading invitation…</p>
          </main>
          <Footer />
        </div>
      }
    >
      <TeamInviteContent />
    </Suspense>
  );
}

function TeamInviteContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const { data: session, isPending } = useSession();

  const [invite, setInvite] = useState<{
    teamName: string;
    teamColor: string;
    email: string;
    role: string;
    status: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("Missing invitation token.");
      setLoading(false);
      return;
    }
    fetch(`/api/teams/invite?token=${encodeURIComponent(token)}`)
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) {
          setError(d.error || "Invitation not found.");
        } else {
          setInvite(d);
        }
      })
      .catch(() => setError("Failed to load invitation."))
      .finally(() => setLoading(false));
  }, [token]);

  const handleAccept = async () => {
    if (!token) return;
    setAccepting(true);
    try {
      const res = await fetch("/api/teams/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const d = await res.json();
      if (res.ok) {
        setAccepted(true);
        setTimeout(() => {
          router.push(`/teams/${d.teamId}`);
        }, 1500);
      } else {
        setError(d.error || "Failed to accept invitation.");
      }
    } catch {
      setError("Failed to accept invitation.");
    } finally {
      setAccepting(false);
    }
  };

  const isLoggedIn = !isPending && !!session?.session && !!session?.user;

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex flex-1 items-center justify-center">
          <p className="text-neutral-500">Loading invitation…</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !invite) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
          <h1 className="text-2xl font-bold text-neutral-900">Invitation Error</h1>
          <p className="max-w-md text-neutral-600">{error || "This invitation could not be found."}</p>
          <a href="/teams"><Button variant="outline">Back to teams</Button></a>
        </main>
        <Footer />
      </div>
    );
  }

  if (accepted) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
          <div className="text-5xl">🎉</div>
          <h1 className="text-2xl font-bold text-neutral-900">Welcome to the team!</h1>
          <p className="text-neutral-600">You've successfully joined "{invite.teamName}". Redirecting…</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm text-center">
          <div
            className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl text-2xl font-bold text-white"
            style={{ backgroundColor: invite.teamColor }}
          >
            {invite.teamName.charAt(0).toUpperCase()}
          </div>
          <h1 className="mt-5 text-2xl font-bold text-neutral-900">
            Join "{invite.teamName}"
          </h1>
          <p className="mt-2 text-neutral-600">
            You've been invited to collaborate on this team as a{" "}
            <span className="font-semibold">{invite.role}</span>.
          </p>

          {isLoggedIn ? (
            <>
              <p className="mt-4 text-sm text-neutral-500">
                Signed in as <span className="font-medium text-neutral-700">{session?.user?.email}</span>
              </p>
              <div className="mt-6">
                <Button onClick={handleAccept} disabled={accepting} className="w-full">
                  {accepting ? "Accepting…" : "Accept Invitation"}
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="mt-4 text-sm text-neutral-500">
                You need to create an account or sign in to accept this invitation.
              </p>
              <div className="mt-6 flex flex-col gap-3">
                <a href={`/sign-up?redirect=${encodeURIComponent(`/teams/invite?token=${token}`)}`}>
                  <Button className="w-full">Create your account</Button>
                </a>
                <a href={`/sign-in?redirect=${encodeURIComponent(`/teams/invite?token=${token}`)}`}>
                  <Button variant="outline" className="w-full">Sign in</Button>
                </a>
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
