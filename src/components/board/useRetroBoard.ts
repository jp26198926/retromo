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
    visibility: "regular" | "private";
    archived: boolean;
    retentionDays: number | null;
    encryptionEnabled: boolean;
  };
  columns: { id: string; name: string; description: string | null; color: string; imageUrl: string | null; position: number }[];
  cards: CardData[];
  actionPoints: ActionPointData[];
  participants: { id: string; userId: string | null; displayName: string | null; color: string | null; isFacilitator: boolean; ready: boolean }[];
  currentUserId: string | null;
  currentParticipant: { id: string; displayName: string | null; color: string | null; isFacilitator: boolean } | null;
  /** Viewer can approve/reject cards in the moderation queue. */
  canModerate: boolean;
  /** Viewer's own cards skip the review queue (host / facilitator / admin). */
  moderationExempt: boolean;
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
  // Set when the retro is private and the visitor is not signed in.
  const [authRequired, setAuthRequired] = useState(false);
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
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        // Private retrospective and the visitor is not signed in.
        if (res.status === 401 && data?.reason === "auth_required") {
          setAuthRequired(true);
          setError(data.error || "This retrospective is private. Please sign in to continue.");
          return;
        }
        throw new Error(data?.error || "Failed to load board");
      }
      const data = await res.json();
      setState(data);
      setAuthRequired(false);
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

  // Join as participant once on mount.
  // Skipped for private retros the visitor cannot access.
  useEffect(() => {
    if (joined || authRequired) return;
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
  }, [joined, authRequired, retroId, anonSessionId, fetchState]);

  // Poll for realtime updates every 3s.
  // No point polling a board we are not allowed to read.
  useEffect(() => {
    if (authRequired) return;
    refreshTimer.current = setInterval(fetchState, 3000);
    return () => { if (refreshTimer.current) clearInterval(refreshTimer.current); };
  }, [fetchState, authRequired]);

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

  return { state, loading, error, authRequired, refresh: fetchState, updateName, anonSessionId };
}
