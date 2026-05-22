import type { Difficulty } from "./types";

export const BOARD_SIZE = 5;

export const ADJACENCY_RADIUS = 1;

export const POINTS = {
  FOUR_IN_A_ROW: 1,
  FIVE_IN_A_ROW: 2,
  EXTEND_FOUR_TO_FIVE: 1,
} as const;

export const DIRECTIONS: readonly { r: number; c: number }[] = [
  { r: 0, c: 1 },
  { r: 1, c: 0 },
  { r: 1, c: 1 },
  { r: 1, c: -1 },
] as const;

export const MINIMAX_DEPTH_HARD = 2;

export const AI_THINK_DELAY_MS: Record<Difficulty, () => number> = {
  easy: () => 400,
  medium: () => 800,
  hard: () => 900 + Math.floor(Math.random() * 400),
};
