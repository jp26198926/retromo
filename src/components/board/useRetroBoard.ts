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
  };
  columns: { id: string; name: string; description: string | null; color: string; imageUrl: string | null; position: number }[];
  cards: CardData[];
  actionPoints: ActionPointData[];
  participants: { id: string; userId: string | null; displayName: string | null; color: string | null; isFacilitator: boolean; ready: boolean }[];
  currentUserId: string | null;
  currentParticipant: { id: string; displayName: string | null; color: string | null; isFacilitator: boolean } | null;
};

export function useRetroBoard(retroId: string) {
  const [state, setState] = useState<RetroState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joined, setJoined] = useState(false);
  const refreshTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchState = useCallback(async () => {
    try {
      const res = await fetch(`/api/retros/${retroId}`);
      if (!res.ok) throw new Error("Failed to load board");
      const data = await res.json();
      setState(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load board");
    } finally {
      setLoading(false);
    }
  }, [retroId]);

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
          body: JSON.stringify({ retroId }),
        });
        setJoined(true);
        fetchState();
      } catch {
        /* ignore */
      }
    })();
  }, [joined, retroId, fetchState]);

  // Poll for realtime updates every 3s
  useEffect(() => {
    refreshTimer.current = setInterval(fetchState, 3000);
    return () => { if (refreshTimer.current) clearInterval(refreshTimer.current); };
  }, [fetchState]);

  return { state, loading, error, refresh: fetchState };
}
