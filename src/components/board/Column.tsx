"use client";

import { useState } from "react";
import { Card, type CardData } from "./Card";
import { cn } from "@/lib/utils";

interface ColumnData {
  id: string;
  name: string;
  description: string | null;
  color: string;
  imageUrl: string | null;
  position: number;
}

interface ColumnProps {
  column: ColumnData;
  cards: CardData[];
  currentUserId: string | null;
  currentParticipantId: string | null;
  currentParticipantName: string | null;
  currentParticipantColor: string | null;
  secretVoting: boolean;
  showAuthor: boolean;
  locked: boolean;
  onCreateCard: (columnId: string, content: string) => void;
  onVote: (cardId: string) => void;
  onDeleteCard: (cardId: string) => void;
  onTogglePublic: (cardId: string) => void;
  onColorChange: (cardId: string, color: string) => void;
  onDropCard: (cardId: string, columnId: string, isPublic: boolean) => void;
  draggedId: string | null;
  setDraggedId: (id: string | null) => void;
}

export function Column(props: ColumnProps) {
  const {
    column,
    cards,
    currentUserId,
    currentParticipantId,
    currentParticipantName,
    currentParticipantColor,
    secretVoting,
    showAuthor,
    locked,
    onCreateCard,
    onVote,
    onDeleteCard,
    onTogglePublic,
    onColorChange,
    onDropCard,
    draggedId,
    setDraggedId,
  } = props;

  const [draft, setDraft] = useState("");
  const [dragOverPublic, setDragOverPublic] = useState(false);
  const [dragOverPrivate, setDragOverPrivate] = useState(false);

  const publicCards = cards.filter((c) => c.isPublic).sort((a, b) => b.votesCount - a.votesCount || a.position - b.position);

  // Private cards that belong to the current participant
  // For logged-in users, match by authorId
  // For anonymous users, match by authorName === currentParticipantName
  const myPrivateCards = cards
    .filter((c) => !c.isPublic)
    .filter((c) => {
      if (currentUserId) return c.authorId === currentUserId;
      // anonymous: match by display name (which is stored on the card when created)
      return c.authorName != null && c.authorName === currentParticipantName;
    });

  function handleAdd() {
    if (!draft.trim() || locked) return;
    onCreateCard(column.id, draft.trim());
    setDraft("");
  }

  function handleDrop(e: React.DragEvent, isPublic: boolean) {
    e.preventDefault();
    const cardId = e.dataTransfer.getData("text/plain");
    if (cardId) onDropCard(cardId, column.id, isPublic);
    setDraggedId(null);
    setDragOverPublic(false);
    setDragOverPrivate(false);
  }

  return (
    <div className="flex flex-col rounded-xl border border-neutral-200 bg-neutral-50/60">
      {/* Header */}
      <div
        className="rounded-t-xl border-b-2 px-4 py-3"
        style={{ borderColor: column.color }}
      >
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: column.color }} />
          <h3 className="font-semibold text-neutral-900">{column.name}</h3>
          <span className="ml-auto text-xs text-neutral-400">{publicCards.length} public</span>
        </div>
        {column.description && <p className="mt-1 text-xs text-neutral-500">{column.description}</p>}
      </div>

      {/* Public section */}
      <div
        className={cn("flex flex-col gap-3 p-4 min-h-[120px]", dragOverPublic && "drag-over")}
        onDragOver={(e) => { e.preventDefault(); setDragOverPublic(true); }}
        onDragLeave={() => setDragOverPublic(false)}
        onDrop={(e) => handleDrop(e, true)}
      >
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Public</span>
        </div>
        {publicCards.length === 0 && (
          <div className="rounded-lg border border-dashed border-neutral-200 p-3 text-center text-xs text-neutral-400">
            Drag cards here to share
          </div>
        )}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {publicCards.map((card) => (
            <Card
              key={card.id}
              card={card}
              currentUserId={currentUserId}
              currentParticipantId={currentParticipantId}
              currentParticipantColor={currentParticipantColor}
              secretVoting={secretVoting}
              showAuthor={showAuthor}
              isMine={card.authorId === currentUserId || (!currentUserId && card.authorName === currentParticipantName)}
              isPublicSection={true}
              onVote={onVote}
              onDelete={onDeleteCard}
              onTogglePublic={onTogglePublic}
              onColorChange={onColorChange}
              onDragStart={(e) => { e.dataTransfer.setData("text/plain", card.id); setDraggedId(card.id); }}
              draggedId={draggedId}
            />
          ))}
        </div>
      </div>

      {/* Private section (only visible to current user) */}
      <div
        className={cn("flex flex-col gap-3 border-t border-dashed border-neutral-200 p-4 min-h-[120px]", dragOverPrivate && "drag-over")}
        onDragOver={(e) => { e.preventDefault(); setDragOverPrivate(true); }}
        onDragLeave={() => setDragOverPrivate(false)}
        onDrop={(e) => handleDrop(e, false)}
      >
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Your private space</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {myPrivateCards.map((card) => (
            <Card
              key={card.id}
              card={card}
              currentUserId={currentUserId}
              currentParticipantId={currentParticipantId}
              currentParticipantColor={currentParticipantColor}
              secretVoting={secretVoting}
              showAuthor={showAuthor}
              isMine={true}
              isPublicSection={false}
              onVote={onVote}
              onDelete={onDeleteCard}
              onTogglePublic={onTogglePublic}
              onColorChange={onColorChange}
              onDragStart={(e) => { e.dataTransfer.setData("text/plain", card.id); setDraggedId(card.id); }}
              draggedId={draggedId}
            />
          ))}
        </div>
        {!locked && (
          <div className="mt-1">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleAdd();
                }
              }}
              placeholder="Write an idea… (Enter to save)"
              className="w-full resize-none rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              rows={2}
            />
          </div>
        )}
      </div>
    </div>
  );
}
