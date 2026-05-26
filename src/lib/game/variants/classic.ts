import { chooseAiMove as legacyChooseAiMove, evaluatePosition as legacyEvaluatePosition } from "../ai";
import {
  anyPotentialPoints,
  applyMove as legacyApplyMove,
  createInitialState as createLegacyInitialState,
  getValidMoves as legacyGetValidMoves,
  isValidMove as legacyIsValidMove,
  resolveTurnStart as legacyResolveTurnStart,
} from "../rules";
import { scoreDeltaForMove as legacyScoreDeltaForMove } from "../scoring";
import type {
  Board,
  Difficulty,
  GameState,
  LastMoves,
  Move,
} from "../types";
import type {
  BaseGameState,
  MoveOutcome,
  TurnAction,
  Variant,
  VariantMeta,
} from "./types";

/**
 * Classic 5×5 game state. Adds variantId + turnNumber to the legacy GameState
 * so it conforms to BaseGameState. The legacy GameState type still exists for
 * the underlying rules.ts / ai.ts functions — we adapt on the boundary.
 */
export interface ClassicGameState extends BaseGameState {
  variantId: "classic";
  board: Board;
  lastMove: LastMoves;
  bonusTurn: boolean;
  score: { X: number; O: number };
}

const META: VariantMeta = {
  id: "classic",
  name: "Classic",
  tagline: "5×5 board, score 4 or 5 in a row",
  description:
    "The original. Place an X or O on a 5×5 grid. Score 1 point for 4 in a row, 2 for 5. You can't place next to your own last move — plan ahead.",
  minPlayers: 2,
  maxPlayers: 2,
  supportsLocal: true,
  supportsAi: true,
  supportsOnline: true,
};

/** Convert legacy GameState (no variantId/turnNumber) → ClassicGameState. */
function fromLegacy(legacy: GameState, turnNumber: number): ClassicGameState {
  return {
    variantId: "classic",
    board: legacy.board,
    currentPlayer: legacy.currentPlayer,
    gameActive: legacy.gameActive,
    score: legacy.score,
    lastMove: legacy.lastMove,
    bonusTurn: legacy.bonusTurn,
    turnNumber,
  };
}

/** Convert ClassicGameState → legacy GameState (drop variantId/turnNumber). */
function toLegacy(state: ClassicGameState): GameState {
  return {
    board: state.board,
    currentPlayer: state.currentPlayer,
    gameActive: state.gameActive,
    score: state.score,
    lastMove: state.lastMove,
    bonusTurn: state.bonusTurn,
  };
}

export const Classic: Variant<ClassicGameState, Move> = {
  meta: META,

  createInitialState() {
    return fromLegacy(createLegacyInitialState(), 0);
  },

  isValidMove(state, move) {
    return legacyIsValidMove(toLegacy(state), move.row, move.col);
  },

  getValidMoves(state, player) {
    return legacyGetValidMoves(state.board, player, state.lastMove);
  },

  applyMove(state, move): MoveOutcome<ClassicGameState> {
    const outcome = legacyApplyMove(toLegacy(state), move.row, move.col);
    if (!outcome.ok) {
      return { ok: false, error: outcome.error };
    }
    return {
      ok: true,
      result: {
        state: fromLegacy(outcome.result.state, state.turnNumber + 1),
        pointsGained: outcome.result.pointsGained,
        ended: outcome.result.ended,
      },
    };
  },

  hasPotentialPoints(state) {
    return anyPotentialPoints(state.board);
  },

  resolveTurnStart(state): TurnAction {
    return legacyResolveTurnStart(toLegacy(state));
  },

  evaluatePosition(state, player) {
    return legacyEvaluatePosition(state.board, player);
  },

  scoreDeltaForMove(state, move, player) {
    // The legacy function evaluates an already-placed board, so we have to
    // simulate the placement first.
    const board = state.board.map((row) => [...row]);
    board[move.row][move.col] = player;
    return legacyScoreDeltaForMove(board, move.row, move.col, player);
  },

  chooseAiMove(state, player, difficulty: Difficulty) {
    // Legacy AI always plays as "O". Classic only supports O as the AI.
    if (player !== "O") return null;
    return legacyChooseAiMove({
      board: state.board,
      lastMove: state.lastMove,
      score: state.score,
      difficulty,
    });
  },

  moveKey(move) {
    return `${move.row}-${move.col}`;
  },

  getPlayers() {
    return ["X", "O"];
  },
};
