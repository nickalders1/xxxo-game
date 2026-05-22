"use client";

import { Cell, getLastFor } from "./Cell";
import type { Board as BoardValue, LastMoves, Player } from "@/lib/game/types";
import { cn } from "@/lib/utils";

interface BoardProps {
  board: BoardValue;
  lastMove: LastMoves;
  currentPlayer: Player;
  gameActive: boolean;
  /** When true, all cells render as disabled (e.g. AI thinking, not your turn online). */
  locked?: boolean;
  onMove: (row: number, col: number) => void;
  className?: string;
}

export function Board({
  board,
  lastMove,
  currentPlayer,
  gameActive,
  locked,
  onMove,
  className,
}: BoardProps) {
  return (
    <div
      className={cn(
        "bg-game-board rounded-2xl border border-border/60 p-2 sm:p-3 shadow-2xl",
        "w-full max-w-[min(92vw,28rem)] mx-auto",
        className,
      )}
    >
      <div
        className="grid grid-cols-5 gap-1.5 sm:gap-2"
        role="grid"
        aria-label="XXXo speelbord"
      >
        {board.map((rowCells, row) =>
          rowCells.map((value, col) => {
            const lastFor = getLastFor(row, col, lastMove);
            return (
              <Cell
                key={`${row}-${col}`}
                row={row}
                col={col}
                value={value}
                isLastFor={lastFor}
                boardLocked={Boolean(locked)}
                isCurrentPlayer={currentPlayer}
                gameActive={gameActive}
                onClick={onMove}
              />
            );
          }),
        )}
      </div>
    </div>
  );
}
