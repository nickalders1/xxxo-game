import { BOARD_SIZE, DIRECTIONS } from "./constants";
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

// ---------- Tuning constants ----------

/** Weight per "open line" of length 5 by how many of player's pieces it has.
 *  Nonlinear: 3 and 4 pieces are disproportionately valuable because they're
 *  one or two moves from scoring. Indexed [0..5]. */
const OPEN_LINE_WEIGHTS = [0, 1, 4, 18, 80, 0] as const;

const HARD_MINIMAX_DEPTH = 3;

/** Score band (in eval points) within which we randomise the picked move at
 *  the top of the search tree. Wider band early game = opening variety. */
const HARD_BAND_EARLY = 8;
const HARD_BAND_LATE = 1.5;
/** Cell count at which we switch from "early" (wide-band) to "late" (tight). */
const EARLY_GAME_PIECES_THRESHOLD = 4;

// ---------- Static evaluation ----------

/**
 * Evaluate `board` from `player`'s perspective. Scans every length-5 window
 * and adds OPEN_LINE_WEIGHTS[player_count] for windows containing only the
 * player's pieces (and empty cells), subtracting the symmetric value for the
 * opponent. Windows containing both players are dead and score 0.
 */
export function evaluatePosition(board: Board, player: Player): number {
  let score = 0;
  const opponent: Player = player === "X" ? "O" : "X";

  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      for (const { r: dr, c: dc } of DIRECTIONS) {
        // Skip windows that fall off the board.
        const endR = row + dr * 4;
        const endC = col + dc * 4;
        if (endR < 0 || endR >= BOARD_SIZE || endC < 0 || endC >= BOARD_SIZE)
          continue;

        let playerCount = 0;
        let opponentCount = 0;
        for (let i = 0; i < 5; i++) {
          const v = board[row + dr * i][col + dc * i];
          if (v === player) playerCount++;
          else if (v === opponent) opponentCount++;
        }
        if (opponentCount === 0 && playerCount > 0) {
          score += OPEN_LINE_WEIGHTS[playerCount];
        } else if (playerCount === 0 && opponentCount > 0) {
          score -= OPEN_LINE_WEIGHTS[opponentCount];
        }
      }
    }
  }
  return score;
}

function centerBias(m: Move): number {
  const c = (BOARD_SIZE - 1) / 2;
  return -(Math.abs(m.row - c) + Math.abs(m.col - c));
}

function piecesOnBoard(board: Board): number {
  let n = 0;
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c] !== "") n++;
    }
  }
  return n;
}

function pickFromBand(
  scored: { move: Move; score: number }[],
  band: number,
): Move | null {
  if (scored.length === 0) return null;
  const sorted = [...scored].sort((a, b) => b.score - a.score);
  const best = sorted[0].score;
  const candidates = sorted.filter((s) => s.score >= best - band);
  return candidates[Math.floor(Math.random() * candidates.length)].move;
}

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ---------- EASY: real beginner ----------
//
// Personality: makes obvious mistakes, but isn't braindead.
// - Always takes a move that immediately scores points (otherwise the AI
//   looks accidentally stupid, not "easy")
// - Always blocks a 5-in-a-row threat (otherwise games end embarrassingly
//   fast and feel cheap)
// - Otherwise picks a random valid move (no center bias, no foresight)

function chooseEasyMove(
  board: Board,
  lastMove: LastMoves,
  validMoves: Move[],
): Move {
  // 1. Take scoring move if any.
  for (const m of validMoves) {
    const tb = cloneBoard(board);
    tb[m.row][m.col] = "O";
    if (scoreDeltaForMove(tb, m.row, m.col, "O") > 0) return m;
  }
  // 2. Block opponent's immediate 5-in-a-row (the 2-point threat).
  const oppMoves = getValidMoves(board, "X", lastMove);
  for (const om of oppMoves) {
    const tb = cloneBoard(board);
    tb[om.row][om.col] = "X";
    if (scoreDeltaForMove(tb, om.row, om.col, "X") >= 2) {
      // Try to play the same cell (block).
      const block = validMoves.find((v) => v.row === om.row && v.col === om.col);
      if (block) return block;
    }
  }
  // 3. Otherwise random — no center bias, no foresight.
  return randomFrom(validMoves);
}

// ---------- MEDIUM: solid casual player ----------
//
// Personality: knows what's going on, but doesn't search ahead.
// - Always takes scoring moves
// - Always blocks immediate scoring threats (4 AND 5 in a row)
// - 1-ply opponent lookahead: doesn't play moves that give opponent free points
// - Mild center preference
// - Picks randomly among top moves so it's not always the same

function chooseMediumMove(
  board: Board,
  lastMove: LastMoves,
  validMoves: Move[],
): Move {
  const scored: { move: Move; score: number }[] = validMoves.map((m) => {
    const tb = cloneBoard(board);
    tb[m.row][m.col] = "O";
    const gain = scoreDeltaForMove(tb, m.row, m.col, "O");

    // Opponent's best reply
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

    const positional =
      evaluatePosition(tb, "O") - evaluatePosition(tb, "X");

    // Weights: gaining a point dominates, blocking the opponent's gain is
    // weighted slightly less (defence < offence), then small positional and
    // centre nudges, plus tiny noise.
    const score =
      gain * 200 -
      oppBest * 180 +
      positional * 1 +
      centerBias(m) * 2 +
      Math.random();
    return { move: m, score };
  });
  return pickFromBand(scored, 1.5)!;
}

