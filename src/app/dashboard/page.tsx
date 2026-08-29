"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/Button";
import { useSession } from "@/lib/auth-client";
import { timeAgo } from "@/lib/utils";

export default function DashboardPage() {
  const { data: session, isPending } = useSession();
  const [retros, setRetros] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) return;
    Promise.all([
      fetch("/api/retros").then((r) => r.json()),
      fetch("/api/teams").then((r) => r.json()),
    ])
      .then(([rData, tData]) => {
        setRetros(rData.retros || []);
        setTeams(tData.teams || []);
      })
      .finally(() => setLoading(false));
  }, [session]);

  if (!isPending && !session) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
          <h1 className="text-2xl font-bold text-neutral-900">Sign in to view your dashboard</h1>
          <p className="text-neutral-600">Track your retrospectives and teams in one place.</p>
          <div className="flex gap-3">
            <Link href="/sign-in"><Button>Sign in</Button></Link>
            <Link href="/new-retrospective"><Button variant="outline">Create anonymous retro</Button></Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-neutral-900">
                Welcome back{session?.user?.name ? `, ${session.user.name}` : ""}
              </h1>
              <p className="mt-1 text-neutral-600">Your retrospectives and teams in one place.</p>
            </div>
            <Link href="/new-retrospective">
              <Button size="lg">+ New retro</Button>
            </Link>
          </div>

          <section className="mt-10">
            <h2 className="mb-4 text-lg font-semibold text-neutral-900">Recent retrospectives</h2>
            {loading ? (
              <p className="text-neutral-500">Loading…</p>
            ) : retros.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-12 text-center">
                <p className="text-neutral-500">No retros yet.</p>
                <Link href="/new-retrospective" className="mt-3 inline-block">
                  <Button>Create your first retro</Button>
                </Link>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {retros.map((r: any) => (
                  <Link
                    key={r.id}
                    href={`/retro/${r.id}`}
                    className="group rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
                  >
                    <div className="flex items-center justify-between">
                      <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">{r.plan}</span>
                      <span className="text-xs text-neutral-400">{timeAgo(r.updatedAt)}</span>
                    </div>
                    <h3 className="mt-3 font-semibold text-neutral-900 group-hover:text-indigo-600">{r.title}</h3>
                    {r.topic && <p className="mt-1 text-sm text-neutral-500">{r.topic}</p>}
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section className="mt-12">
            <div className="flex items-center justify-between">
              <h2 className="mb-4 text-lg font-semibold text-neutral-900">Your teams</h2>
              <Link href="/teams" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">View all →</Link>
            </div>
            {teams.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-8 text-center">
                <p className="text-neutral-500">No teams yet.</p>
                <Link href="/teams" className="mt-3 inline-block">
                  <Button variant="outline">Create a team</Button>
                </Link>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {teams.map((t: any) => (
                  <Link
                    key={t.id}
                    href={`/teams/${t.id}`}
                    className="group rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-xl text-lg font-bold text-white"
                        style={{ backgroundColor: t.color }}
                      >
                        {t.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate font-semibold text-neutral-900 group-hover:text-indigo-600">{t.name}</h3>
                        <p className="text-xs text-neutral-500">{t.memberCount} member{t.memberCount !== 1 ? "s" : ""}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
