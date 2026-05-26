"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AI_THINK_DELAY_MS } from "@/lib/game/constants";
import type { Difficulty, Player } from "@/lib/game/types";
import type { BaseGameState, MoveError, Variant } from "@/lib/game/variants/types";
import { useLocalGame } from "./useLocalGame";

export interface UseAIGameResult<TState extends BaseGameState, TMove> {
  state: TState;
  canMove: boolean;
  winner: Player | "tie" | null;
  lastError: MoveError | null;
  moveCount: number;
  difficulty: Difficulty;
  setDifficulty: (d: Difficulty) => void;
  isAiThinking: boolean;
  /** Player should be "X". Returns true if the move was accepted. */
  makeMove: (move: TMove) => boolean;
  reset: () => void;
}

const HUMAN_PLAYER: Player = "X";
const AI_PLAYER: Player = "O";

/**
 * Generic AI game hook — human always plays X, AI plays O. Delegates state to
 * useLocalGame and adds a scheduled AI turn via the variant's chooseAiMove.
 *
 * The pending AI move is cancelled on unmount, reset, and variant change so
 * we never apply a stale move to a fresh board.
 */
export function useAIGame<TState extends BaseGameState, TMove>(
  variant: Variant<TState, TMove>,
  initialDifficulty: Difficulty = "medium",
): UseAIGameResult<TState, TMove> {
  const game = useLocalGame(variant);
  const [difficulty, setDifficulty] = useState<Difficulty>(initialDifficulty);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const aiTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelPendingAi = useCallback(() => {
    if (aiTimerRef.current) {
      clearTimeout(aiTimerRef.current);
      aiTimerRef.current = null;
    }
    setIsAiThinking(false);
  }, []);

  useEffect(() => {
    if (!game.state.gameActive) return;
    if (game.state.currentPlayer !== AI_PLAYER) return;
    if (isAiThinking) return;

    setIsAiThinking(true);
    aiTimerRef.current = setTimeout(() => {
      const move = variant.chooseAiMove(game.state, AI_PLAYER, difficulty);
      aiTimerRef.current = null;
      setIsAiThinking(false);
      if (move) game.makeMove(move);
    }, AI_THINK_DELAY_MS[difficulty]());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.state.currentPlayer, game.state.gameActive, game.state.turnNumber, difficulty, variant.meta.id]);

  // Cancel anything pending on unmount or variant swap.
  useEffect(() => {
    return () => cancelPendingAi();
  }, [cancelPendingAi]);

  useEffect(() => {
    cancelPendingAi();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variant.meta.id]);

  const reset = useCallback(() => {
    cancelPendingAi();
    game.reset();
  }, [cancelPendingAi, game]);

  const makeMove = useCallback(
    (move: TMove): boolean => {
      if (game.state.currentPlayer !== HUMAN_PLAYER) return false;
      if (isAiThinking) return false;
      return game.makeMove(move);
    },
    [game, isAiThinking],
  );

  return {
    state: game.state,
    canMove: game.canMove && game.state.currentPlayer === HUMAN_PLAYER && !isAiThinking,
    winner: game.winner,
    lastError: game.lastError,
    moveCount: game.moveCount,
    difficulty,
    setDifficulty,
    isAiThinking,
    makeMove,
    reset,
  };
}
