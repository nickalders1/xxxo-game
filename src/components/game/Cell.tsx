"use client";

import { cn } from "@/lib/utils";
import type { Cell as CellValue, LastMoves, Player } from "@/lib/game/types";

interface CellProps {
  row: number;
  col: number;
  value: CellValue;
  isLastFor?: Player | null;
  /** Board-wide lock (AI thinking, not your turn online). Per-cell adjacency
   *  is intentionally NOT visualised — players are expected to remember the
   *  rule themselves. Illegal clicks just trigger a short status message. */
  boardLocked?: boolean;
  isCurrentPlayer?: Player;
  gameActive: boolean;
  onClick: (row: number, col: number) => void;
}

export function Cell({
  row,
  col,
  value,
  isLastFor,
  boardLocked,
  isCurrentPlayer,
  gameActive,
  onClick,
}: CellProps) {
  const isEmpty = value === "";
  // Adjacency is deliberately not in the disabled check — clicking an
  // adjacent cell is a normal user action that gets rejected by the hook.
  const isClickable = gameActive && isEmpty && !boardLocked;

  return (
    <button
      type="button"
      onClick={() => isClickable && onClick(row, col)}
      disabled={!isClickable}
      aria-label={
        isEmpty
          ? `Lege cel rij ${row + 1}, kolom ${col + 1}`
          : `${value} op rij ${row + 1}, kolom ${col + 1}`
      }
      data-player={value || undefined}
      data-last={isLastFor ?? undefined}
      className={cn(
        "relative aspect-square w-full rounded-lg border border-border/40",
        "flex items-center justify-center",
        "text-3xl sm:text-4xl font-bold tracking-tight tabular",
        "transition-all duration-150",
        "select-none",
        // Empty + clickable (NORMAL look, no adjacency hint)
        isClickable && [
          "bg-game-cell hover:bg-game-cell-hover",
          "cursor-pointer active:scale-[0.96]",
          isCurrentPlayer === "X" && "hover:ring-2 hover:ring-game-x/30",
          isCurrentPlayer === "O" && "hover:ring-2 hover:ring-game-o/30",
        ],
        // Empty + board-wide locked (AI's turn / not your turn online / game ended)
        isEmpty && !isClickable && [
          "bg-game-cell-disabled opacity-60 cursor-not-allowed",
        ],
        // Filled X
        value === "X" && "bg-game-x-soft text-game-x cursor-not-allowed",
        // Filled O
        value === "O" && "bg-game-o-soft text-game-o cursor-not-allowed",
        // Last move highlight (only the actual placed piece, not the neighbours)
        isLastFor && "ring-2 ring-game-cell-last ring-offset-1 ring-offset-game-board",
      )}
    >
      {value}
    </button>
  );
}

export function getLastFor(
  row: number,
  col: number,
  lastMove: LastMoves,
): Player | null {
  if (lastMove.X && lastMove.X.row === row && lastMove.X.col === col) return "X";
  if (lastMove.O && lastMove.O.row === row && lastMove.O.col === col) return "O";
  return null;
}
