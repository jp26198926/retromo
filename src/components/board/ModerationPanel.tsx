"use client";

import type { CardData } from "@/components/board/Card";
import { decryptContent, looksEncrypted } from "@/lib/crypto";
import { useEffect, useState } from "react";

interface ModerationPanelProps {
  cards: CardData[];
  onApprove: (cardId: string) => void;
  onReject: (cardId: string) => void;
}

/**
 * Floating moderation panel for facilitators.
 * Shows pending (unapproved) cards with Approve / Reject buttons.
 * Supports decrypted content when the retro uses zero-knowledge encryption.
 */
export function ModerationPanel({ cards, onApprove, onReject }: ModerationPanelProps) {
  const [open, setOpen] = useState(false);
  const [decrypted, setDecrypted] = useState<Record<string, string>>({});

  // Decrypt card content if needed (password stored in sessionStorage by the board)
  useEffect(() => {
    (async () => {
      const map: Record<string, string> = {};
      for (const card of cards) {
        if (looksEncrypted(card.content)) {
          // Try to get password from sessionStorage — the board stores it under retromo_enc_<retroId>
          const keys = Object.keys(sessionStorage).filter((k) => k.startsWith("retromo_enc_"));
          for (const key of keys) {
            const pw = sessionStorage.getItem(key);
            if (pw) {
              const plain = await decryptContent(card.content, pw);
              if (plain !== null) {
                map[card.id] = plain;
                break;
              }
            }
          }
          if (!map[card.id]) map[card.id] = "[Encrypted — enter password on the board]";
        } else {
          map[card.id] = card.content;
        }
      }
      setDecrypted(map);
    })();
  }, [cards]);

  const pendingCount = cards.length;

  if (pendingCount === 0 && !open) return null;

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-4 right-4 z-40 flex items-center gap-2 rounded-full bg-amber-500 px-4 py-3 text-sm font-medium text-white shadow-lg hover:bg-amber-600"
        >
          <span>🔍</span>
          <span>Moderation</span>
          {pendingCount > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs font-bold text-amber-600">
              {pendingCount}
            </span>
          )}
        </button>
      )}

      {/* Slide-over panel */}
      {open && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/20" onClick={() => setOpen(false)} />
          <div className="relative flex h-full w-full max-w-md flex-col bg-white shadow-xl sm:w-96">
            <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
              <h2 className="text-lg font-semibold text-neutral-900">
                Moderation
                {pendingCount > 0 && (
                  <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
                    {pendingCount} pending
                  </span>
                )}
              </h2>
              <button
                onClick={() => setOpen(false)}
                className="rounded p-1 text-neutral-400 hover:bg-neutral-100"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-auto p-4">
              {pendingCount === 0 ? (
                <div className="flex h-full items-center justify-center text-center text-sm text-neutral-400">
                  <div>
                    <div className="mb-2 text-3xl">✅</div>
                    <p>No pending cards. All cards have been reviewed.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {cards.map((card) => (
                    <div key={card.id} className="rounded-xl border border-neutral-200 p-3">
                      <div className="mb-1 flex items-center gap-2">
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">Pending</span>
                        {card.authorName && (
                          <span className="text-xs text-neutral-400">— {card.authorName}</span>
                        )}
                      </div>
                      <p className="mb-3 whitespace-pre-wrap break-words text-sm text-neutral-800">
                        {decrypted[card.id] ?? card.content}
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => onApprove(card.id)}
                          className="flex-1 rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700"
                        >
                          ✓ Approve
                        </button>
                        <button
                          onClick={() => onReject(card.id)}
                          className="flex-1 rounded-lg bg-red-100 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-200"
                        >
                          ✕ Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
