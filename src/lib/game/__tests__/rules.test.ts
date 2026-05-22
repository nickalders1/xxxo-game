import { describe, expect, it } from "vitest";
import {
  applyMove,
  createInitialState,
  getValidMoves,
  hasAnyValidMove,
  isAdjacentToLastMove,
  isValidMove,
  otherPlayer,
  resolveTurnStart,
} from "../rules";
import { BOARD_SIZE } from "../constants";
import type { GameState } from "../types";

function withLastMove(
  base: GameState,
  who: "X" | "O",
  row: number,
  col: number,
): GameState {
  return {
    ...base,
    lastMove: { ...base.lastMove, [who]: { row, col } },
  };
}

describe("createInitialState", () => {
  it("creates an empty 5x5 board, X to move, no scores, game active", () => {
    const s = createInitialState();
    expect(s.board.length).toBe(BOARD_SIZE);
    expect(s.board[0].length).toBe(BOARD_SIZE);
    expect(s.board.flat().every((c) => c === "")).toBe(true);
    expect(s.currentPlayer).toBe("X");
    expect(s.score).toEqual({ X: 0, O: 0 });
    expect(s.lastMove).toEqual({ X: null, O: null });
    expect(s.gameActive).toBe(true);
    expect(s.bonusTurn).toBe(false);
  });
});

describe("otherPlayer", () => {
  it("flips X to O and back", () => {
    expect(otherPlayer("X")).toBe("O");
    expect(otherPlayer("O")).toBe("X");
  });
});

describe("isAdjacentToLastMove", () => {
  it("returns false when the player has no recorded last move", () => {
    const s = createInitialState();
    expect(isAdjacentToLastMove(0, 0, s.lastMove, "X")).toBe(false);
  });

  it("returns true for all 8 cells immediately around the last move", () => {
    const s = withLastMove(createInitialState(), "X", 2, 2);
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        expect(isAdjacentToLastMove(2 + dr, 2 + dc, s.lastMove, "X")).toBe(true);
      }
    }
  });

  it("returns false for cells two or more away (e.g. knight-move distance)", () => {
    const s = withLastMove(createInitialState(), "X", 2, 2);
    expect(isAdjacentToLastMove(0, 2, s.lastMove, "X")).toBe(false);
    expect(isAdjacentToLastMove(2, 0, s.lastMove, "X")).toBe(false);
    expect(isAdjacentToLastMove(4, 4, s.lastMove, "X")).toBe(false);
  });

  it("only applies the constraint to the same player", () => {
    const s = withLastMove(createInitialState(), "X", 2, 2);
    // O has no last move, so O can play next to X's last move.
    expect(isAdjacentToLastMove(2, 3, s.lastMove, "O")).toBe(false);
  });
});

describe("isValidMove", () => {
  it("rejects moves outside the board", () => {
    const s = createInitialState();
    expect(isValidMove(s, -1, 0)).toBe(false);
    expect(isValidMove(s, 0, BOARD_SIZE)).toBe(false);
  });

  it("rejects moves to non-empty cells", () => {
    const s = createInitialState();
    s.board[2][2] = "X";
    expect(isValidMove(s, 2, 2)).toBe(false);
  });

  it("rejects moves adjacent to current player's last move", () => {
    const base = withLastMove(createInitialState(), "X", 2, 2);
    expect(isValidMove(base, 2, 3)).toBe(false);
    expect(isValidMove(base, 3, 3)).toBe(false);
  });

  it("rejects all moves once gameActive is false", () => {
    const s = { ...createInitialState(), gameActive: false };
    expect(isValidMove(s, 0, 0)).toBe(false);
  });
});

describe("getValidMoves", () => {
  it("returns all 25 cells on a fresh board with no last move", () => {
    const s = createInitialState();
    expect(getValidMoves(s.board, "X", s.lastMove).length).toBe(25);
  });

  it("excludes the 8 cells adjacent to the player's own last move", () => {
    const s = withLastMove(createInitialState(), "X", 2, 2);
    // Mark X's last position as occupied too, so the count check is exact.
    s.board[2][2] = "X";
    // 25 total - 1 (occupied) - 8 (adjacent) = 16
    expect(getValidMoves(s.board, "X", s.lastMove).length).toBe(16);
  });
});

