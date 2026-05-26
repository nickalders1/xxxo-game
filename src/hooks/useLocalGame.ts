"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { lightHaptic, notificationHaptic } from "@/lib/native";
import type { Player } from "@/lib/game/types";
import type {
  BaseGameState,
  MoveError,
  Variant,
} from "@/lib/game/variants/types";

const ERROR_MESSAGE_TIMEOUT_MS = 1500;

export interface UseLocalGameResult<TState extends BaseGameState, TMove> {
  state: TState;
  /** True while a move can still be made. */
  canMove: boolean;
  /** Winner of the game if it's finished, else null. */
  winner: Player | "tie" | null;
  /** Last rejected move's error; auto-clears after 1.5s. */
  lastError: MoveError | null;
  /** Total moves played so far. */
  moveCount: number;
  /** Attempt a move. Returns true if accepted. */
  makeMove: (move: TMove) => boolean;
  reset: () => void;
  /** Direct state setter — for online sync or testing. */
  setState: (next: TState) => void;
}

function getWinnerFromScore<TState extends BaseGameState>(
  variant: Variant<TState, unknown>,
  state: TState,
): Player | "tie" | null {
  if (state.gameActive) return null;
  const players = variant.getPlayers(state);
  let best: Player | null = null;
  let bestScore = -Infinity;
  let tied = false;
  for (const p of players) {
    const s = state.score[p] ?? 0;
    if (s > bestScore) {
      best = p;
      bestScore = s;
      tied = false;
    } else if (s === bestScore) {
      tied = true;
    }
  }
  if (tied || best === null) return "tie";
  return best;
}

/**
 * Generic local 2-player hook. Takes a Variant module and drives state through
 * its pure functions. Same UI hook works for every variant.
 *
 * Side-effects: triggers haptics on successful moves and on game end (no-op on
 * web; light vibration on Capacitor native).
 */
export function useLocalGame<TState extends BaseGameState, TMove>(
  variant: Variant<TState, TMove>,
): UseLocalGameResult<TState, TMove> {
  const [state, setState] = useState<TState>(() => variant.createInitialState());
  const [lastError, setLastError] = useState<MoveError | null>(null);
  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-clear lastError after a short delay so the status banner reverts to
  // the normal turn message without the player having to make another move.
  useEffect(() => {
    if (!lastError) return;
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    errorTimerRef.current = setTimeout(() => {
      setLastError(null);
      errorTimerRef.current = null;
    }, ERROR_MESSAGE_TIMEOUT_MS);
    return () => {
      if (errorTimerRef.current) {
        clearTimeout(errorTimerRef.current);
        errorTimerRef.current = null;
      }
    };
  }, [lastError]);

  // Re-create initial state when the variant changes (navigating between
  // variant tabs would otherwise carry stale state).
  useEffect(() => {
    setState(variant.createInitialState());
    setLastError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variant.meta.id]);

  const winner = useMemo(() => getWinnerFromScore(variant, state), [variant, state]);
  const canMove = state.gameActive;

  const makeMove = useCallback(
    (move: TMove): boolean => {
      const outcome = variant.applyMove(state, move);
      if (!outcome.ok) {
        setLastError(outcome.error);
        return false;
      }
      setLastError(null);
      void lightHaptic();

      let next = outcome.result.state;

      // After the move, ask the variant whether the next turn should pass
      // through normally, flip into a bonus turn, or end the game.
      if (next.gameActive) {
        const action = variant.resolveTurnStart(next);
        if (action.kind === "end") {
          next = { ...next, gameActive: false };
        } else if (action.kind === "bonus") {
          // Classic exposes bonusTurn + currentPlayer through TState;
          // variants without bonus mechanics will never produce this case.
          next = { ...next, currentPlayer: action.player, bonusTurn: true } as TState;
        }
      }

      if (!next.gameActive) void notificationHaptic();
      setState(next);
      return true;
    },
    [state, variant],
  );

  const reset = useCallback(() => {
    setState(variant.createInitialState());
    setLastError(null);
  }, [variant]);

  return {
    state,
    canMove,
    winner,
    lastError,
    moveCount: state.turnNumber,
    makeMove,
    reset,
    setState,
  };
}
