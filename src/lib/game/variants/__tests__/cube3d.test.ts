import { describe, expect, it } from "vitest";
import {
  CUBE_SIZE,
  Cube3D,
  chooseAiMove3D,
  evaluatePosition,
  scoreDeltaForMove,
  type Cube3DBoard,
  type Cube3DGameState,
  type Move3D,
} from "../cube3d";
import type { Cell, Player } from "../../types";

// ---------- Helpers ----------

function emptyCube(): Cube3DBoard {
  return Array.from({ length: CUBE_SIZE }, () =>
    Array.from({ length: CUBE_SIZE }, () =>
      Array.from({ length: CUBE_SIZE }, () => "" as Cell),
    ),
  );
}

function placeAll(cells: Array<[number, number, number, Player]>): Cube3DBoard {
  const b = emptyCube();
  for (const [x, y, z, p] of cells) b[z][y][x] = p;
  return b;
}

function stateWith(board: Cube3DBoard): Cube3DGameState {
  return {
    variantId: "cube3d",
    board,
    currentPlayer: "X",
    gameActive: true,
    score: { X: 0, O: 0 },
    lastMove: { X: null, O: null },
    turnNumber: 0,
  };
}

// ---------- Scoring along each direction class ----------

describe("Cube3D scoreDeltaForMove", () => {
  it("scores +1 for a fresh 4-in-a-row along the X axis", () => {
    const b = placeAll([
      [0, 0, 0, "X"],
      [1, 0, 0, "X"],
      [2, 0, 0, "X"],
      [3, 0, 0, "X"],
    ]);
    expect(scoreDeltaForMove(b, { x: 3, y: 0, z: 0 }, "X")).toBe(1);
  });

  it("scores +1 for a fresh 4-in-a-row along the Y axis", () => {
    const b = placeAll([
      [0, 0, 0, "O"],
      [0, 1, 0, "O"],
      [0, 2, 0, "O"],
      [0, 3, 0, "O"],
    ]);
    expect(scoreDeltaForMove(b, { x: 0, y: 3, z: 0 }, "O")).toBe(1);
  });

  it("scores +1 for a fresh 4-in-a-row along the Z axis (through floors)", () => {
    const b = placeAll([
      [2, 2, 0, "X"],
      [2, 2, 1, "X"],
      [2, 2, 2, "X"],
      [2, 2, 3, "X"],
    ]);
    expect(scoreDeltaForMove(b, { x: 2, y: 2, z: 3 }, "X")).toBe(1);
  });

  it("scores +1 along a face diagonal (XY plane, z fixed)", () => {
    const b = placeAll([
      [0, 0, 2, "X"],
      [1, 1, 2, "X"],
      [2, 2, 2, "X"],
      [3, 3, 2, "X"],
    ]);
    expect(scoreDeltaForMove(b, { x: 3, y: 3, z: 2 }, "X")).toBe(1);
  });

  it("scores +1 along a face diagonal (XZ plane, y fixed)", () => {
    const b = placeAll([
      [0, 1, 0, "O"],
      [1, 1, 1, "O"],
      [2, 1, 2, "O"],
      [3, 1, 3, "O"],
    ]);
    expect(scoreDeltaForMove(b, { x: 3, y: 1, z: 3 }, "O")).toBe(1);
  });

  it("scores +1 along a space diagonal (through the cube's hyper-corner)", () => {
    // (0,0,0) → (1,1,1) → (2,2,2) → (3,3,3) — a true 3D diagonal.
    const b = placeAll([
      [0, 0, 0, "X"],
      [1, 1, 1, "X"],
      [2, 2, 2, "X"],
      [3, 3, 3, "X"],
    ]);
    expect(scoreDeltaForMove(b, { x: 3, y: 3, z: 3 }, "X")).toBe(1);
  });

  it("scores +2 for a fresh 5-in-a-row built by the middle piece", () => {
    const b = placeAll([
      [0, 0, 0, "X"],
      [1, 0, 0, "X"],
      [2, 0, 0, "X"],
      [3, 0, 0, "X"],
      [4, 0, 0, "X"],
    ]);
    // (2,0,0): forward=2 ((3,0,0)(4,0,0)), backward=2 ((1,0,0)(0,0,0))
    // count=5, longestSidePre=2 → fresh 5 → +2
    expect(scoreDeltaForMove(b, { x: 2, y: 0, z: 0 }, "X")).toBe(2);
  });

  it("scores +1 (extension) when a 4 becomes a 5", () => {
    const b = placeAll([
      [0, 0, 0, "X"],
      [1, 0, 0, "X"],
      [2, 0, 0, "X"],
      [3, 0, 0, "X"],
      [4, 0, 0, "X"],
    ]);
    // (4,0,0): backward=4, forward=0 → count=5, longestSidePre=4 → +1 only
    expect(scoreDeltaForMove(b, { x: 4, y: 0, z: 0 }, "X")).toBe(1);
  });

  it("scores 0 when opponent blocks the line", () => {
    const b = placeAll([
      [0, 0, 0, "X"],
      [1, 0, 0, "X"],
      [2, 0, 0, "X"],
      [3, 0, 0, "O"],
    ]);
    expect(scoreDeltaForMove(b, { x: 2, y: 0, z: 0 }, "X")).toBe(0);
  });
});