// ---------- HARD: strong player ----------
//
// Personality: depth-3 alpha-beta minimax with the improved evaluation.
// Plays multiple moves ahead so trap setups work. Picks randomly among
// near-equally-good moves so it's not predictable on identical positions.

interface MinimaxArgs {
  board: Board;
  lastMove: LastMoves;
  score: Score;
  current: Player;
  depth: number;
  alpha: number;
  beta: number;
}

function evalForO(
  board: Board,
  score: Score,
  lastMove: LastMoves,
): number {
  const scoreDiff = (score.O - score.X) * 250;
  const positional = evaluatePosition(board, "O") - evaluatePosition(board, "X");
  const mobility =
    getValidMoves(board, "O", lastMove).length -
    getValidMoves(board, "X", lastMove).length;
  return scoreDiff + positional + mobility * 2;
}

function isTerminal(board: Board, lastMove: LastMoves): boolean {
  const xCan = hasAnyValidMove(board, "X", lastMove);
  const oCan = hasAnyValidMove(board, "O", lastMove);
  if (!xCan && !oCan) return true;
  if (countEmptyCells(board) <= 1) return true;
  if (!anyPotentialPoints(board)) return true;
  return false;
}

/** Move ordering: try moves that immediately score for the side-to-move
 *  first, then moves closer to the centre. Cheap heuristic that gives
 *  alpha-beta much better pruning. */
function orderMoves(
  board: Board,
  moves: Move[],
  player: Player,
): Move[] {
  const annotated = moves.map((m) => {
    const tb = cloneBoard(board);
    tb[m.row][m.col] = player;
    const gain = scoreDeltaForMove(tb, m.row, m.col, player);
    return { m, key: gain * 100 + centerBias(m) };
  });
  annotated.sort((a, b) => b.key - a.key);
  return annotated.map((a) => a.m);
}

function minimax({
  board,
  lastMove,
  score,
  current,
  depth,
  alpha,
  beta,
}: MinimaxArgs): number {
  if (depth === 0 || isTerminal(board, lastMove)) {
    return evalForO(board, score, lastMove);
  }
  const moves = orderMoves(board, getValidMoves(board, current, lastMove), current);
  if (moves.length === 0) {
    // Current player has no moves but other might — pass turn, depth unchanged.
    return evalForO(board, score, lastMove);
  }

  if (current === "O") {
    let best = -Infinity;
    let a = alpha;
    for (const m of moves) {
      const nb = cloneBoard(board);
      nb[m.row][m.col] = "O";
      const pts = scoreDeltaForMove(nb, m.row, m.col, "O");
      const ns: Score = { X: score.X, O: score.O + pts };
      const nlm: LastMoves = { ...lastMove, O: { row: m.row, col: m.col } };
      const v = minimax({
        board: nb,
        lastMove: nlm,
        score: ns,
        current: "X",
        depth: depth - 1,
        alpha: a,
        beta,
      });
      if (v > best) best = v;
      if (best > a) a = best;
      if (a >= beta) break;
    }
    return best;
  } else {
    let best = Infinity;
    let b = beta;
    for (const m of moves) {
      const nb = cloneBoard(board);
      nb[m.row][m.col] = "X";
      const pts = scoreDeltaForMove(nb, m.row, m.col, "X");
      const ns: Score = { X: score.X + pts, O: score.O };
      const nlm: LastMoves = { ...lastMove, X: { row: m.row, col: m.col } };
      const v = minimax({
        board: nb,
        lastMove: nlm,
        score: ns,
        current: "O",
        depth: depth - 1,
        alpha,
        beta: b,
      });
      if (v < best) best = v;
      if (best < b) b = best;
      if (alpha >= b) break;
    }
    return best;
  }
}

function chooseHardMove(
  board: Board,
  lastMove: LastMoves,
  score: Score,
  validMoves: Move[],
): Move {
  const pieces = piecesOnBoard(board);
  const band = pieces <= EARLY_GAME_PIECES_THRESHOLD ? HARD_BAND_EARLY : HARD_BAND_LATE;

  // Score each top-level move via minimax to depth HARD_MINIMAX_DEPTH.
  const scored: { move: Move; score: number }[] = [];
  const ordered = orderMoves(board, validMoves, "O");
  for (const m of ordered) {
    const nb = cloneBoard(board);
    nb[m.row][m.col] = "O";
    const pts = scoreDeltaForMove(nb, m.row, m.col, "O");
    const ns: Score = { X: score.X, O: score.O + pts };
    const nlm: LastMoves = { ...lastMove, O: { row: m.row, col: m.col } };
    const v = minimax({
      board: nb,
      lastMove: nlm,
      score: ns,
      current: "X",
      depth: HARD_MINIMAX_DEPTH - 1,
      alpha: -Infinity,
      beta: Infinity,
    });
    // Tiny noise so identically-evaluated moves get a stable shuffle each call.
    scored.push({ move: m, score: v + Math.random() * 0.3 });
  }
  return pickFromBand(scored, band)!;
}

// ---------- Public API ----------

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

  switch (difficulty) {
    case "easy":
      return chooseEasyMove(board, lastMove, validMoves);
    case "medium":
      return chooseMediumMove(board, lastMove, validMoves);
    case "hard":
      return chooseHardMove(board, lastMove, score, validMoves);
  }
}
