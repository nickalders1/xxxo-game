import type { Cell, Difficulty, Player } from "../types";
import type {
  BaseGameState,
  MoveOutcome,
  TurnAction,
  Variant,
  VariantMeta,
} from "./types";

// ---------- Types & constants ----------

export const CUBE_SIZE = 5;

export interface Move3D {
  x: number;
  y: number;
  z: number;
}

/** 3D board indexed [z][y][x] — z is "floor" so board[0] is a 5×5 slice we can
 *  hand directly to a 2D renderer for the bottom floor. */
export type Cube3DBoard = Cell[][][];

export interface Cube3DGameState extends BaseGameState {
  variantId: "cube3d";
  board: Cube3DBoard;
  lastMove: {
    X: Move3D | null;
    O: Move3D | null;
  };
  score: { X: number; O: number };
}

/**
 * The 13 unique line directions through any cell in a 3D cube. Generated as
 * the canonical (positive-first-nonzero) representative of each direction
 * (so we don't double-count forward/backward).
 */
const DIRECTIONS_3D: ReadonlyArray<Move3D> = (() => {
  const dirs: Move3D[] = [];
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      for (let dz = -1; dz <= 1; dz++) {
        if (dx === 0 && dy === 0 && dz === 0) continue;
        // Canonical form: first non-zero component is positive.
        if (dx < 0) continue;
        if (dx === 0 && dy < 0) continue;
        if (dx === 0 && dy === 0 && dz < 0) continue;
        dirs.push({ x: dx, y: dy, z: dz });
      }
    }
  }
  return dirs;
})();

const POINTS_FOUR = 1;
const POINTS_FIVE = 2;
const POINTS_EXTEND = 1;

// ---------- Board helpers ----------

function createEmptyCube(): Cube3DBoard {
  return Array.from({ length: CUBE_SIZE }, () =>
    Array.from({ length: CUBE_SIZE }, () =>
      Array.from({ length: CUBE_SIZE }, () => "" as Cell),
    ),
  );
}

function cloneCube(b: Cube3DBoard): Cube3DBoard {
  return b.map((floor) => floor.map((row) => [...row]));
}

function inBounds(p: Move3D): boolean {
  return (
    p.x >= 0 &&
    p.x < CUBE_SIZE &&
    p.y >= 0 &&
    p.y < CUBE_SIZE &&
    p.z >= 0 &&
    p.z < CUBE_SIZE
  );
}

function get(b: Cube3DBoard, p: Move3D): Cell {
  return b[p.z][p.y][p.x];
}

function countEmpty(b: Cube3DBoard): number {
  let n = 0;
  for (let z = 0; z < CUBE_SIZE; z++)
    for (let y = 0; y < CUBE_SIZE; y++)
      for (let x = 0; x < CUBE_SIZE; x++) if (b[z][y][x] === "") n++;
  return n;
}

// ---------- Scoring ----------

/**
 * Point delta from placing `player` at `m` on `board` (placement already
 * applied). Mirrors Classic scoring per direction: 4-in-a-row = +1,
 * fresh 5-in-a-row = +2, extending an existing 4 to 5 = +1.
 */
export function scoreDeltaForMove(
  board: Cube3DBoard,
  m: Move3D,
  player: Player,
): number {
  let total = 0;

  for (const d of DIRECTIONS_3D) {
    let forward = 0;
    for (let i = 1; i < CUBE_SIZE; i++) {
      const p = { x: m.x + d.x * i, y: m.y + d.y * i, z: m.z + d.z * i };
      if (!inBounds(p) || get(board, p) !== player) break;
      forward++;
    }
    let backward = 0;
    for (let i = 1; i < CUBE_SIZE; i++) {
      const p = { x: m.x - d.x * i, y: m.y - d.y * i, z: m.z - d.z * i };
      if (!inBounds(p) || get(board, p) !== player) break;
      backward++;
    }
    const count = 1 + forward + backward;
    const longestSidePre = Math.max(forward, backward);

    if (count >= 5) {
      if (longestSidePre >= 5) {
        // already a 5 on either side — no new points
      } else if (longestSidePre === 4) {
        total += POINTS_EXTEND;
      } else {
        total += POINTS_FIVE;
      }
    } else if (count === 4) {
      if (longestSidePre >= 4) {
        // already a 4 — no new points
      } else {
        total += POINTS_FOUR;
      }
    }
  }

  return total;
}

// ---------- Rules ----------

function isValidPlacement(state: Cube3DGameState, m: Move3D): boolean {
  if (!state.gameActive) return false;
  if (!inBounds(m)) return false;
  if (get(state.board, m) !== "") return false;
  // NOTE: Cube 3D deliberately has no adjacency restriction. 26 neighbours
  // blocked per move on a 125-cell board would lock games up quickly. We may
  // revisit this after playtesting.
  return true;
}

