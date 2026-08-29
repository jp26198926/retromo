"use client";

import { useState } from "react";
import { CARD_COLORS } from "@/lib/card-colors";
import { cn } from "@/lib/utils";

export type CardData = {
  id: string;
  columnId: string;
  retroId: string;
  authorId: string | null;
  authorName: string | null;
  content: string;
  imageUrl: string | null;
  color: string;
  isPublic: boolean;
  position: number;
  votesCount: number;
  votes: { id: string; voterId: string | null; voterName: string | null }[];
};

interface CardProps {
  card: CardData;
  currentUserId: string | null;
  currentParticipantId: string | null;
  currentParticipantColor?: string | null;
  secretVoting: boolean;
  showAuthor: boolean;
  isMine: boolean;
  isPublicSection: boolean;
  onVote: (cardId: string) => void;
  onDelete: (cardId: string) => void;
  onTogglePublic: (cardId: string) => void;
  onColorChange: (cardId: string, color: string) => void;
  onDragStart: (e: React.DragEvent, cardId: string) => void;
  draggedId: string | null;
}

export function Card({
  card,
  currentUserId,
  secretVoting,
  showAuthor,
  isMine,
  isPublicSection,
  onVote,
  onDelete,
  onTogglePublic,
  onColorChange,
  onDragStart,
  draggedId,
}: CardProps) {
  const [showColors, setShowColors] = useState(false);
  const colors = CARD_COLORS[card.color] || CARD_COLORS.yellow;
  const myVote = card.votes.find(
    (v) => v.voterId === currentUserId || (v.voterName && v.voterName === currentUserId)
  );

  // Post-it rotation: deterministic slight rotation based on card id
  const rotation = ((card.id.charCodeAt(0) + card.id.charCodeAt(1)) % 5) - 2; // -2 to 2 degrees

  return (
    <div
      draggable={isMine || isPublicSection}
      onDragStart={(e) => onDragStart(e, card.id)}
      className={cn(
        "postit group relative rounded-sm p-3 pt-5 text-sm leading-snug animate-fade-in transition-shadow",
        "shadow-[0_1px_3px_rgba(0,0,0,0.15),0_4px_10px_rgba(0,0,0,0.08)] hover:shadow-[0_2px_6px_rgba(0,0,0,0.2),0_8px_20px_rgba(0,0,0,0.12)]",
        draggedId === card.id && "opacity-40"
      )}
      style={{
        backgroundColor: colors.bg,
        borderTopColor: colors.border,
        borderTopWidth: "3px",
        transform: `rotate(${rotation}deg)`,
      }}
    >
      {/* Tape effect on top */}
      <div
        className="absolute -top-2 left-1/2 h-4 w-12 -translate-x-1/2 rounded-sm bg-neutral-400/30 shadow-sm"
        aria-hidden
      />

      {/* Image */}
      {card.imageUrl && (
        <img src={card.imageUrl} alt="" className="mb-2 max-h-40 w-full rounded object-cover" />
      )}

      <p className="whitespace-pre-wrap break-words text-neutral-800">{card.content}</p>

      {/* Footer: author + votes */}
      <div className="mt-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {/* Always show author name if available — it auto-appears on cards the user posts */}
          {card.authorName && (
            <span className="text-xs italic text-neutral-500">— {card.authorName}</span>
          )}
        </div>
        {/* Vote button */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onVote(card.id)}
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium transition-colors",
              myVote ? "bg-indigo-600 text-white" : "bg-white/70 text-neutral-600 hover:bg-white"
            )}
            title="Vote"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="8" /></svg>
            {secretVoting ? (myVote ? "✓" : "Vote") : card.votesCount}
          </button>
        </div>
      </div>

      {/* Hover actions */}
      <div className="absolute right-1 top-1 flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
        {isMine && (
          <>
            <button
              onClick={() => setShowColors((v) => !v)}
              className="rounded p-1 text-neutral-500 hover:bg-white/80"
              title="Color"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /></svg>
            </button>
            <button
              onClick={() => onTogglePublic(card.id)}
              className="rounded p-1 text-neutral-500 hover:bg-white/80"
              title={isPublicSection ? "Make private" : "Make public"}
            >
              {isPublicSection ? "⤵" : "⤴"}
            </button>
            <button
              onClick={() => onDelete(card.id)}
              className="rounded p-1 text-red-500 hover:bg-white/80"
              title="Delete"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 6h18M8 6V4a1 1 0 011-1h6a1 1 0 011 1v2M19 6l-1 14a1 1 0 01-1 1H7a1 1 0 01-1-1L5 6" /></svg>
            </button>
          </>
        )}
      </div>

      {/* Color picker popover */}
      {showColors && isMine && (
        <div className="absolute right-1 top-7 z-10 flex gap-1 rounded-lg border border-neutral-200 bg-white p-1.5 shadow-lg">
          {Object.entries(CARD_COLORS).map(([key, c]) => (
            <button
              key={key}
              onClick={() => { onColorChange(card.id, key); setShowColors(false); }}
              className="h-5 w-5 rounded border"
              style={{ backgroundColor: c.bg, borderColor: c.border }}
              title={c.label}
            />
          ))}
        </div>
      )}
    </div>
  );
}
