"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CardData } from "@/components/board/Card";
import type { ActionPointData } from "@/components/board/ActionPointsPanel";

export type RetroState = {
  retro: {
    id: string;
    title: string;
    topic: string | null;
    engagement: "anonymous" | "required_names";
    votesPerParticipant: number;
    secretVoting: boolean;
    locked: boolean;
    moderated: boolean;
    timerDuration: number;
    timerEndsAt: string | null;
    plan: string;
    shareToken: string;
    ownerId: string | null;
  };
  columns: { id: string; name: string; description: string | null; color: string; imageUrl: string | null; position: number }[];
  cards: CardData[];
  actionPoints: ActionPointData[];
  participants: { id: string; userId: string | null; displayName: string | null; color: string | null; isFacilitator: boolean; ready: boolean }[];
  currentUserId: string | null;
  currentParticipant: { id: string; displayName: string | null; color: string | null; isFacilitator: boolean } | null;
};

// Generate and persist a unique anonymous session ID per browser tab.
// We use sessionStorage so each tab gets its own identity, but it persists
// across page refreshes within the same tab.
function getOrCreateAnonymousSessionId(): string {
  if (typeof window === "undefined") return "";
  const KEY = "retromo_anon_session";
  let id = sessionStorage.getItem(KEY);
  if (!id) {
    id = `anon_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    sessionStorage.setItem(KEY, id);
  }
  return id;
}

export function useRetroBoard(retroId: string) {
  const [state, setState] = useState<RetroState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joined, setJoined] = useState(false);
  const refreshTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const anonSessionRef = useRef<string | null>(null);

  // Get or create the anonymous session ID once
  if (typeof window !== "undefined" && !anonSessionRef.current) {
    anonSessionRef.current = getOrCreateAnonymousSessionId();
  }

  const anonSessionId = anonSessionRef.current;

  const fetchState = useCallback(async () => {
    try {
      const url = anonSessionId
        ? `/api/retros/${retroId}?anon=${encodeURIComponent(anonSessionId)}`
        : `/api/retros/${retroId}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to load board");
      const data = await res.json();
      setState(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load board");
    } finally {
      setLoading(false);
    }
  }, [retroId, anonSessionId]);

  // Initial load
  useEffect(() => {
    fetchState();
  }, [fetchState]);

  // Join as participant once on mount
  useEffect(() => {
    if (joined) return;
    (async () => {
      try {
        await fetch("/api/participants", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ retroId, anonymousSessionId: anonSessionId }),
        });
        setJoined(true);
        fetchState();
      } catch {
        /* ignore */
      }
    })();
  }, [joined, retroId, anonSessionId, fetchState]);

  // Poll for realtime updates every 3s
  useEffect(() => {
    refreshTimer.current = setInterval(fetchState, 3000);
    return () => { if (refreshTimer.current) clearInterval(refreshTimer.current); };
  }, [fetchState]);

  // Update display name for the current participant (anonymous or logged-in)
  const updateName = useCallback(async (name: string) => {
    if (!state?.currentParticipant?.id) return;
    try {
      await fetch("/api/participants", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: state.currentParticipant.id, displayName: name }),
      });
      fetchState();
    } catch {
      /* ignore */
    }
  }, [state?.currentParticipant?.id, fetchState]);

  return { state, loading, error, refresh: fetchState, updateName, anonSessionId };
}