function getValidMoves3D(state: Cube3DGameState): Move3D[] {
  const moves: Move3D[] = [];
  for (let z = 0; z < CUBE_SIZE; z++)
    for (let y = 0; y < CUBE_SIZE; y++)
      for (let x = 0; x < CUBE_SIZE; x++)
        if (state.board[z][y][x] === "") moves.push({ x, y, z });
  return moves;
}

/**
 * Any direction-window of 4 or 5 cells still completable by a single player
 * (no opponent mixed in). When false, no more points possible → game over.
 */
function anyPotentialPoints3D(board: Cube3DBoard): boolean {
  for (const d of DIRECTIONS_3D) {
    for (let z = 0; z < CUBE_SIZE; z++) {
      for (let y = 0; y < CUBE_SIZE; y++) {
        for (let x = 0; x < CUBE_SIZE; x++) {
          // Check 5-window starting here.
          const end5 = {
            x: x + d.x * 4,
            y: y + d.y * 4,
            z: z + d.z * 4,
          };
          if (inBounds(end5)) {
            let hasX = false;
            let hasO = false;
            let hasEmpty = false;
            for (let i = 0; i < 5; i++) {
              const v = board[z + d.z * i][y + d.y * i][x + d.x * i];
              if (v === "X") hasX = true;
              else if (v === "O") hasO = true;
              else hasEmpty = true;
            }
            if (hasEmpty && (!hasX || !hasO)) return true;
          }
          // 4-window starting here.
          const end4 = {
            x: x + d.x * 3,
            y: y + d.y * 3,
            z: z + d.z * 3,
          };
          if (inBounds(end4)) {
            let hasX = false;
            let hasO = false;
            let hasEmpty = false;
            for (let i = 0; i < 4; i++) {
              const v = board[z + d.z * i][y + d.y * i][x + d.x * i];
              if (v === "X") hasX = true;
              else if (v === "O") hasO = true;
              else hasEmpty = true;
            }
            if (hasEmpty && (!hasX || !hasO)) return true;
          }
        }
      }
    }
  }
  return false;
}

// ---------- AI ----------

/**
 * Static evaluation from `player`'s perspective. Sums weighted contributions
 * from every length-5 window: open windows with N player pieces score
 * geometrically (1, 4, 18, 80 for 1..4 pieces), windows with both players
 * are dead. Mirrors Classic's eval philosophy.
 */
export function evaluatePosition(
  board: Cube3DBoard,
  player: Player,
): number {
  const opponent: Player = player === "X" ? "O" : "X";
  const weights = [0, 1, 4, 18, 80, 0];
  let score = 0;

  for (const d of DIRECTIONS_3D) {
    for (let z = 0; z < CUBE_SIZE; z++) {
      for (let y = 0; y < CUBE_SIZE; y++) {
        for (let x = 0; x < CUBE_SIZE; x++) {
          const end = { x: x + d.x * 4, y: y + d.y * 4, z: z + d.z * 4 };
          if (!inBounds(end)) continue;

          let p = 0;
          let o = 0;
          for (let i = 0; i < 5; i++) {
            const v = board[z + d.z * i][y + d.y * i][x + d.x * i];
            if (v === player) p++;
            else if (v === opponent) o++;
          }
          if (o === 0 && p > 0) score += weights[p];
          else if (p === 0 && o > 0) score -= weights[o];
        }
      }
    }
  }
  return score;
}

function centerBias3D(m: Move3D): number {
  const c = (CUBE_SIZE - 1) / 2;
  return -(Math.abs(m.x - c) + Math.abs(m.y - c) + Math.abs(m.z - c));
}

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickFromBand(
  scored: { move: Move3D; score: number }[],
  band: number,
): Move3D {
  scored.sort((a, b) => b.score - a.score);
  const best = scored[0].score;
  const top = scored.filter((s) => s.score >= best - band);
  return top[Math.floor(Math.random() * top.length)].move;
}

/**
 * Pick a move for the AI. Branching factor is huge (~125), so depth-2 minimax
 * is too expensive without serious optimisation. v1 uses 1-ply lookahead with
 * solid static evaluation — sufficient for "hard" feeling on the 3D cube.
 * Future: iterative deepening + transposition tables.
 */