// ---------- evaluatePosition ----------

describe("Cube3D evaluatePosition", () => {
  it("is 0 on a fully empty cube", () => {
    const b = emptyCube();
    expect(evaluatePosition(b, "X")).toBe(0);
    expect(evaluatePosition(b, "O")).toBe(0);
  });

  it("is positive for the player with open potential", () => {
    const b = placeAll([
      [0, 0, 0, "X"],
      [1, 0, 0, "X"],
      [2, 0, 0, "X"],
    ]);
    expect(evaluatePosition(b, "X")).toBeGreaterThan(0);
    expect(evaluatePosition(b, "O")).toBeLessThan(0);
  });

  it("rewards 3-in-a-row much more than 2-in-a-row", () => {
    const b2 = placeAll([
      [0, 0, 0, "X"],
      [1, 0, 0, "X"],
    ]);
    const b3 = placeAll([
      [0, 0, 0, "X"],
      [1, 0, 0, "X"],
      [2, 0, 0, "X"],
    ]);
    expect(evaluatePosition(b3, "X")).toBeGreaterThan(
      evaluatePosition(b2, "X"),
    );
  });
});

// ---------- AI ----------

describe("Cube3D chooseAiMove3D", () => {
  it("returns a valid move on a fresh cube", () => {
    const s = Cube3D.createInitialState();
    const m = chooseAiMove3D(s, "O", "medium");
    expect(m).not.toBeNull();
    expect(Cube3D.isValidMove(s, m!)).toBe(true);
  });

  it("returns null when the cube is full", () => {
    const board = emptyCube();
    for (let z = 0; z < CUBE_SIZE; z++)
      for (let y = 0; y < CUBE_SIZE; y++)
        for (let x = 0; x < CUBE_SIZE; x++) board[z][y][x] = "X";
    const s = stateWith(board);
    expect(chooseAiMove3D(s, "O", "medium")).toBeNull();
  });

  it("takes an immediate scoring opportunity on every difficulty", () => {
    const board = placeAll([
      [0, 0, 0, "O"],
      [1, 0, 0, "O"],
      [2, 0, 0, "O"],
    ]);
    const s = stateWith(board);

    for (const diff of ["easy", "medium", "hard"] as const) {
      // Sample several times — AI has tie-break noise.
      let hits = 0;
      const N = diff === "easy" ? 10 : 15;
      for (let i = 0; i < N; i++) {
        const m = chooseAiMove3D(s, "O", diff);
        if (m && m.x === 3 && m.y === 0 && m.z === 0) hits++;
      }
      expect(hits, `${diff} should usually pick (3,0,0)`).toBeGreaterThanOrEqual(
        Math.floor(N * 0.7),
      );
    }
  });

  it("hard plays a varied opening across many trials on a fresh cube", () => {
    const s = Cube3D.createInitialState();
    const seen = new Set<string>();
    for (let i = 0; i < 30; i++) {
      const m = chooseAiMove3D(s, "O", "hard");
      if (m) seen.add(`${m.x}-${m.y}-${m.z}`);
    }
    // Wide opening band means the AI shouldn't always pick the centre.
    expect(seen.size).toBeGreaterThanOrEqual(3);
  });
});

// ---------- Game flow ----------

describe("Cube3D game flow via Variant interface", () => {
  it("createInitialState yields a 5×5×5 empty cube and X to move", () => {
    const s = Cube3D.createInitialState();
    expect(s.board.length).toBe(CUBE_SIZE);
    expect(s.board[0].length).toBe(CUBE_SIZE);
    expect(s.board[0][0].length).toBe(CUBE_SIZE);
    expect(s.board.flat(2).every((c) => c === "")).toBe(true);
    expect(s.currentPlayer).toBe("X");
    expect(s.gameActive).toBe(true);
  });

  it("applyMove places the piece and switches player", () => {
    const s = Cube3D.createInitialState();
    const move: Move3D = { x: 2, y: 2, z: 2 };
    const outcome = Cube3D.applyMove(s, move);
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    expect(outcome.result.state.board[2][2][2]).toBe("X");
    expect(outcome.result.state.currentPlayer).toBe("O");
    expect(outcome.result.state.turnNumber).toBe(1);
    expect(outcome.result.pointsGained).toBe(0);
    expect(outcome.result.ended).toBe(false);
  });

  it("applyMove rejects an occupied cell", () => {
    const s = Cube3D.createInitialState();
    s.board[2][2][2] = "X";
    const outcome = Cube3D.applyMove(s, { x: 2, y: 2, z: 2 });
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) expect(outcome.error.kind).toBe("cell-occupied");
  });

  it("getValidMoves returns 125 cells on a fresh cube (no adjacency rule)", () => {
    const s = Cube3D.createInitialState();
    expect(Cube3D.getValidMoves(s, "X").length).toBe(125);
  });
});
