"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  CUBE_SIZE,
  type Cube3DGameState,
  type Move3D,
} from "@/lib/game/variants/cube3d";

interface Board3DLayeredProps {
  state: Cube3DGameState;
  locked?: boolean;
  onMove: (move: Move3D) => void;
  className?: string;
}

/**
 * Layered 2D rendering of the 5×5×5 cube. Shows one floor at a time as a big
 * 5×5 grid, with a vertical floor switcher to climb up/down. Each cell shows
 * its own piece + small dots indicating pieces above and below at the same
 * (x,y) column — that's how you spot vertical and diagonal threats without
 * a 3D viewer.
 *
 * Three.js interactive variant lives in Board3DInteractive (Phase 5 polish).
 */
export function Board3DLayered({
  state,
  locked,
  onMove,
  className,
}: Board3DLayeredProps) {
  // Start the user looking at the middle floor.
  const [floor, setFloor] = useState(2);

  const slice = state.board[floor];
  const lastForFloor: { X: { x: number; y: number } | null; O: { x: number; y: number } | null } = {
    X: state.lastMove.X && state.lastMove.X.z === floor ? state.lastMove.X : null,
    O: state.lastMove.O && state.lastMove.O.z === floor ? state.lastMove.O : null,
  };

  function stackInfo(x: number, y: number) {
    const above = { X: 0, O: 0 };
    const below = { X: 0, O: 0 };
    for (let z = 0; z < CUBE_SIZE; z++) {
      if (z === floor) continue;
      const v = state.board[z][y][x];
      if (v === "") continue;
      if (z > floor) above[v]++;
      else below[v]++;
    }
    return { above, below };
  }

  return (
    <div className={cn("flex items-stretch gap-3 w-full max-w-[min(92vw,28rem)] mx-auto", className)}>
      {/* Floor switcher — vertical strip on the left */}
      <div className="flex flex-col items-center gap-1.5 shrink-0 bg-card rounded-2xl border border-border/60 p-2">
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={() => setFloor((f) => Math.min(CUBE_SIZE - 1, f + 1))}
          disabled={floor >= CUBE_SIZE - 1}
          aria-label="Floor up"
          className="tap-target"
        >
          <ChevronUp className="h-5 w-5" />
        </Button>
        <div className="flex flex-col gap-1.5 my-1">
          {Array.from({ length: CUBE_SIZE }).map((_, i) => {
            const z = CUBE_SIZE - 1 - i; // top of list = top floor visually
            const active = z === floor;
            return (
              <button
                key={z}
                type="button"
                onClick={() => setFloor(z)}
                aria-label={`Switch to floor ${z + 1}`}
                aria-current={active}
                className={cn(
                  "h-7 w-7 rounded-md text-xs font-semibold tabular",
                  "flex items-center justify-center transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/40 text-muted-foreground hover:bg-muted/70",
                )}
              >
                {z + 1}
              </button>
            );
          })}
        </div>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={() => setFloor((f) => Math.max(0, f - 1))}
          disabled={floor <= 0}
          aria-label="Floor down"
          className="tap-target"
        >
          <ChevronDown className="h-5 w-5" />
        </Button>
      </div>

      {/* Active floor grid */}
      <div
        className={cn(
          "flex-1 bg-game-board rounded-2xl border border-border/60 p-2 sm:p-3 shadow-2xl",
        )}
      >
        <div className="text-xs text-muted-foreground text-center mb-2">
          Floor <span className="font-semibold tabular text-foreground">{floor + 1}</span> / {CUBE_SIZE}
        </div>
        <div
          className="grid grid-cols-5 gap-1.5 sm:gap-2"
          role="grid"
          aria-label={`Cube floor ${floor + 1}`}
        >
          {slice.map((row, y) =>
            row.map((value, x) => {
              const isEmpty = value === "";
              const isClickable = state.gameActive && isEmpty && !locked;
              const stack = stackInfo(x, y);
              const isLastX = lastForFloor.X?.x === x && lastForFloor.X?.y === y;
              const isLastO = lastForFloor.O?.x === x && lastForFloor.O?.y === y;
              const isLast = isLastX || isLastO;

              return (
                <button
                  key={`${y}-${x}`}
                  type="button"
                  onClick={() => isClickable && onMove({ x, y, z: floor })}
                  disabled={!isClickable}
                  aria-label={
                    isEmpty
                      ? `Empty cell column ${x + 1}, row ${y + 1}, floor ${floor + 1}`
                      : `${value} at column ${x + 1}, row ${y + 1}, floor ${floor + 1}`
                  }
                  className={cn(
                    "relative aspect-square w-full rounded-lg border border-border/40",
                    "flex items-center justify-center",
                    "text-2xl sm:text-3xl font-bold tabular",
                    "transition-all duration-150 select-none",
                    isClickable && [
                      "bg-game-cell hover:bg-game-cell-hover",
                      "cursor-pointer active:scale-[0.96]",
                      state.currentPlayer === "X" && "hover:ring-2 hover:ring-game-x/30",
                      state.currentPlayer === "O" && "hover:ring-2 hover:ring-game-o/30",
                    ],
                    isEmpty && !isClickable && "bg-game-cell-disabled opacity-60 cursor-not-allowed",
                    value === "X" && "bg-game-x-soft text-game-x cursor-not-allowed",
                    value === "O" && "bg-game-o-soft text-game-o cursor-not-allowed",
                    isLast && "ring-2 ring-game-cell-last ring-offset-1 ring-offset-game-board",
                  )}
                >
                  {value}

                  {/* Stack indicators: tiny dots in the top-right (above) and
                      bottom-right (below) corners showing how many pieces of
                      each colour sit at this (x,y) column on other floors. */}
                  {(stack.above.X + stack.above.O > 0) && (
                    <span className="absolute top-0.5 right-0.5 flex gap-0.5 text-[7px] leading-none">
                      {stack.above.X > 0 && (
                        <span className="text-game-x font-bold">
                          {stack.above.X > 1 ? `${stack.above.X}` : "•"}
                        </span>
                      )}
                      {stack.above.O > 0 && (
                        <span className="text-game-o font-bold">
                          {stack.above.O > 1 ? `${stack.above.O}` : "•"}
                        </span>
                      )}
                    </span>
                  )}
                  {(stack.below.X + stack.below.O > 0) && (
                    <span className="absolute bottom-0.5 right-0.5 flex gap-0.5 text-[7px] leading-none">
                      {stack.below.X > 0 && (
                        <span className="text-game-x font-bold">
                          {stack.below.X > 1 ? `${stack.below.X}` : "•"}
                        </span>
                      )}
                      {stack.below.O > 0 && (
                        <span className="text-game-o font-bold">
                          {stack.below.O > 1 ? `${stack.below.O}` : "•"}
                        </span>
                      )}
                    </span>
                  )}
                </button>
              );
            }),
          )}
        </div>
        <div className="mt-2 text-[10px] text-muted-foreground text-center">
          <span className="text-game-x">●</span> above / <span className="text-game-o">●</span> below — same column, other floors
        </div>
      </div>
    </div>
  );
}
