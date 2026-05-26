"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { chooseAiMove } from "@/lib/game/ai";
import { AI_THINK_DELAY_MS } from "@/lib/game/constants";
import type { Difficulty, MoveError, Player } from "@/lib/game/types";
import { useLocalGame } from "./useLocalGame";

export interface UseAIGameResult {
  state: ReturnType<typeof useLocalGame>["state"];
  canMove: boolean;
  winner: Player | "tie" | null;
  lastError: MoveError | null;
  moveCount: number;
  difficulty: Difficulty;
  setDifficulty: (d: Difficulty) => void;
  isAiThinking: boolean;
  /** Player should be "X". Returns true if the move was accepted. */
  makeMove: (row: number, col: number) => boolean;
  reset: () => void;
}

/**
 * AI game hook. The human always plays X, AI plays O.
 *
 * The AI move is scheduled via setTimeout (delay varies by difficulty) and is
 * cancelled automatically if the game is reset or the component unmounts.
 */
export function useAIGame(initialDifficulty: Difficulty = "medium"): UseAIGameResult {
  const game = useLocalGame();
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

  // Drive the AI: whenever it's O's turn in an active game, schedule a move.
  useEffect(() => {
    if (!game.state.gameActive) return;
    if (game.state.currentPlayer !== "O") return;
    if (isAiThinking) return;

    setIsAiThinking(true);
    aiTimerRef.current = setTimeout(() => {
      const move = chooseAiMove({
        board: game.state.board,
        lastMove: game.state.lastMove,
        score: game.state.score,
        difficulty,
      });
      aiTimerRef.current = null;
      setIsAiThinking(false);
      if (move) {
        game.makeMove(move.row, move.col);
      }
    }, AI_THINK_DELAY_MS[difficulty]());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    game.state.currentPlayer,
    game.state.gameActive,
    game.state.board,
    game.state.lastMove,
    difficulty,
  ]);

  useEffect(() => {
    return () => cancelPendingAi();
  }, [cancelPendingAi]);

  const reset = useCallback(() => {
    cancelPendingAi();
    game.reset();
  }, [cancelPendingAi, game]);

  const makeMove = useCallback(
    (row: number, col: number): boolean => {
      // Block human moves when it's AI's turn.
      if (game.state.currentPlayer !== "X") return false;
      if (isAiThinking) return false;
      return game.makeMove(row, col);
    },
    [game, isAiThinking],
  );

  return {
    state: game.state,
    canMove: game.canMove && game.state.currentPlayer === "X" && !isAiThinking,
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
