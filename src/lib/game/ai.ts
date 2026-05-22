import {
  BOARD_SIZE,
  DIRECTIONS,
  MINIMAX_DEPTH_HARD,
} from "./constants";
import {
  anyPotentialPoints,
  cloneBoard,
  countEmptyCells,
  getValidMoves,
  hasAnyValidMove,
} from "./rules";
import { scoreDeltaForMove } from "./scoring";
import type {
  Board,
  Difficulty,
  LastMoves,
  Move,
  Player,
  Score,
} from "./types";

/**
 * Static evaluation of `board` from `player`'s perspective.
 * Counts every length-5 window the player could still complete (no opponent
 * pieces) as +n² where n is their count in the window, and subtracts the
 * opponent's symmetric value.
 */
export function evaluatePosition(board: Board, player: Player): number {
  let score = 0;
  const opponent: Player = player === "X" ? "O" : "X";

  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      for (const { r: dr, c: dc } of DIRECTIONS) {
        let playerCount = 0;
        let opponentCount = 0;
        for (let i = 0; i < 5; i++) {
          const nr = row + dr * i;
          const nc = col + dc * i;
          if (nr < 0 || nr >= BOARD_SIZE || nc < 0 || nc >= BOARD_SIZE) continue;
          const v = board[nr][nc];
          if (v === player) playerCount++;
          else if (v === opponent) opponentCount++;
        }
        if (opponentCount === 0 && playerCount > 0)
          score += playerCount * playerCount;
        if (playerCount === 0 && opponentCount > 0)
          score -= opponentCount * opponentCount;
      }
    }
  }
  return score;
}

function centerBias(m: Move): number {
  const c = (BOARD_SIZE - 1) / 2;
  return -Math.abs(m.row - c) - Math.abs(m.col - c);
}

function pickFromTop(scored: { move: Move; score: number }[]): Move | null {
  if (scored.length === 0) return null;
  const sorted = [...scored].sort((a, b) => b.score - a.score);
  const best = sorted[0].score;
  const band = sorted.filter((s) => s.score >= best - 1.5);
  return band[Math.floor(Math.random() * band.length)].move;
}

interface MinimaxArgs {
  board: Board;
  lastMove: LastMoves;
  score: Score;
  current: Player;
  depth: number;
  alpha: number;
  beta: number;
}

function evalBoardForO(
  board: Board,
  score: Score,
  lastMove: LastMoves,
): number {
  const scoreDiff = (score.O - score.X) * 120;
  const patternDiff =
    evaluatePosition(board, "O") - evaluatePosition(board, "X");
  const mobility =
    getValidMoves(board, "O", lastMove).length -
    getValidMoves(board, "X", lastMove).length;
  return scoreDiff + patternDiff + mobility * 2;
}

function isTerminal(
  board: Board,
  score: Score,
  lastMove: LastMoves,
): boolean {
  const xCan = hasAnyValidMove(board, "X", lastMove);
  const oCan = hasAnyValidMove(board, "O", lastMove);
  const stillPoints = anyPotentialPoints(board);
  const empty = countEmptyCells(board);
  void score;
  return empty <= 1 || (!xCan && !oCan) || !stillPoints;
}

