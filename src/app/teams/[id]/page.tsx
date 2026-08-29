"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/Button";
import { useSession } from "@/lib/auth-client";
import { timeAgo } from "@/lib/utils";

interface Member {
  id: string;
  role: string;
  user: { id: string; name: string; email: string; image: string | null };
}
interface Retro {
  id: string;
  title: string;
  topic: string | null;
  updatedAt: string;
  plan: string;
}
interface ActionPoint {
  id: string;
  text: string;
  status: string;
  assigneeName: string | null;
  dueDate: string | null;
  retro: { id: string; title: string };
}
interface TeamDetail {
  team: { id: string; name: string; color: string; ownerId: string | null; createdAt: string };
  members: Member[];
  myRole: string | null;
  isMember: boolean;
  retros: Retro[];
  actionPoints: ActionPoint[];
}

export default function TeamDetailPage() {
  const params = useParams<{ id: string }>();
  const { data: session } = useSession();
  const [data, setData] = useState<TeamDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteMsg, setInviteMsg] = useState("");
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("#6366f1");

  const load = () => {
    fetch(`/api/teams/${params.id}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then((d) => {
        setData(d);
        setEditName(d.team.name);
        setEditColor(d.team.color);
      })
      .catch(() => setError("Team not found or you don't have access."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [params.id]);

  const handleInvite = async () => {
    setInviteMsg("");
    const res = await fetch(`/api/teams/${params.id}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: inviteEmail }),
    });
    const d = await res.json();
    if (res.ok) {
      setInviteEmail("");
      setInviteMsg("Member added!");
      load();
    } else {
      setInviteMsg(d.error || "Failed to add member");
    }
  };

  const handleRemoveMember = async (userId: string, name: string) => {
    if (!confirm(`Remove ${name} from this team?`)) return;
    await fetch(`/api/teams/${params.id}/members?userId=${userId}`, { method: "DELETE" });
    load();
  };

  const handleSaveEdit = async () => {
    const res = await fetch(`/api/teams/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName, color: editColor }),
    });
    if (res.ok) {
      setEditing(false);
      load();
    }
  };

  const handleDeleteTeam = async () => {
    if (!confirm("Delete this team? All retros will be unlinked. This cannot be undone.")) return;
    const res = await fetch(`/api/teams/${params.id}`, { method: "DELETE" });
    if (res.ok) {
      window.location.href = "/teams";
    }
  };

  const COLORS = ["#6366f1", "#ec4899", "#14b8a6", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#84cc16"];

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex flex-1 items-center justify-center">
          <p className="text-neutral-500">Loading…</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
          <h1 className="text-2xl font-bold text-neutral-900">{error || "Team not found"}</h1>
          <Link href="/teams"><Button variant="outline">Back to teams</Button></Link>
        </main>
        <Footer />
      </div>
    );
  }

  const isOwner = data.myRole === "owner";
  const openActionPoints = data.actionPoints.filter((ap) => ap.status === "open");
  const doneActionPoints = data.actionPoints.filter((ap) => ap.status === "done");

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
          {/* Header */}
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-4">
              <div
                className="flex h-14 w-14 items-center justify-center rounded-2xl text-2xl font-bold text-white"
                style={{ backgroundColor: data.team.color }}
              >
                {data.team.name.charAt(0).toUpperCase()}
              </div>
              <div>
                {editing ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="rounded-lg border border-neutral-300 px-3 py-1 text-lg font-bold focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    />
                    <div className="flex gap-1">
                      {COLORS.map((c) => (
                        <button
                          key={c}
                          onClick={() => setEditColor(c)}
                          className={`h-6 w-6 rounded-full ${editColor === c ? "ring-2 ring-offset-1 ring-neutral-900" : ""}`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <>
                    <h1 className="text-3xl font-bold tracking-tight text-neutral-900">{data.team.name}</h1>
                    <p className="mt-0.5 text-sm text-neutral-500">
                      {data.members.length} member{data.members.length !== 1 ? "s" : ""} · Created {timeAgo(data.team.createdAt)}
                    </p>
                  </>
                )}
              </div>
            </div>
            {isOwner && (
              <div className="flex gap-2">
                {editing ? (
                  <>
                    <Button size="sm" onClick={handleSaveEdit}>Save</Button>
                    <Button size="sm" variant="outline" onClick={() => { setEditing(false); setEditName(data.team.name); }}>Cancel</Button>
                  </>
                ) : (
                  <>
                    <Button size="sm" variant="outline" onClick={() => setEditing(true)}>Edit</Button>
                    <Button size="sm" variant="danger" onClick={handleDeleteTeam}>Delete team</Button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Tabs-like sections */}
          <div className="mt-10 grid gap-8 lg:grid-cols-3">
            {/* Members */}
            <section className="lg:col-span-1">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-neutral-900">Members</h2>
                {isOwner && (
                  <Button size="sm" variant="outline" onClick={() => setShowInvite((v) => !v)}>
                    {showInvite ? "Cancel" : "+ Invite"}
                  </Button>
                )}
              </div>

              {showInvite && (
                <div className="mt-3 rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="user@email.com"
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                  <Button size="sm" className="mt-2 w-full" onClick={handleInvite}>Add member</Button>
                  {inviteMsg && <p className="mt-2 text-sm text-neutral-600">{inviteMsg}</p>}
                </div>
              )}

              <ul className="mt-4 space-y-2">
                {data.members.map((m) => (
                  <li
                    key={m.id}
                    className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white p-3"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700">
                        {m.user.name?.charAt(0).toUpperCase() || "?"}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-neutral-900">{m.user.name}</p>
                        <p className="truncate text-xs text-neutral-500">{m.user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {m.role === "owner" && (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">Owner</span>
                      )}
                      {(isOwner || m.user.id === session?.user?.id) && m.role !== "owner" && (
                        <button
                          onClick={() => handleRemoveMember(m.user.id, m.user.name)}
                          className="text-xs text-red-500 hover:text-red-700"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            {/* Retros + Action Points */}
            <section className="space-y-8 lg:col-span-2">
              {/* Retros */}
              <div>
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-neutral-900">Team retrospectives</h2>
                  <Link href={`/new-retrospective?teamId=${data.team.id}`}>
                    <Button size="sm">+ New retro</Button>
                  </Link>
                </div>
                {data.retros.length === 0 ? (
                  <div className="mt-4 rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-8 text-center">
                    <p className="text-neutral-500">No retros yet for this team.</p>
                    <Link href={`/new-retrospective?teamId=${data.team.id}`} className="mt-3 inline-block">
                      <Button size="sm">Start one</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {data.retros.map((r) => (
                      <Link
                        key={r.id}
                        href={`/retro/${r.id}`}
                        className="group rounded-xl border border-neutral-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
                      >
                        <div className="flex items-center justify-between">
                          <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">{r.plan}</span>
                          <span className="text-xs text-neutral-400">{timeAgo(r.updatedAt)}</span>
                        </div>
                        <h3 className="mt-2 font-semibold text-neutral-900 group-hover:text-indigo-600">{r.title}</h3>
                        {r.topic && <p className="mt-1 text-sm text-neutral-500">{r.topic}</p>}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Points overview */}
              <div>
                <h2 className="text-lg font-semibold text-neutral-900">Action points overview</h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-neutral-200 bg-white p-4">
                    <p className="text-sm text-neutral-500">Open</p>
                    <p className="text-2xl font-bold text-amber-600">{openActionPoints.length}</p>
                  </div>
                  <div className="rounded-xl border border-neutral-200 bg-white p-4">
                    <p className="text-sm text-neutral-500">Done</p>
                    <p className="text-2xl font-bold text-green-600">{doneActionPoints.length}</p>
                  </div>
                </div>

                {data.actionPoints.length > 0 && (
                  <ul className="mt-4 space-y-2">
                    {data.actionPoints.map((ap) => (
                      <li key={ap.id} className="flex items-start justify-between gap-3 rounded-xl border border-neutral-200 bg-white p-3">
                        <div className="min-w-0">
                          <p className={`text-sm font-medium ${ap.status === "done" ? "text-neutral-400 line-through" : "text-neutral-900"}`}>
                            {ap.text}
                          </p>
                          <p className="mt-0.5 text-xs text-neutral-500">
                            From <Link href={`/retro/${ap.retro.id}`} className="text-indigo-600 hover:underline">{ap.retro.title}</Link>
                            {ap.assigneeName && ` · ${ap.assigneeName}`}
                            {ap.dueDate && ` · due ${new Date(ap.dueDate).toLocaleDateString()}`}
                          </p>
                        </div>
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${ap.status === "done" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                          {ap.status === "done" ? "Done" : "Open"}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
