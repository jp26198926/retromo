"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useRetroBoard } from "@/components/board/useRetroBoard";
import { Column } from "@/components/board/Column";
import { ActionPointsPanel } from "@/components/board/ActionPointsPanel";
import { Button } from "@/components/Button";
import { Logo } from "@/components/Logo";
import { cn, timeAgo } from "@/lib/utils";

export default function RetroBoardPage() {
  const params = useParams<{ id: string }>();
  const retroId = params.id;
  const { state, loading, error, refresh } = useRetroBoard(retroId);
  const [showAP, setShowAP] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Timer
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // timer + retro are computed after the loading/error guards below

  function flash(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  }

  // --- Actions ---
  async function createCard(columnId: string, content: string) {
    await fetch("/api/cards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ columnId, retroId, content, isPublic: false }),
    });
    refresh();
  }

  async function vote(cardId: string) {
    const res = await fetch("/api/votes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cardId, retroId }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      flash(data.error || "Could not vote");
    }
    refresh();
  }

  async function deleteCard(cardId: string) {
    await fetch(`/api/cards?id=${cardId}`, { method: "DELETE" });
    refresh();
  }

  async function togglePublic(cardId: string) {
    const card = state?.cards.find((c) => c.id === cardId);
    if (!card) return;
    await fetch("/api/cards", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: cardId, isPublic: !card.isPublic }),
    });
    refresh();
  }

  async function colorChange(cardId: string, color: string) {
    await fetch("/api/cards", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: cardId, color }),
    });
    refresh();
  }

  async function dropCard(cardId: string, columnId: string, isPublic: boolean) {
    await fetch("/api/cards", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: cardId, columnId, isPublic }),
    });
    refresh();
  }

  // Action points
  async function createAP(text: string, assigneeName: string, dueDate: string) {
    await fetch("/api/action-points", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ retroId, text, assigneeName, dueDate }),
    });
    refresh();
  }
  async function toggleAP(id: string, status: "open" | "done") {
    await fetch("/api/action-points", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    refresh();
  }
  async function deleteAP(id: string) {
    await fetch(`/api/action-points?id=${id}`, { method: "DELETE" });
    refresh();
  }

  // Facilitator controls
  async function toggleLock() {
    await fetch(`/api/retros/${retroId}/settings`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locked: !state?.retro?.locked }),
    });
    refresh();
  }
  async function toggleSecretVoting() {
    await fetch(`/api/retros/${retroId}/settings`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secretVoting: !state?.retro?.secretVoting }),
    });
    refresh();
  }
  async function setTimer(minutes: number) {
    await fetch(`/api/retros/${retroId}/settings`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ timerMinutes: minutes }),
    });
    refresh();
  }

  function exportMarkdown() {
    if (!state) return;
    let md = `# ${state.retro.title}\n`;
    if (state.retro.topic) md += `**Topic:** ${state.retro.topic}\n\n`;
    state.columns
      .sort((a, b) => a.position - b.position)
      .forEach((col) => {
        md += `\n## ${col.name}\n`;
        if (col.description) md += `_${col.description}_\n`;
        const publicCards = state.cards.filter((c) => c.columnId === col.id && c.isPublic);
        publicCards.forEach((c) => {
          md += `- [${c.votesCount} votes] ${c.content}${c.authorName ? ` _(— ${c.authorName})_` : ""}\n`;
        });
        if (publicCards.length === 0) md += "_No public cards._\n";
      });
    if (state.actionPoints.length) {
      md += `\n## Action points\n`;
      state.actionPoints.forEach((a) => {
        md += `- [${a.status === "done" ? "x" : " "}] ${a.text}${a.assigneeName ? ` — @${a.assigneeName}` : ""}${a.dueDate ? ` (due ${new Date(a.dueDate).toLocaleDateString()})` : ""}\n`;
      });
    }
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${state.retro.title.replace(/\s+/g, "-").toLowerCase()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const isFacilitator = state?.currentParticipant?.isFacilitator || false;
  const showAuthor = state?.retro?.engagement === "required_names";
  const sortedColumns = useMemo(
    () => [...(state?.columns ?? [])].sort((a, b) => a.position - b.position),
    [state?.columns]
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-neutral-500">Loading board…</p>
      </div>
    );
  }
  if (error || !state) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p className="text-red-600">{error || "Board not found"}</p>
        <Link href="/new-retrospective"><Button>Create a new retro</Button></Link>
      </div>
    );
  }

  // state is now non-null (guarded above)
  const timerEndsAt = state.retro.timerEndsAt ? new Date(state.retro.timerEndsAt).getTime() : 0;
  const realTimerLeft = Math.max(0, Math.floor((timerEndsAt - now) / 1000));
  const realTimerRunning = timerEndsAt > now;
  const retroData = state.retro;

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-neutral-100">
      {/* Top toolbar */}
      <header className="flex flex-shrink-0 items-center gap-2 border-b border-neutral-200 bg-white px-3 py-2 sm:px-4">
        <Logo className="hidden sm:flex" />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-sm font-semibold text-neutral-900 sm:text-base">{retroData.title}</h1>
          {retroData.topic && <p className="truncate text-xs text-neutral-500">{retroData.topic}</p>}
        </div>

        {/* Participants avatars */}
        <div className="hidden items-center -space-x-2 sm:flex">
          {state.participants.slice(0, 6).map((p) => (
            <div
              key={p.id}
              className="h-7 w-7 rounded-full border-2 border-white text-center text-[10px] font-semibold leading-6 text-white"
              style={{ backgroundColor: p.color || "#6366f1" }}
              title={p.displayName || "Anonymous"}
            >
              {(p.displayName || "?").charAt(0).toUpperCase()}
            </div>
          ))}
          {state.participants.length > 6 && (
            <div className="h-7 w-7 rounded-full border-2 border-white bg-neutral-300 text-center text-[10px] font-semibold leading-6 text-white">
              +{state.participants.length - 6}
            </div>
          )}
        </div>

        {/* Timer */}
        {realTimerRunning && (
          <div className={cn("rounded-md px-2 py-1 text-xs font-mono font-semibold", realTimerLeft < 60 ? "bg-red-100 text-red-700" : "bg-neutral-100 text-neutral-700")}>
            {String(Math.floor(realTimerLeft / 60)).padStart(2, "0")}:{String(realTimerLeft % 60).padStart(2, "0")}
          </div>
        )}

        <Button size="sm" variant="outline" onClick={() => setShowAP(true)}>
          <span className="hidden sm:inline">Action points</span>
          <span className="sm:hidden">✅</span>
          {state.actionPoints.length > 0 && (
            <span className="ml-1 rounded-full bg-indigo-100 px-1.5 text-xs text-indigo-700">{state.actionPoints.length}</span>
          )}
        </Button>
        <Button size="sm" variant="ghost" onClick={exportMarkdown} title="Export to Markdown">
          <span className="hidden sm:inline">Export</span>
          <span className="sm:hidden">⬇</span>
        </Button>
      </header>

      {/* Facilitator toolbar */}
      <div className="flex flex-shrink-0 flex-wrap items-center gap-2 border-b border-neutral-200 bg-white px-3 py-1.5 sm:px-4">
        <span className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
          {isFacilitator ? "Facilitator tools" : "Tools"}
        </span>

        <button onClick={toggleSecretVoting} className={cn("rounded-md px-2 py-1 text-xs", retroData.secretVoting ? "bg-indigo-100 text-indigo-700" : "bg-neutral-100 text-neutral-600")}>
          Secret voting {retroData.secretVoting ? "on" : "off"}
        </button>

        <select
          value={0}
          onChange={(e) => setTimer(Number(e.target.value))}
          className="rounded-md border border-neutral-300 bg-white px-2 py-1 text-xs"
        >
          <option value={0}>Timer: off</option>
          <option value={1}>1 min</option>
          <option value={3}>3 min</option>
          <option value={5}>5 min</option>
          <option value={10}>10 min</option>
          <option value={15}>15 min</option>
        </select>

        <button onClick={toggleLock} className={cn("rounded-md px-2 py-1 text-xs", retroData.locked ? "bg-amber-100 text-amber-700" : "bg-neutral-100 text-neutral-600")}>
          {retroData.locked ? "🔒 Locked" : "🔓 Editable"}
        </button>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/retro/${retroId}`); flash("Link copied!"); }}
            className="rounded-md bg-neutral-100 px-2 py-1 text-xs text-neutral-700 hover:bg-neutral-200"
          >
            Copy link
          </button>
        </div>
      </div>

      {/* Board */}
      <div className="board-scroll flex flex-1 gap-3 overflow-x-auto overflow-y-hidden p-3 sm:p-4">
        {sortedColumns.map((col) => (
          <Column
            key={col.id}
            column={col}
            cards={state.cards.filter((c) => c.columnId === col.id)}
            currentUserId={state.currentUserId}
            currentParticipantId={state.currentParticipant?.id || null}
            currentParticipantName={state.currentParticipant?.displayName || null}
            secretVoting={retroData.secretVoting}
            showAuthor={showAuthor}
            locked={retroData.locked}
            onCreateCard={createCard}
            onVote={vote}
            onDeleteCard={deleteCard}
            onTogglePublic={togglePublic}
            onColorChange={colorChange}
            onDropCard={dropCard}
            draggedId={draggedId}
            setDraggedId={setDraggedId}
          />
        ))}
      </div>

      {/* Action points slide-over */}
      {showAP && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/20" onClick={() => setShowAP(false)} />
          <div className="relative h-full w-full max-w-md animate-fade-in shadow-xl sm:w-96">
            <ActionPointsPanel
              actionPoints={state.actionPoints}
              onClose={() => setShowAP(false)}
              onCreate={createAP}
              onToggle={toggleAP}
              onDelete={deleteAP}
            />
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-neutral-900 px-4 py-2 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