describe("hasAnyValidMove", () => {
  it("is true on an empty board", () => {
    const s = createInitialState();
    expect(hasAnyValidMove(s.board, "X", s.lastMove)).toBe(true);
  });

  it("is false when every empty cell is adjacent to the player's last move", () => {
    const s = createInitialState();
    // Fill all cells except a 3x3 ring around (2,2); then put X's last move at
    // (2,2). All remaining empty cells are within radius 1.
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (Math.abs(r - 2) > 1 || Math.abs(c - 2) > 1) {
          s.board[r][c] = "O";
        }
      }
    }
    s.board[2][2] = "X";
    s.lastMove.X = { row: 2, col: 2 };
    expect(hasAnyValidMove(s.board, "X", s.lastMove)).toBe(false);
  });
});

describe("applyMove", () => {
  it("rejects a move when the cell is occupied", () => {
    const s = createInitialState();
    s.board[0][0] = "X";
    const out = applyMove(s, 0, 0);
    expect(out.ok).toBe(false);
    if (!out.ok) expect(out.error.kind).toBe("cell-occupied");
  });

  it("rejects a move adjacent to current player's last move", () => {
    const s = withLastMove(createInitialState(), "X", 1, 1);
    s.board[1][1] = "X";
    const out = applyMove(s, 1, 2);
    expect(out.ok).toBe(false);
    if (!out.ok) expect(out.error.kind).toBe("adjacent-to-last-move");
  });

  it("rejects any move when the game is over", () => {
    const s = { ...createInitialState(), gameActive: false };
    const out = applyMove(s, 0, 0);
    expect(out.ok).toBe(false);
    if (!out.ok) expect(out.error.kind).toBe("game-over");
  });

  it("places the piece, advances player, records lastMove for an ordinary move", () => {
    const s = createInitialState();
    const out = applyMove(s, 2, 2);
    expect(out.ok).toBe(true);
    if (!out.ok) return;
    expect(out.result.state.board[2][2]).toBe("X");
    expect(out.result.state.currentPlayer).toBe("O");
    expect(out.result.state.lastMove.X).toEqual({ row: 2, col: 2 });
    expect(out.result.state.score).toEqual({ X: 0, O: 0 });
    expect(out.result.pointsGained).toBe(0);
    expect(out.result.ended).toBe(false);
  });

  it("awards points to the moving player when the move completes a 4-in-a-row", () => {
    const s = createInitialState();
    s.board[0][0] = "X";
    s.board[0][1] = "X";
    s.board[0][2] = "X";
    // X to play (0,3) — but X has no recorded lastMove yet in this synthetic
    // setup, so adjacency rule doesn't fire.
    const out = applyMove(s, 0, 3);
    expect(out.ok).toBe(true);
    if (!out.ok) return;
    expect(out.result.pointsGained).toBe(1);
    expect(out.result.state.score.X).toBe(1);
  });

  it("ends the game and clears bonusTurn after the bonus move is played", () => {
    const s: GameState = { ...createInitialState(), bonusTurn: true, currentPlayer: "O" };
    const out = applyMove(s, 0, 0);
    expect(out.ok).toBe(true);
    if (!out.ok) return;
    expect(out.result.ended).toBe(true);
    expect(out.result.state.gameActive).toBe(false);
    expect(out.result.state.bonusTurn).toBe(false);
  });
});

describe("resolveTurnStart", () => {
  it("returns ok on a fresh board", () => {
    const s = createInitialState();
    expect(resolveTurnStart(s).kind).toBe("ok");
  });

  it("returns end when there are no more potential points and no moves", () => {
    const s = createInitialState();
    // Fill the entire board with alternating X/O so no 4-or-5 line is ever
    // completable for either player.
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        s.board[r][c] = (r + c) % 2 === 0 ? "X" : "O";
      }
    }
    expect(resolveTurnStart(s).kind).toBe("end");
  });
});
