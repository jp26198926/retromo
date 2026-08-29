"use client";

import { useState } from "react";
import { Button } from "@/components/Button";
import { cn } from "@/lib/utils";

export type ActionPointData = {
  id: string;
  text: string;
  assigneeName: string | null;
  dueDate: string | null;
  status: "open" | "done";
};

interface Props {
  actionPoints: ActionPointData[];
  onClose: () => void;
  onCreate: (text: string, assigneeName: string, dueDate: string) => void;
  onToggle: (id: string, status: "open" | "done") => void;
  onDelete: (id: string) => void;
}

export function ActionPointsPanel({ actionPoints, onClose, onCreate, onToggle, onDelete }: Props) {
  const [text, setText] = useState("");
  const [assignee, setAssignee] = useState("");
  const [due, setDue] = useState("");

  function add() {
    if (!text.trim()) return;
    onCreate(text.trim(), assignee.trim(), due);
    setText("");
    setAssignee("");
    setDue("");
  }

  const open = actionPoints.filter((a) => a.status === "open");
  const done = actionPoints.filter((a) => a.status === "done");

  return (
    <div className="flex h-full w-full flex-col bg-white">
      <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
        <h2 className="font-semibold text-neutral-900">Action points</h2>
        <button onClick={onClose} className="rounded-md p-1 text-neutral-400 hover:bg-neutral-100">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
        </button>
      </div>

      <div className="border-b border-neutral-200 p-4">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="What will the team do?"
          className="w-full resize-none rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
          rows={2}
        />
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <input
            value={assignee}
            onChange={(e) => setAssignee(e.target.value)}
            placeholder="Assignee (optional)"
            className="flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
          />
          <input
            type="date"
            value={due}
            onChange={(e) => setDue(e.target.value)}
            className="rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
          />
        </div>
        <Button size="sm" className="mt-2 w-full" onClick={add}>Add action point</Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {open.length === 0 && done.length === 0 && (
          <p className="py-8 text-center text-sm text-neutral-400">No action points yet.</p>
        )}
        {open.length > 0 && (
          <div className="mb-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">Open ({open.length})</p>
            <div className="space-y-2">
              {open.map((a) => (
                <ActionItem key={a.id} ap={a} onToggle={onToggle} onDelete={onDelete} />
              ))}
            </div>
          </div>
        )}
        {done.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">Done ({done.length})</p>
            <div className="space-y-2">
              {done.map((a) => (
                <ActionItem key={a.id} ap={a} onToggle={onToggle} onDelete={onDelete} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ActionItem({ ap, onToggle, onDelete }: { ap: ActionPointData; onToggle: (id: string, s: "open" | "done") => void; onDelete: (id: string) => void }) {
  return (
    <div className={cn("group flex items-start gap-2 rounded-lg border p-3", ap.status === "done" ? "border-neutral-200 bg-neutral-50" : "border-neutral-200 bg-white")}>
      <button
        onClick={() => onToggle(ap.id, ap.status === "done" ? "open" : "done")}
        className={cn("mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border-2", ap.status === "done" ? "border-green-500 bg-green-500 text-white" : "border-neutral-300 hover:border-green-500")}
      >
        {ap.status === "done" && <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.7 5.3a1 1 0 010 1.4l-7.5 7.5a1 1 0 01-1.4 0L3.3 9.7a1 1 0 011.4-1.4l3.1 3.1 6.8-6.8a1 1 0 011.4 0z" clipRule="evenodd" /></svg>}
      </button>
      <div className="min-w-0 flex-1">
        <p className={cn("text-sm text-neutral-800", ap.status === "done" && "line-through text-neutral-400")}>{ap.text}</p>
        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-neutral-500">
          {ap.assigneeName && <span>👤 {ap.assigneeName}</span>}
          {ap.dueDate && <span>📅 {new Date(ap.dueDate).toLocaleDateString()}</span>}
        </div>
      </div>
      <button onClick={() => onDelete(ap.id)} className="rounded p-1 text-neutral-400 opacity-0 hover:bg-red-50 hover:text-red-500 group-hover:opacity-100">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 6h18M8 6V4a1 1 0 011-1h6a1 1 0 011 1v2M19 6l-1 14a1 1 0 01-1 1H7a1 1 0 01-1-1L5 6" /></svg>
      </button>
    </div>
  );
}