function minimax({
  board,
  lastMove,
  score,
  current,
  depth,
  alpha,
  beta,
}: MinimaxArgs): { value: number; move?: Move } {
  if (isTerminal(board, score, lastMove) || depth === 0) {
    return {
      value: evalBoardForO(board, score, lastMove) + Math.random() * 0.5,
    };
  }

  if (current === "O") {
    let bestVal = -Infinity;
    let bestMove: Move | undefined;
    const moves = getValidMoves(board, "O", lastMove);
    let a = alpha;
    for (const m of moves) {
      const nb = cloneBoard(board);
      nb[m.row][m.col] = "O";
      const pts = scoreDeltaForMove(nb, m.row, m.col, "O");
      const ns: Score = { X: score.X, O: score.O + pts };
      const nlm: LastMoves = { ...lastMove, O: { row: m.row, col: m.col } };
      const res = minimax({
        board: nb,
        lastMove: nlm,
        score: ns,
        current: "X",
        depth: depth - 1,
        alpha: a,
        beta,
      });
      if (res.value > bestVal) {
        bestVal = res.value;
        bestMove = m;
      }
      a = Math.max(a, bestVal);
      if (beta <= a) break;
    }
    return { value: bestVal, move: bestMove };
  } else {
    let bestVal = Infinity;
    let b = beta;
    const moves = getValidMoves(board, "X", lastMove);
    for (const m of moves) {
      const nb = cloneBoard(board);
      nb[m.row][m.col] = "X";
      const pts = scoreDeltaForMove(nb, m.row, m.col, "X");
      const ns: Score = { X: score.X + pts, O: score.O };
      const nlm: LastMoves = { ...lastMove, X: { row: m.row, col: m.col } };
      const res = minimax({
        board: nb,
        lastMove: nlm,
        score: ns,
        current: "O",
        depth: depth - 1,
        alpha,
        beta: b,
      });
      if (res.value < bestVal) bestVal = res.value;
      b = Math.min(b, bestVal);
      if (b <= alpha) break;
    }
    return { value: bestVal };
  }
}

/**
 * Decide the AI's move (always plays as "O") given the difficulty level.
 * Returns `null` only when no valid moves are available at all.
 */
export function chooseAiMove(args: {
  board: Board;
  lastMove: LastMoves;
  score: Score;
  difficulty: Difficulty;
}): Move | null {
  const { board, lastMove, score, difficulty } = args;
  const validMoves = getValidMoves(board, "O", lastMove);
  if (validMoves.length === 0) return null;

  if (difficulty === "easy") {
    const scored = validMoves
      .map((m) => {
        const tb = cloneBoard(board);
        tb[m.row][m.col] = "O";
        const p = scoreDeltaForMove(tb, m.row, m.col, "O");
        return { move: m, score: p + Math.random() };
      })
      .filter((x) => x.score > 0);
    return (
      pickFromTop(scored) ??
      validMoves[Math.floor(Math.random() * validMoves.length)]
    );
  }

  if (difficulty === "medium") {
    const scored: { move: Move; score: number }[] = [];
    for (const m of validMoves) {
      const tb = cloneBoard(board);
      tb[m.row][m.col] = "O";
      const gain = scoreDeltaForMove(tb, m.row, m.col, "O");
      const oppMoves = getValidMoves(tb, "X", {
        ...lastMove,
        O: { row: m.row, col: m.col },
      });
      let oppBest = 0;
      for (const om of oppMoves) {
        const t2 = cloneBoard(tb);
        t2[om.row][om.col] = "X";
        const opg = scoreDeltaForMove(t2, om.row, om.col, "X");
        if (opg > oppBest) oppBest = opg;
      }
      const s =
        gain * 120 -
        oppBest * 110 +
        (evaluatePosition(tb, "O") - evaluatePosition(tb, "X")) +
        centerBias(m) * 2 +
        Math.random();
      scored.push({ move: m, score: s });
    }
    return (
      pickFromTop(scored) ??
      validMoves[Math.floor(Math.random() * validMoves.length)]
    );
  }

  // Hard: full alpha-beta minimax with depth MINIMAX_DEPTH_HARD.
  const res = minimax({
    board,
    lastMove,
    score: { ...score },
    current: "O",
    depth: MINIMAX_DEPTH_HARD,
    alpha: -Infinity,
    beta: Infinity,
  });
  if (res.move) return res.move;

  const backup = validMoves.map((m) => {
    const tb = cloneBoard(board);
    tb[m.row][m.col] = "O";
    const s =
      scoreDeltaForMove(tb, m.row, m.col, "O") * 120 +
      (evaluatePosition(tb, "O") - evaluatePosition(tb, "X")) +
      centerBias(m) +
      Math.random();
    return { move: m, score: s };
  });
  return (
    pickFromTop(backup) ??
    validMoves[Math.floor(Math.random() * validMoves.length)]
  );
}
