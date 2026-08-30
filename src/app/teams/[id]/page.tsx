"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/Button";
import { ConfirmModal } from "@/components/ConfirmModal";
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
interface PendingInvitation {
  id: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
}
interface TeamDetail {
  team: { id: string; name: string; color: string; ownerId: string | null; createdAt: string };
  members: Member[];
  myRole: string | null;
  isMember: boolean;
  retros: Retro[];
  actionPoints: ActionPoint[];
  pendingInvitations?: PendingInvitation[];
}

export default function TeamDetailPage() {
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<TeamDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteMsg, setInviteMsg] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("#6366f1");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [removeMember, setRemoveMember] = useState<{ userId: string; name: string } | null>(null);
  const [removingMember, setRemovingMember] = useState(false);
  const [removeError, setRemoveError] = useState<string | null>(null);
  const [userPlan, setUserPlan] = useState<string>("anonymous");
  const [roleChangeMsg, setRoleChangeMsg] = useState<string | null>(null);

  // Fetch the user's plan to determine if Scrum Master / Team Lead roles are available
  useEffect(() => {
    fetch("/api/subscription")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.effectivePlan) setUserPlan(d.effectivePlan);
      })
      .catch(() => {});
  }, []);

  const isCompanyPlan = userPlan === "company";

  const handleRoleChange = async (userId: string, role: string) => {
    setRoleChangeMsg(null);
    const res = await fetch(`/api/teams/${params.id}/members`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, role }),
    });
    const d = await res.json();
    if (res.ok) {
      load();
    } else {
      setRoleChangeMsg(d.error || "Failed to update role");
      setTimeout(() => setRoleChangeMsg(null), 4000);
    }
  };

  const roleLabels: Record<string, string> = {
    owner: "Owner",
    member: "Member",
    scrumMaster: "Scrum Master",
    teamLead: "Team Lead",
  };

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
    setInviteLoading(true);
    const res = await fetch(`/api/teams/${params.id}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: inviteEmail }),
    });
    const d = await res.json();
    if (res.ok) {
      setInviteEmail("");
      setInviteMsg(d.message || "Done!");
      load();
    } else {
      setInviteMsg(d.error || "Failed to add member");
    }
    setInviteLoading(false);
  };

  const handleRemoveMember = async (userId: string) => {
    setRemoveError(null);
    setRemovingMember(true);
    const res = await fetch(`/api/teams/${params.id}/members?userId=${userId}`, { method: "DELETE" });
    setRemovingMember(false);
    if (res.ok) {
      setRemoveMember(null);
      load();
    } else {
      const d = await res.json().catch(() => ({}));
      setRemoveError(d.error || "Failed to remove member");
    }
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
    setDeleting(true);
    const res = await fetch(`/api/teams/${params.id}`, { method: "DELETE" });
    setDeleting(false);
    if (res.ok) {
      setShowDeleteModal(false);
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
                    <Button size="sm" variant="danger" onClick={() => setShowDeleteModal(true)}>Delete team</Button>
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
                  <Button size="sm" className="mt-2 w-full" onClick={handleInvite} disabled={inviteLoading}>
                    {inviteLoading ? "Sending…" : "Add member"}
                  </Button>
                  {inviteMsg && <p className="mt-2 text-sm text-neutral-600">{inviteMsg}</p>}
                </div>
              )}

              <ul className="mt-4 space-y-2">
                {roleChangeMsg && (
                  <li className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{roleChangeMsg}</li>
                )}
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
                      {m.role === "scrumMaster" && (
                        <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">Scrum Master</span>
                      )}
                      {m.role === "teamLead" && (
                        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">Team Lead</span>
                      )}
                      {m.role === "member" && (
                        <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-600">Member</span>
                      )}
                      {isOwner && m.role !== "owner" && (
                        <select
                          value={m.role}
                          onChange={(e) => handleRoleChange(m.user.id, e.target.value)}
                          className="rounded-md border border-neutral-300 bg-white px-2 py-1 text-xs text-neutral-700"
                          title="Change role"
                        >
                          <option value="member">Member</option>
                          <option value="scrumMaster" disabled={!isCompanyPlan}>
                            Scrum Master{!isCompanyPlan ? " (Company plan)" : ""}
                          </option>
                          <option value="teamLead" disabled={!isCompanyPlan}>
                            Team Lead{!isCompanyPlan ? " (Company plan)" : ""}
                          </option>
                        </select>
                      )}
                      {isOwner && m.role !== "owner" && (
                        <button
                          onClick={() => setRemoveMember({ userId: m.user.id, name: m.user.name })}
                          className="text-xs text-red-500 hover:text-red-700"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>

              {/* Pending invitations (owner/admin only) */}
              {isOwner && data.pendingInvitations && data.pendingInvitations.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-semibold text-neutral-700">Pending invitations</h3>
                  <ul className="mt-3 space-y-2">
                    {data.pendingInvitations.map((inv) => (
                      <li
                        key={inv.id}
                        className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 p-3"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-neutral-900">{inv.email}</p>
                          <p className="text-xs text-neutral-500">
                            Invited {timeAgo(inv.createdAt)} · {inv.role}
                          </p>
                        </div>
                        <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                          Pending
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
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

      {/* Delete team confirmation modal */}
      <ConfirmModal
        open={showDeleteModal}
        title="Delete team"
        message={`Are you sure you want to delete "${data.team.name}"? All retros will be unlinked. This action cannot be undone.`}
        confirmLabel="Delete team"
        variant="danger"
        loading={deleting}
        onConfirm={handleDeleteTeam}
        onCancel={() => setShowDeleteModal(false)}
      />

      {/* Remove member confirmation modal */}
      <ConfirmModal
        open={!!removeMember}
        title="Remove member"
        message={`Are you sure you want to remove ${removeMember?.name || "this member"} from the team?`}
        confirmLabel="Remove member"
        variant="danger"
        loading={removingMember}
        error={removeError}
        onConfirm={() => removeMember && handleRemoveMember(removeMember.userId)}
        onCancel={() => { setRemoveMember(null); setRemoveError(null); }}
      />
    </div>
  );
}
