import { describe, expect, it } from "vitest";
import { chooseAiMove, evaluatePosition } from "../ai";
import {
  createEmptyBoard,
  createInitialState,
  isValidMove,
} from "../rules";
import type { Board, Difficulty } from "../types";

const ALL_DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];

// ---------- evaluatePosition ----------

describe("evaluatePosition", () => {
  it("is 0 on a fully empty board", () => {
    const b = createEmptyBoard();
    expect(evaluatePosition(b, "X")).toBe(0);
    expect(evaluatePosition(b, "O")).toBe(0);
  });

  it("is positive for the player with more open potential", () => {
    const b = createEmptyBoard();
    b[0][0] = "X";
    b[0][1] = "X";
    b[0][2] = "X";
    expect(evaluatePosition(b, "X")).toBeGreaterThan(0);
    expect(evaluatePosition(b, "O")).toBeLessThan(0);
  });

  it("ignores lines that contain both players (blocked lines score 0)", () => {
    const b = createEmptyBoard();
    b[0][0] = "X";
    b[0][1] = "X";
    b[0][2] = "X";
    b[0][3] = "O"; // blocks the row
    const score = evaluatePosition(b, "X");
    // Row windows starting at (0,0) and (0,1) and onward all contain O now,
    // so they're worth 0. Other directions through the X cells still count.
    expect(score).toBeGreaterThanOrEqual(0);
  });

  it("rewards a near-complete line (3-in-a-row) more than a 2-in-a-row", () => {
    // Single horizontal line: 3 pieces vs. 2 pieces, same alignment.
    const b3 = createEmptyBoard();
    b3[0][0] = "X";
    b3[0][1] = "X";
    b3[0][2] = "X";

    const b2 = createEmptyBoard();
    b2[0][0] = "X";
    b2[0][1] = "X";

    expect(evaluatePosition(b3, "X")).toBeGreaterThan(
      evaluatePosition(b2, "X"),
    );
  });
});

// ---------- chooseAiMove — invariants ----------

describe("chooseAiMove invariants", () => {
  for (const d of ALL_DIFFICULTIES) {
    it(`returns a valid move on an empty board (difficulty=${d})`, () => {
      const s = createInitialState();
      const move = chooseAiMove({
        board: s.board,
        lastMove: s.lastMove,
        score: s.score,
        difficulty: d,
      });
      expect(move).not.toBeNull();
      expect(move!.row).toBeGreaterThanOrEqual(0);
      expect(move!.col).toBeGreaterThanOrEqual(0);
      expect(isValidMove({ ...s, currentPlayer: "O" }, move!.row, move!.col)).toBe(true);
    });

    it(`returns null when O has no valid moves (difficulty=${d})`, () => {
      const board: Board = createEmptyBoard();
      for (let r = 0; r < board.length; r++) {
        for (let c = 0; c < board[r].length; c++) {
          board[r][c] = "X";
        }
      }
      const move = chooseAiMove({
        board,
        lastMove: { X: null, O: null },
        score: { X: 0, O: 0 },
        difficulty: d,
      });
      expect(move).toBeNull();
    });
  }
});

// ---------- Behaviour: scoring opportunities ----------

describe("chooseAiMove — takes immediate scoring opportunities", () => {
  for (const d of ALL_DIFFICULTIES) {
    it(`picks the 4-in-a-row completion at (2,3) on ${d}`, () => {
      // Setup: O has three in a row at (2,0)-(2,2). (2,3) completes a
      // 4-in-a-row for +1. The AI on every difficulty should take this.
      const board = createEmptyBoard();
      board[2][0] = "O";
      board[2][1] = "O";
      board[2][2] = "O";

      // Sample multiple times since easy is partially stochastic.
      const N = d === "easy" ? 10 : 20;
      let hits = 0;
      for (let i = 0; i < N; i++) {
        const m = chooseAiMove({
          board,
          lastMove: { X: null, O: null },
          score: { X: 0, O: 0 },
          difficulty: d,
        });
        if (m && m.row === 2 && m.col === 3) hits++;
      }
      // All difficulties should pick the scoring move close to 100%
      // (easy's "always take a scoring move" branch is deterministic).
      expect(hits).toBeGreaterThanOrEqual(Math.floor(N * 0.85));
    });
  }
});

// ---------- Behaviour: blocking ----------

