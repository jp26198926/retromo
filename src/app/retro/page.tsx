"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/Button";
import { useSession } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

interface RetroHistoryItem {
  id: string;
  title: string;
  topic: string | null;
  plan: string;
  visibility: string;
  locked: boolean;
  archived: boolean;
  teamId: string | null;
  ownerId: string | null;
  isOwner: boolean;
  createdAt: string;
  updatedAt: string;
  teamName: string | null;
  teamColor: string | null;
  participantCount: number;
}

interface TeamOption {
  id: string;
  name: string;
  color: string;
}

type SortBy = "title" | "plan" | "createdAt" | "updatedAt";
type SortDir = "asc" | "desc";

export default function RetroHistoryPage() {
  const { data: session, isPending } = useSession();

  const [items, setItems] = useState<RetroHistoryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [planFilter, setPlanFilter] = useState("");
  const [teamFilter, setTeamFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("updatedAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const [teams, setTeams] = useState<TeamOption[]>([]);

  // Debounced search: commit searchInput -> search after 400ms of inactivity
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Load teams for filter dropdown
  useEffect(() => {
    if (!session) return;
    fetch("/api/teams")
      .then((r) => r.json())
      .then((d) => setTeams(d.teams || []))
      .catch(() => {});
  }, [session]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (planFilter) params.set("plan", planFilter);
    if (teamFilter) params.set("teamId", teamFilter);
    if (roleFilter) params.set("role", roleFilter);
    params.set("sortBy", sortBy);
    params.set("sortDir", sortDir);
    params.set("page", String(page));
    params.set("pageSize", String(pageSize));

    try {
      const res = await fetch(`/api/retros/history?${params.toString()}`);
      const d = await res.json();
      if (res.ok && d.items) {
        setItems(d.items);
        setTotal(d.total);
        setTotalPages(d.totalPages);
      } else {
        setItems([]);
        setTotal(0);
        setTotalPages(0);
      }
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [search, planFilter, teamFilter, roleFilter, sortBy, sortDir, page, pageSize]);

  useEffect(() => {
    if (session) fetchData();
    else setLoading(false);
  }, [session, fetchData]);

  const toggleSort = (col: SortBy) => {
    if (sortBy === col) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(col);
      setSortDir(col === "title" ? "asc" : "desc");
    }
    setPage(1);
  };

  const resetFilters = () => {
    setSearchInput("");
    setSearch("");
    setPlanFilter("");
    setTeamFilter("");
    setRoleFilter("");
    setSortBy("updatedAt");
    setSortDir("desc");
    setPage(1);
  };

  const toggleArchive = async (id: string, currentArchived: boolean) => {
    const res = await fetch(`/api/retros/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ archived: !currentArchived }),
    });
    if (res.ok) {
      fetchData();
    } else {
      const d = await res.json().catch(() => ({}));
      alert(d.error || "Failed to update archive status");
    }
  };

  const hasFilters = useMemo(
    () => search || planFilter || teamFilter || roleFilter,
    [search, planFilter, teamFilter, roleFilter]
  );

  const planBadge = (plan: string) => {
    const map: Record<string, string> = {
      anonymous: "bg-neutral-100 text-neutral-600",
      individual: "bg-indigo-100 text-indigo-700",
      company: "bg-purple-100 text-purple-700",
    };
    return map[plan] || "bg-neutral-100 text-neutral-600";
  };

  const planLabel = (plan: string) =>
    plan === "individual" ? "Individual" : plan === "company" ? "Company" : "Anonymous";

  if (!isPending && !session) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
          <h1 className="text-2xl font-bold text-neutral-900">Sign in to view your retrospectives</h1>
          <p className="text-neutral-600">See all the retros you&apos;ve created or participated in.</p>
          <div className="flex gap-3">
            <Link href="/sign-in"><Button>Sign in</Button></Link>
            <Link href="/new-retrospective"><Button variant="outline">Create anonymous retro</Button></Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (isPending || (loading && items.length === 0)) {
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

  const SortIcon = ({ col }: { col: SortBy }) => {
    if (sortBy !== col) return <span className="ml-1 inline-block w-3 text-neutral-300">↕</span>;
    return <span className="ml-1 inline-block w-3 text-indigo-600">{sortDir === "asc" ? "↑" : "↓"}</span>;
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          {/* Header */}
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-neutral-900">My retrospectives</h1>
              <p className="mt-1 text-neutral-600">
                All retros you&apos;ve created or participated in. {total > 0 && <span className="text-neutral-400">({total} total)</span>}
              </p>
            </div>
            <Link href="/new-retrospective">
              <Button>+ New retro</Button>
            </Link>
          </div>

          {/* Filters bar */}
          <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center gap-3">
              {/* Search */}
              <div className="relative min-w-[200px] flex-1">
                <svg
                  className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
                  fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search by title or topic…"
                  className="w-full rounded-lg border border-neutral-300 py-2 pl-9 pr-3 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {/* Plan filter */}
              <select
                value={planFilter}
                onChange={(e) => { setPlanFilter(e.target.value); setPage(1); }}
                className="rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="">All plans</option>
                <option value="anonymous">Anonymous</option>
                <option value="individual">Individual</option>
                <option value="company">Company</option>
              </select>

              {/* Team filter */}
              {teams.length > 0 && (
                <select
                  value={teamFilter}
                  onChange={(e) => { setTeamFilter(e.target.value); setPage(1); }}
                  className="rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="">All teams</option>
                  <option value="none">No team</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              )}

              {/* Role filter */}
              <select
                value={roleFilter}
                onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
                className="rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="">All roles</option>
                <option value="owner">Created by me</option>
                <option value="participant">Participated in</option>
              </select>

              {hasFilters && (
                <button
                  onClick={resetFilters}
                  className="text-sm font-medium text-neutral-500 hover:text-neutral-900"
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>

          {/* Datatable */}
          <div className="mt-4 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
                    <th className="cursor-pointer px-4 py-3 font-medium select-none" onClick={() => toggleSort("title")}>
                      Title <SortIcon col="title" />
                    </th>
                    <th className="cursor-pointer px-4 py-3 font-medium select-none" onClick={() => toggleSort("plan")}>
                      Plan <SortIcon col="plan" />
                    </th>
                    <th className="px-4 py-3 font-medium">Team</th>
                    <th className="px-4 py-3 font-medium">Participants</th>
                    <th className="px-4 py-3 font-medium">Role</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="cursor-pointer px-4 py-3 font-medium select-none" onClick={() => toggleSort("createdAt")}>
                      Created <SortIcon col="createdAt" />
                    </th>
                    <th className="cursor-pointer px-4 py-3 font-medium select-none" onClick={() => toggleSort("updatedAt")}>
                      Updated <SortIcon col="updatedAt" />
                    </th>
                    <th className="px-4 py-3 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && items.length > 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-12 text-center text-neutral-400">Updating…</td>
                    </tr>
                  ) : items.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-12 text-center">
                        <p className="text-neutral-500">
                          {hasFilters ? "No retros match your filters." : "No retros yet."}
                        </p>
                        {!hasFilters && (
                          <Link href="/new-retrospective" className="mt-3 inline-block">
                            <Button size="sm">Create your first retro</Button>
                          </Link>
                        )}
                      </td>
                    </tr>
                  ) : (
                    items.map((item) => (
                      <tr key={item.id} className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50/50">
                        <td className="px-4 py-3">
                          <Link href={`/retro/${item.id}`} className="font-medium text-neutral-900 hover:text-indigo-600">
                            {item.title}
                          </Link>
                          {item.topic && (
                            <p className="mt-0.5 max-w-xs truncate text-xs text-neutral-400">{item.topic}</p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", planBadge(item.plan))}>
                            {planLabel(item.plan)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {item.teamName ? (
                            <span className="inline-flex items-center gap-1.5">
                              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.teamColor || "#6366f1" }} />
                              <span className="text-neutral-700">{item.teamName}</span>
                            </span>
                          ) : (
                            <span className="text-neutral-300">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-neutral-600">
                          {item.participantCount}
                        </td>
                        <td className="px-4 py-3">
                          {item.isOwner ? (
                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">Host</span>
                          ) : (
                            <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-700">Participant</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {item.locked && (
                              <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">Locked</span>
                            )}
                            {!item.locked && (
                              <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">Editable</span>
                            )}
                            {item.archived && (
                              <span className="rounded-full bg-neutral-200 px-2 py-0.5 text-xs font-medium text-neutral-600">Archived</span>
                            )}
                            {item.visibility === "private" && (
                              <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">Private</span>
                            )}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-neutral-500">
                          {new Date(item.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-neutral-500">
                          {new Date(item.updatedAt).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Link href={`/retro/${item.id}`}>
                              <Button size="sm" variant="outline">Open</Button>
                            </Link>
                            {item.isOwner && item.plan !== "anonymous" && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => toggleArchive(item.id, item.archived)}
                                title={item.archived ? "Unarchive" : "Archive"}
                              >
                                {item.archived ? "↪" : "📦"}
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-neutral-200 px-4 py-3">
                <p className="text-sm text-neutral-500">
                  Page {page} of {totalPages} · {total} retrospective{total !== 1 ? "s" : ""}
                </p>
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={page <= 1}
                    onClick={() => setPage(1)}
                  >
                    First
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Prev
                  </Button>
                  {/* Page number buttons */}
                  {getPageRange(page, totalPages).map((p, i) =>
                    p === -1 ? (
                      <span key={`ellipsis-${i}`} className="px-2 text-neutral-400">…</span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={cn(
                          "rounded-md px-3 py-1.5 text-sm font-medium",
                          p === page
                            ? "bg-indigo-600 text-white"
                            : "text-neutral-600 hover:bg-neutral-100"
                        )}
                      >
                        {p}
                      </button>
                    )
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    Next
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={page >= totalPages}
                    onClick={() => setPage(totalPages)}
                  >
                    Last
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

// Helper to compute a compact page range with ellipsis
function getPageRange(current: number, total: number): number[] {
  const range: number[] = [];
  const delta = 1; // pages on each side of current

  for (let i = 1; i <= total; i++) {
    if (
      i === 1 ||
      i === total ||
      (i >= current - delta && i <= current + delta)
    ) {
      range.push(i);
    } else if (range[range.length - 1] !== -1) {
      range.push(-1); // ellipsis
    }
  }
  return range;
}
