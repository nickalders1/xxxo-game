export type Player = "X" | "O";

export type Cell = Player | "";

export type Board = Cell[][];

export interface Move {
  row: number;
  col: number;
}

export interface LastMoves {
  X: Move | null;
  O: Move | null;
}

export interface Score {
  X: number;
  O: number;
}

export interface GameState {
  board: Board;
  currentPlayer: Player;
  gameActive: boolean;
  score: Score;
  lastMove: LastMoves;
  bonusTurn: boolean;
}

export type Difficulty = "easy" | "medium" | "hard";

export type GameMode = "local" | "ai";

export type TurnAction =
  | { kind: "ok" }
  | { kind: "bonus"; player: Player }
  | { kind: "end" };

export interface MoveResult {
  state: GameState;
  pointsGained: number;
  ended: boolean;
}

export type MoveError =
  | { kind: "cell-occupied" }
  | { kind: "adjacent-to-last-move" }
  | { kind: "game-over" };

export type MoveOutcome =
  | { ok: true; result: MoveResult }
  | { ok: false; error: MoveError };