export function chooseAiMove3D(
  state: Cube3DGameState,
  player: Player,
  difficulty: Difficulty,
): Move3D | null {
  const validMoves = getValidMoves3D(state);
  if (validMoves.length === 0) return null;

  // EASY: random with one guard — take an immediate scoring move if available.
  if (difficulty === "easy") {
    for (const m of validMoves) {
      const tb = cloneCube(state.board);
      tb[m.z][m.y][m.x] = player;
      if (scoreDeltaForMove(tb, m, player) > 0) return m;
    }
    return randomFrom(validMoves);
  }

  // MEDIUM and HARD: 1-ply lookahead. Hard widens the band for opening variety.
  const opponent: Player = player === "X" ? "O" : "X";
  const scored: { move: Move3D; score: number }[] = validMoves.map((m) => {
    const tb = cloneCube(state.board);
    tb[m.z][m.y][m.x] = player;
    const gain = scoreDeltaForMove(tb, m, player);

    // Find opponent's best reply (their best immediate scoring move).
    let oppBest = 0;
    for (let z = 0; z < CUBE_SIZE; z++) {
      for (let y = 0; y < CUBE_SIZE; y++) {
        for (let x = 0; x < CUBE_SIZE; x++) {
          if (tb[z][y][x] !== "") continue;
          tb[z][y][x] = opponent;
          const opg = scoreDeltaForMove(tb, { x, y, z }, opponent);
          tb[z][y][x] = "";
          if (opg > oppBest) oppBest = opg;
        }
      }
    }

    const positional =
      evaluatePosition(tb, player) - evaluatePosition(tb, opponent);

    const score =
      gain * 250 -
      oppBest * 200 +
      positional +
      centerBias3D(m) * 1.5 +
      Math.random();
    return { move: m, score };
  });

  // Wide band early so opening play varies across the inner 3×3×3 cells; tight
  // band later when tactics matter. Centre is still strongly favoured by
  // positional eval, but the band lets neighbouring centre cells through.
  const band = difficulty === "hard" ? (state.turnNumber < 6 ? 20 : 3) : 5;
  return pickFromBand(scored, band);
}

// ---------- Variant export ----------

const META: VariantMeta = {
  id: "cube3d",
  name: "Cube 3D",
  tagline: "5×5×5 strategy — lines run through three dimensions",
  description:
    "The board is a 5×5×5 cube. Score 4 or 5 in a row along any of 13 directions: axes, face diagonals, and space diagonals through the cube. No adjacency rule — play anywhere empty.",
  minPlayers: 2,
  maxPlayers: 2,
  supportsLocal: true,
  supportsAi: true,
  // Online wiring lives in socket-server.js and only supports Classic state
  // for now. Will flip to true once the server-side variant dispatch lands.
  supportsOnline: false,
};

function otherPlayer(p: Player): Player {
  return p === "X" ? "O" : "X";
}

export const Cube3D: Variant<Cube3DGameState, Move3D> = {
  meta: META,

  createInitialState() {
    return {
      variantId: "cube3d",
      board: createEmptyCube(),
      currentPlayer: "X",
      gameActive: true,
      score: { X: 0, O: 0 },
      lastMove: { X: null, O: null },
      turnNumber: 0,
    };
  },

  isValidMove(state, move) {
    return isValidPlacement(state, move);
  },

  getValidMoves(state) {
    return getValidMoves3D(state);
  },

  applyMove(state, move): MoveOutcome<Cube3DGameState> {
    if (!state.gameActive) {
      return { ok: false, error: { kind: "game-over" } };
    }
    if (!inBounds(move)) {
      return { ok: false, error: { kind: "out-of-bounds" } };
    }
    if (get(state.board, move) !== "") {
      return { ok: false, error: { kind: "cell-occupied" } };
    }

    const newBoard = cloneCube(state.board);
    newBoard[move.z][move.y][move.x] = state.currentPlayer;

    const points = scoreDeltaForMove(newBoard, move, state.currentPlayer);
    const newScore = { ...state.score };
    newScore[state.currentPlayer] += points;

    const newLastMove = {
      ...state.lastMove,
      [state.currentPlayer]: move,
    };

    // End check: no potential points anywhere OR no empty cells left.
    const stillPoints = anyPotentialPoints3D(newBoard);
    const empty = countEmpty(newBoard);
    const ended = empty === 0 || !stillPoints;

    return {
      ok: true,
      result: {
        state: {
          variantId: "cube3d",
          board: newBoard,
          currentPlayer: ended ? state.currentPlayer : otherPlayer(state.currentPlayer),
          gameActive: !ended,
          score: newScore,
          lastMove: newLastMove,
          turnNumber: state.turnNumber + 1,
        },
        pointsGained: points,
        ended,
      },
    };
  },

  hasPotentialPoints(state) {
    return anyPotentialPoints3D(state.board);
  },

  resolveTurnStart(state): TurnAction {
    if (!state.gameActive) return { kind: "end" };
    if (countEmpty(state.board) === 0) return { kind: "end" };
    if (!anyPotentialPoints3D(state.board)) return { kind: "end" };
    return { kind: "ok" };
  },

  evaluatePosition(state, player) {
    return evaluatePosition(state.board, player);
  },

  scoreDeltaForMove(state, move, player) {
    const board = cloneCube(state.board);
    board[move.z][move.y][move.x] = player;
    return scoreDeltaForMove(board, move, player);
  },

  chooseAiMove(state, player, difficulty) {
    return chooseAiMove3D(state, player, difficulty);
  },

  moveKey(move) {
    return `${move.z}-${move.y}-${move.x}`;
  },

  getPlayers() {
    return ["X", "O"];
  },
};
