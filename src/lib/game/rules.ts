import {
  ADJACENCY_RADIUS,
  BOARD_SIZE,
  DIRECTIONS,
} from "./constants";
import { scoreDeltaForMove } from "./scoring";
import type {
  Board,
  GameState,
  LastMoves,
  Move,
  MoveOutcome,
  Player,
  Score,
  TurnAction,
} from "./types";

export function createEmptyBoard(): Board {
  return Array.from({ length: BOARD_SIZE }, () =>
    Array.from({ length: BOARD_SIZE }, () => "" as const),
  );
}

export function cloneBoard(board: Board): Board {
  return board.map((row) => [...row]);
}

export function createInitialState(): GameState {
  return {
    board: createEmptyBoard(),
    currentPlayer: "X",
    gameActive: true,
    score: { X: 0, O: 0 },
    lastMove: { X: null, O: null },
    bonusTurn: false,
  };
}

export function otherPlayer(player: Player): Player {
  return player === "X" ? "O" : "X";
}

export function isAdjacentToLastMove(
  row: number,
  col: number,
  lastMoves: LastMoves,
  player: Player,
): boolean {
  const last = lastMoves[player];
  if (!last) return false;
  return (
    Math.abs(row - last.row) <= ADJACENCY_RADIUS &&
    Math.abs(col - last.col) <= ADJACENCY_RADIUS
  );
}

export function isValidMove(
  state: GameState,
  row: number,
  col: number,
): boolean {
  if (!state.gameActive) return false;
  if (row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE) return false;
  if (state.board[row][col] !== "") return false;
  if (isAdjacentToLastMove(row, col, state.lastMove, state.currentPlayer))
    return false;
  return true;
}

export function getValidMoves(
  board: Board,
  player: Player,
  lastMoves: LastMoves,
): Move[] {
  const moves: Move[] = [];
  const last = lastMoves[player];
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (board[row][col] !== "") continue;
      if (
        last &&
        Math.abs(row - last.row) <= ADJACENCY_RADIUS &&
        Math.abs(col - last.col) <= ADJACENCY_RADIUS
      ) {
        continue;
      }
      moves.push({ row, col });
    }
  }
  return moves;
}

export function hasAnyValidMove(
  board: Board,
  player: Player,
  lastMoves: LastMoves,
): boolean {
  const last = lastMoves[player];
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (board[row][col] !== "") continue;
      if (
        last &&
        Math.abs(row - last.row) <= ADJACENCY_RADIUS &&
        Math.abs(col - last.col) <= ADJACENCY_RADIUS
      ) {
        continue;
      }
      return true;
    }
  }
  return false;
}

export function countEmptyCells(board: Board): number {
  let count = 0;
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (board[row][col] === "") count++;
    }
  }
  return count;
}

/**
 * True if there is any straight 4- or 5-cell run on the board that can still
 * be completed by a single player (i.e. doesn't already contain both X and O).
 * When this returns false, no more points can possibly be scored.
 */
export function anyPotentialPoints(board: Board): boolean {
  const inBounds = (r: number, c: number) =>
    r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE;

  for (const { r: dr, c: dc } of DIRECTIONS) {
    for (let sr = 0; sr < BOARD_SIZE; sr++) {
      for (let sc = 0; sc < BOARD_SIZE; sc++) {
        // Window of 4
        const e4r = sr + dr * 3;
        const e4c = sc + dc * 3;
        if (inBounds(e4r, e4c)) {
          let hasX = false;
          let hasO = false;
          let hasEmpty = false;
          for (let i = 0; i < 4; i++) {
            const v = board[sr + dr * i][sc + dc * i];
            if (v === "X") hasX = true;
            else if (v === "O") hasO = true;
            else hasEmpty = true;
          }
          if (hasEmpty && (!hasX || !hasO)) return true;
        }

        // Window of 5
        const e5r = sr + dr * 4;
        const e5c = sc + dc * 4;
        if (inBounds(e5r, e5c)) {
          let hasX = false;
          let hasO = false;
          let hasEmpty = false;
          for (let i = 0; i < 5; i++) {
            const v = board[sr + dr * i][sc + dc * i];
            if (v === "X") hasX = true;
            else if (v === "O") hasO = true;
            else hasEmpty = true;
          }
          if (hasEmpty && (!hasX || !hasO)) return true;
        }
      }
    }
  }
  return false;
}

