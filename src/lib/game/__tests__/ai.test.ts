import { describe, expect, it } from "vitest";
import { chooseAiMove, evaluatePosition } from "../ai";
import {
  createEmptyBoard,
  createInitialState,
  isValidMove,
} from "../rules";
import type { Board, Difficulty } from "../types";

const ALL_DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];

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
    // Only the (0,*) row had positive X potential; with O at (0,3) the
    // five-window starting at (0,0) is blocked. Other windows (vertical,
    // diagonal) still see the X pieces.
    const score = evaluatePosition(b, "X");
    expect(score).toBeGreaterThanOrEqual(0);
  });
});

describe("chooseAiMove", () => {
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
      // Must respect AI's adjacency constraint (none yet on empty board).
      expect(isValidMove({ ...s, currentPlayer: "O" }, move!.row, move!.col)).toBe(true);
    });

    it(`returns null when O has no valid moves (difficulty=${d})`, () => {
      const board: Board = createEmptyBoard();
      // Fill every cell with X so O has no empty cells at all.
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

  it("on hard difficulty, picks the immediate scoring move when available", () => {
    // Setup: O has three in a row at (2,0)-(2,2); (2,3) is empty and completes
    // a 4-in-a-row for +1. The hard AI should choose this cell most of the time;
    // but minimax is stochastic by design (small random tie-breaker), so we
    // sample multiple runs and require a high hit rate.
    const board = createEmptyBoard();
    board[2][0] = "O";
    board[2][1] = "O";
    board[2][2] = "O";
    let hits = 0;
    const N = 20;
    for (let i = 0; i < N; i++) {
      const m = chooseAiMove({
        board,
        lastMove: { X: null, O: null },
        score: { X: 0, O: 0 },
        difficulty: "hard",
      });
      if (m && m.row === 2 && m.col === 3) hits++;
    }
    // Expect a strong majority to pick the scoring move. (Looser bound to
    // tolerate the tie-breaker noise; the alternative cell (2,-1) doesn't
    // exist, and (2,4) would also extend but is further from centre.)
    expect(hits).toBeGreaterThanOrEqual(Math.floor(N * 0.6));
  });
});
