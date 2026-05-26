"use client";

import { Board } from "./Board";
import { Board3DLayered } from "./Board3DLayered";
import type {
  BaseGameState,
  Variant,
} from "@/lib/game/variants/types";
import type { ClassicGameState } from "@/lib/game/variants/classic";
import type { Cube3DGameState, Move3D } from "@/lib/game/variants/cube3d";
import type { Move } from "@/lib/game/types";

interface BoardRendererProps<TState extends BaseGameState, TMove> {
  variant: Variant<TState, TMove>;
  state: TState;
  locked?: boolean;
  onMove: (move: TMove) => void;
  className?: string;
}

/**
 * Variant-aware board renderer. Dispatches to the right view component based
 * on `variant.meta.id`. Pages and hooks know nothing about board topology —
 * they just hand the BoardRenderer the variant + state + an onMove callback.
 *
 * Adds new variants by extending the switch with a new branch. The 2D Board
 * stays the canonical Classic / future-Gravity renderer; Cube uses the
 * Board3DLayered floor-switcher. Phase 5 polish will add Board3DInteractive
 * as an opt-in Three.js view.
 */
export function BoardRenderer<TState extends BaseGameState, TMove>({
  variant,
  state,
  locked,
  onMove,
  className,
}: BoardRendererProps<TState, TMove>) {
  switch (variant.meta.id) {
    case "classic": {
      const s = state as unknown as ClassicGameState;
      return (
        <Board
          board={s.board}
          lastMove={s.lastMove}
          currentPlayer={s.currentPlayer}
          gameActive={s.gameActive}
          locked={locked}
          onMove={(row, col) => (onMove as (m: Move) => void)({ row, col })}
          className={className}
        />
      );
    }
    case "cube3d": {
      const s = state as unknown as Cube3DGameState;
      return (
        <Board3DLayered
          state={s}
          locked={locked}
          onMove={onMove as (m: Move3D) => void}
          className={className}
        />
      );
    }
    default:
      return (
        <div className="text-center text-muted-foreground py-12">
          Variant &quot;{variant.meta.id}&quot; renderer not yet implemented.
        </div>
      );
  }
}