/**
 * Determines what happens at the START of `current`'s turn given the board.
 * - "end"   : no more points can be scored / no moves left for either side
 *             / board essentially full → game over.
 * - "bonus" : `current` has no valid moves but the other player does → the
 *             other player gets one final bonus move and the game ends.
 * - "ok"    : current player plays normally.
 */
export function resolveTurnStart(state: GameState): TurnAction {
  const { board, score, lastMove, currentPlayer } = state;
  const xCan = hasAnyValidMove(board, "X", lastMove);
  const oCan = hasAnyValidMove(board, "O", lastMove);
  const stillPoints = anyPotentialPoints(board);
  const empty = countEmptyCells(board);

  void score; // currently unused; reserved for future early-exit on huge leads

  if (empty <= 1 || (!xCan && !oCan) || !stillPoints) {
    return { kind: "end" };
  }
  if (currentPlayer === "X" && !xCan && oCan) {
    return { kind: "bonus", player: "O" };
  }
  if (currentPlayer === "O" && !oCan && xCan) {
    return { kind: "bonus", player: "X" };
  }
  return { kind: "ok" };
}

/**
 * Pure move application. Returns either the new GameState wrapped in `ok: true`,
 * or a structured error (`ok: false`) explaining why the move is invalid.
 *
 * Handles:
 * - cell occupied / adjacency / game-over guards
 * - scoring via [[scoring.ts:scoreDeltaForMove]]
 * - bonus-turn finalisation (consumes the bonus and ends the game)
 * - end-of-game detection after the move
 * - turn handover to the other player when the game continues
 */
export function applyMove(
  state: GameState,
  row: number,
  col: number,
): MoveOutcome {
  if (!state.gameActive) return { ok: false, error: { kind: "game-over" } };
  if (state.board[row][col] !== "")
    return { ok: false, error: { kind: "cell-occupied" } };
  if (isAdjacentToLastMove(row, col, state.lastMove, state.currentPlayer)) {
    return { ok: false, error: { kind: "adjacent-to-last-move" } };
  }

  const newBoard = cloneBoard(state.board);
  newBoard[row][col] = state.currentPlayer;

  const pointsGained = scoreDeltaForMove(newBoard, row, col, state.currentPlayer);
  const newScore: Score = { ...state.score };
  newScore[state.currentPlayer] += pointsGained;

  const newLastMove: LastMoves = { ...state.lastMove };
  newLastMove[state.currentPlayer] = { row, col };

  // If this move consumed the bonus turn, end immediately.
  if (state.bonusTurn) {
    return {
      ok: true,
      result: {
        state: {
          ...state,
          board: newBoard,
          score: newScore,
          lastMove: newLastMove,
          bonusTurn: false,
          gameActive: false,
        },
        pointsGained,
        ended: true,
      },
    };
  }

  // End-of-game check after this move.
  const xCan = hasAnyValidMove(newBoard, "X", newLastMove);
  const oCan = hasAnyValidMove(newBoard, "O", newLastMove);
  const stillPoints = anyPotentialPoints(newBoard);
  const empty = countEmptyCells(newBoard);
  const ended = empty <= 1 || (!xCan && !oCan) || !stillPoints;

  if (ended) {
    return {
      ok: true,
      result: {
        state: {
          ...state,
          board: newBoard,
          score: newScore,
          lastMove: newLastMove,
          gameActive: false,
        },
        pointsGained,
        ended: true,
      },
    };
  }

  const next = otherPlayer(state.currentPlayer);
  return {
    ok: true,
    result: {
      state: {
        ...state,
        board: newBoard,
        score: newScore,
        lastMove: newLastMove,
        currentPlayer: next,
      },
      pointsGained,
      ended: false,
    },
  };
}

export type Winner = Player | "tie";

export function getWinner(score: Score): Winner {
  if (score.X > score.O) return "X";
  if (score.O > score.X) return "O";
  return "tie";
}
