import type { Difficulty, Player } from "../types";

/** Every variant in the Multiverse is identified by one of these. */
export type VariantId =
  | "classic"
  | "cube3d"
  | "gravity"
  | "fogOfWar"
  | "battleRoyale";

/** Static metadata about a variant — what it is, who can play, what modes. */
export interface VariantMeta {
  id: VariantId;
  /** Display name (English) */
  name: string;
  /** One-line description shown on the variant picker card */
  tagline: string;
  /** Longer marketing copy for detail / info screens */
  description: string;
  minPlayers: number;
  maxPlayers: number;
  supportsLocal: boolean;
  supportsAi: boolean;
  supportsOnline: boolean;
}

/**
 * Required fields on EVERY variant's game state. UI components and hooks
 * rely on these, so individual variants must always include them — but they
 * are free to add extra fields (board shape, lastMove tracking, fog state).
 */
export interface BaseGameState {
  variantId: VariantId;
  currentPlayer: Player;
  gameActive: boolean;
  /**
   * Score per player symbol. Two-player variants use { X, O }; Battle Royale
   * uses additional symbols. Indexed by player symbol string so the same
   * shape works across variants.
   */
  score: Record<string, number>;
  /** Total moves played so far. Used for display ("Move #7") and for early-game
   *  AI heuristics (opening variety bands). */
  turnNumber: number;
}

/** Reasons a move can be rejected. Variants extend this with their own kinds. */
export type MoveErrorKind =
  | "cell-occupied"
  | "adjacent-to-last-move"
  | "game-over"
  | "out-of-bounds"
  | "not-your-turn"
  | "column-full"
  | "invalid";

export interface MoveError {
  kind: MoveErrorKind;
}

export interface MoveResult<TState> {
  state: TState;
  pointsGained: number;
  ended: boolean;
}

export type MoveOutcome<TState> =
  | { ok: true; result: MoveResult<TState> }
  | { ok: false; error: MoveError };

/** Result of evaluating the start of a turn. */
export type TurnAction =
  | { kind: "ok" }
  | { kind: "bonus"; player: Player }
  | { kind: "end" };

/**
 * The contract every variant fulfils. Generic over `TState` (variant-specific
 * state shape) and `TMove` (variant-specific move shape — Move = {row,col} for
 * Classic, Move3D = {x,y,z} for Cube, ColumnMove = {col} for Gravity, etc.).
 *
 * UI and hooks consume variants through this interface without knowing the
 * concrete state/move types.
 */
export interface Variant<TState extends BaseGameState, TMove> {
  meta: VariantMeta;

  /** Build a fresh game state. Optional `players` for Battle Royale. */
  createInitialState(players?: Player[]): TState;

  /** True if the move is legal in the current state. */
  isValidMove(state: TState, move: TMove): boolean;

  /** All legal moves for `player` in this state. Used by AI. */
  getValidMoves(state: TState, player: Player): TMove[];

  /** Apply a move and return the next state, or an error. Pure. */
  applyMove(state: TState, move: TMove): MoveOutcome<TState>;

  /** True if any side can still score points. End-of-game detector. */
  hasPotentialPoints(state: TState): boolean;

  /** What happens at the start of the current player's turn:
   *  ok → play normally, bonus → other player gets one more turn, end → game over. */
  resolveTurnStart(state: TState): TurnAction;

  /** Static eval of `state` from `player`'s perspective. Used by AI. */
  evaluatePosition(state: TState, player: Player): number;

  /** Point delta gained by `player` from making this move. Used by AI lookahead. */
  scoreDeltaForMove(state: TState, move: TMove, player: Player): number;

  /** Pick a move for `player` (AI only). Returns null if no valid moves. */
  chooseAiMove(state: TState, player: Player, difficulty: Difficulty): TMove | null;

  /** Stable React key for a move/cell. */
  moveKey(move: TMove): string;

  /** Player symbols active in this game. Two-player variants return ["X", "O"];
   *  Battle Royale returns one per slot. */
  getPlayers(state: TState): Player[];

  /**
   * Fog-of-war variants override this to filter the state to what `viewer` can
   * legitimately see. Default (omitted) means identity — full visibility.
   * Server MUST call this before broadcasting state to a player.
   */
  visibleStateFor?(state: TState, viewer: Player): TState;
}