describe("chooseAiMove — defensive blocking", () => {
  // Setup A: X already has a 4-in-a-row at (0,0)-(0,3). Playing (0,4) extends
  // it to a 5, but per the scoring rules an extension only awards +1 (not the
  // +2 a fresh 5-in-a-row would give). Easy ignores extension threats — that's
  // its character — but medium and hard should still defend.
  function makeExtensionThreat() {
    const board = createEmptyBoard();
    board[0][0] = "X";
    board[0][1] = "X";
    board[0][2] = "X";
    board[0][3] = "X";
    return board;
  }

  // Setup B: X has a "split four" (X X . X X). Playing the gap at (0,2)
  // produces a fresh 5-in-a-row for the full +2. Even easy should block this.
  function makeSplitFiveThreat() {
    const board = createEmptyBoard();
    board[0][0] = "X";
    board[0][1] = "X";
    board[0][3] = "X";
    board[0][4] = "X";
    return board;
  }

  for (const d of ["medium", "hard"] as Difficulty[]) {
    it(`${d} blocks a +1 extension threat`, () => {
      const board = makeExtensionThreat();
      let blocks = 0;
      const N = 20;
      for (let i = 0; i < N; i++) {
        const m = chooseAiMove({
          board,
          lastMove: { X: null, O: null },
          score: { X: 0, O: 0 },
          difficulty: d,
        });
        if (m && m.row === 0 && m.col === 4) blocks++;
      }
      expect(blocks).toBeGreaterThanOrEqual(Math.floor(N * 0.8));
    });
  }

  for (const d of ALL_DIFFICULTIES) {
    it(`${d} blocks a +2 fresh 5-in-a-row threat (split-four pattern)`, () => {
      const board = makeSplitFiveThreat();
      let blocks = 0;
      const N = 20;
      for (let i = 0; i < N; i++) {
        const m = chooseAiMove({
          board,
          lastMove: { X: null, O: null },
          score: { X: 0, O: 0 },
          difficulty: d,
        });
        if (m && m.row === 0 && m.col === 2) blocks++;
      }
      // All difficulties have a deterministic branch that catches this.
      expect(blocks).toBeGreaterThanOrEqual(Math.floor(N * 0.85));
    });
  }
});

// ---------- Behaviour: variety ----------

describe("chooseAiMove — variety on identical positions", () => {
  it("hard plays at least 3 distinct opening moves on an empty board over 30 trials", () => {
    const s = createInitialState();
    const seen = new Set<string>();
    for (let i = 0; i < 30; i++) {
      const m = chooseAiMove({
        board: s.board,
        lastMove: s.lastMove,
        score: s.score,
        difficulty: "hard",
      });
      if (m) seen.add(`${m.row},${m.col}`);
    }
    // The early-game wide band should produce noticeable opening variety —
    // not always the same centre cell.
    expect(seen.size).toBeGreaterThanOrEqual(3);
  });

  it("easy is more random than medium on the same neutral position", () => {
    // Pick a quiet board where neither side has an immediate threat and
    // neither has a scoring move. Easy's "random fallback" branch fires
    // and should produce more distinct picks than medium's eval-driven one.
    const board = createEmptyBoard();
    board[0][0] = "X";
    board[4][4] = "O";

    const N = 30;
    const easySeen = new Set<string>();
    const mediumSeen = new Set<string>();
    for (let i = 0; i < N; i++) {
      const e = chooseAiMove({
        board,
        lastMove: { X: { row: 0, col: 0 }, O: { row: 4, col: 4 } },
        score: { X: 0, O: 0 },
        difficulty: "easy",
      });
      const m = chooseAiMove({
        board,
        lastMove: { X: { row: 0, col: 0 }, O: { row: 4, col: 4 } },
        score: { X: 0, O: 0 },
        difficulty: "medium",
      });
      if (e) easySeen.add(`${e.row},${e.col}`);
      if (m) mediumSeen.add(`${m.row},${m.col}`);
    }
    expect(easySeen.size).toBeGreaterThan(mediumSeen.size);
  });
});

// ---------- Behaviour: strength ordering ----------
//
// Quick head-to-head sanity check: in a small tournament of N games,
// the harder difficulty should win the score battle clearly more often
// than the easier one. Used as a regression guard against difficulty
// regressions (e.g. accidentally making "hard" worse than "medium").

import { applyMove, getWinner } from "../rules";
import type { GameState } from "../types";

function playAiVsAi(
  difficultyForX: Difficulty,
  difficultyForO: Difficulty,
): "X" | "O" | "tie" {
  let state: GameState = {
    board: createEmptyBoard(),
    currentPlayer: "X",
    gameActive: true,
    score: { X: 0, O: 0 },
    lastMove: { X: null, O: null },
    bonusTurn: false,
  };

  for (let safety = 0; safety < 200 && state.gameActive; safety++) {
    const diff = state.currentPlayer === "X" ? difficultyForX : difficultyForO;
    // chooseAiMove always returns the move for "O", so swap perspective by
    // mirroring the board: treat current player as "O" for the call by
    // swapping X<->O in the board, then swap the resulting symbol back.
    let move;
    if (state.currentPlayer === "O") {
      move = chooseAiMove({
        board: state.board,
        lastMove: state.lastMove,
        score: state.score,
        difficulty: diff,
      });
    } else {
      const swapped = state.board.map((row) =>
        row.map((c) => (c === "X" ? "O" : c === "O" ? "X" : "")),
      );
      const swappedScore = { X: state.score.O, O: state.score.X };
      const swappedLast = { X: state.lastMove.O, O: state.lastMove.X };
      move = chooseAiMove({
        board: swapped,
        lastMove: swappedLast,
        score: swappedScore,
        difficulty: diff,
      });
    }
    if (!move) break;
    const outcome = applyMove(state, move.row, move.col);
    if (!outcome.ok) break;
    state = outcome.result.state;
  }
  return getWinner(state.score);
}

describe("chooseAiMove — strength ordering (regression guard)", () => {
  it("hard beats easy more often than not over 8 games", () => {
    // Hard plays O, easy plays X. Track O wins.
    let hardWins = 0;
    let easyWins = 0;
    for (let i = 0; i < 8; i++) {
      const winner = playAiVsAi("easy", "hard");
      if (winner === "O") hardWins++;
      else if (winner === "X") easyWins++;
    }
    expect(hardWins).toBeGreaterThan(easyWins);
  }, 30_000);
});
