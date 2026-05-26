"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  applyMove,
  createInitialState,
  getWinner,
  resolveTurnStart,
} from "@/lib/game/rules";
import type { GameState, MoveError, Player } from "@/lib/game/types";
import { lightHaptic, notificationHaptic } from "@/lib/native";

const ERROR_MESSAGE_TIMEOUT_MS = 1500;

export interface UseLocalGameResult {
  state: GameState;
  /** True if the game is still being played (no winner yet, not in resolved bonus-end state). */
  canMove: boolean;
  /** Winner of the game if it's finished, else null. */
  winner: Player | "tie" | null;
  /** Last attempted move that was rejected; null otherwise. Cleared on next successful move. */
  lastError: MoveError | null;
  /** Move count so far (X and O combined). */
  moveCount: number;
  makeMove: (row: number, col: number) => boolean;
  reset: () => void;
  /** Manually mark a bonus turn as active (testing/online sync). */
  setState: (next: GameState) => void;
}

/**
 * Local 2-player game state holder. Pure wrapper around `lib/game/rules.applyMove`.
 *
 * Handles three meta-state transitions on top of `applyMove`:
 * - Detects when a player at the start of their turn has no moves but the
 *   opponent does → auto-flips to `bonusTurn: true` with the opponent as
 *   currentPlayer.
 * - Detects game-end at turn start (no points possible anymore).
 * - Tracks move count for display purposes.
 */
export function useLocalGame(): UseLocalGameResult {
  const [state, setState] = useState<GameState>(() => createInitialState());
  const [lastError, setLastError] = useState<MoveError | null>(null);
  const [moveCount, setMoveCount] = useState(0);
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

  const winner = useMemo<Player | "tie" | null>(() => {
    if (state.gameActive) return null;
    return getWinner(state.score);
  }, [state.gameActive, state.score]);

  const canMove = state.gameActive;

  const makeMove = useCallback(
    (row: number, col: number): boolean => {
      const outcome = applyMove(state, row, col);
      if (!outcome.ok) {
        setLastError(outcome.error);
        return false;
      }
      setLastError(null);
      setMoveCount((n) => n + 1);
      void lightHaptic();

      let nextState = outcome.result.state;

      // After the move, if the new current player has no moves but the
      // other still does, flip into bonus-turn mode.
      if (nextState.gameActive) {
        const action = resolveTurnStart(nextState);
        if (action.kind === "end") {
          nextState = { ...nextState, gameActive: false };
        } else if (action.kind === "bonus") {
          nextState = {
            ...nextState,
            bonusTurn: true,
            currentPlayer: action.player,
          };
        }
      }

      if (!nextState.gameActive) void notificationHaptic();

      setState(nextState);
      return true;
    },
    [state],
  );

  const reset = useCallback(() => {
    setState(createInitialState());
    setLastError(null);
    setMoveCount(0);
  }, []);

  return {
    state,
    canMove,
    winner,
    lastError,
    moveCount,
    makeMove,
    reset,
    setState,
  };
}
