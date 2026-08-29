"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/Button";
import { useSession } from "@/lib/auth-client";

interface TeamItem {
  id: string;
  name: string;
  color: string;
  myRole: string;
  memberCount: number;
  createdAt: string;
}

const TEAM_COLORS = [
  "#6366f1", "#ec4899", "#14b8a6", "#f59e0b",
  "#ef4444", "#8b5cf6", "#06b6d4", "#84cc16",
];

export default function TeamsPage() {
  const { data: session, isPending } = useSession();
  const [teams, setTeams] = useState<TeamItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState(TEAM_COLORS[0]);
  const [creating, setCreating] = useState(false);

  const loadTeams = () => {
    fetch("/api/teams")
      .then((r) => r.json())
      .then((d) => setTeams(d.teams || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!session) {
      setLoading(false);
      return;
    }
    loadTeams();
  }, [session]);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setCreating(true);
    const res = await fetch("/api/teams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), color }),
    });
    setCreating(false);
    if (res.ok) {
      setName("");
      setShowCreate(false);
      loadTeams();
    }
  };

  if (!isPending && !session) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
          <h1 className="text-2xl font-bold text-neutral-900">Sign in to manage teams</h1>
          <p className="text-neutral-600">Teams let you group retrospectives and track action points together.</p>
          <div className="flex gap-3">
            <Link href="/sign-in"><Button>Sign in</Button></Link>
            <Link href="/sign-up"><Button variant="outline">Create account</Button></Link>
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
              <h1 className="text-3xl font-bold tracking-tight text-neutral-900">Teams</h1>
              <p className="mt-1 text-neutral-600">Group retros and track action points across your team.</p>
            </div>
            <Button size="lg" onClick={() => setShowCreate((v) => !v)}>
              {showCreate ? "Cancel" : "+ New team"}
            </Button>
          </div>

          {showCreate && (
            <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-neutral-900">Create a team</h2>
              <div className="mt-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700">Team name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Engineering Team"
                    className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700">Color</label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {TEAM_COLORS.map((c) => (
                      <button
                        key={c}
                        onClick={() => setColor(c)}
                        className={`h-8 w-8 rounded-full transition-transform ${color === c ? "ring-2 ring-offset-2 ring-neutral-900 scale-110" : ""}`}
                        style={{ backgroundColor: c }}
                        aria-label={`Color ${c}`}
                      />
                    ))}
                  </div>
                </div>
                <Button onClick={handleCreate} disabled={creating || !name.trim()}>
                  {creating ? "Creating…" : "Create team"}
                </Button>
              </div>
            </div>
          )}

          <section className="mt-10">
            {loading ? (
              <p className="text-neutral-500">Loading…</p>
            ) : teams.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-12 text-center">
                <p className="text-neutral-500">No teams yet.</p>
                <Button className="mt-3" onClick={() => setShowCreate(true)}>Create your first team</Button>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {teams.map((t) => (
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
                    <div className="mt-3">
                      <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-600">
                        {t.myRole === "owner" ? "Owner" : "Member"}
                      </span>
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
