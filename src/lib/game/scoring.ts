import { BOARD_SIZE, DIRECTIONS, POINTS } from "./constants";
import type { Board, Player } from "./types";

/**
 * Computes the point delta gained by `player` from placing at (row, col)
 * on `board` (the placement must already be applied to `board`).
 *
 * Scoring rules (pinned by tests):
 * - A new 4-in-a-row scores +1.
 * - A new 5-in-a-row scores +2 — UNLESS the player already had a 4-in-a-row
 *   along that same line (i.e. they are extending a previously-scored 4 to a 5),
 *   in which case it scores only +1.
 * - A line that was already a 5-in-a-row contributes 0.
 */
export function scoreDeltaForMove(
  board: Board,
  row: number,
  col: number,
  player: Player,
): number {
  let total = 0;

  for (const { r: dr, c: dc } of DIRECTIONS) {
    let forward = 0;
    for (let i = 1; i < BOARD_SIZE; i++) {
      const nr = row + dr * i;
      const nc = col + dc * i;
      if (nr < 0 || nr >= BOARD_SIZE || nc < 0 || nc >= BOARD_SIZE) break;
      if (board[nr][nc] !== player) break;
      forward++;
    }
    let backward = 0;
    for (let i = 1; i < BOARD_SIZE; i++) {
      const nr = row - dr * i;
      const nc = col - dc * i;
      if (nr < 0 || nr >= BOARD_SIZE || nc < 0 || nc >= BOARD_SIZE) break;
      if (board[nr][nc] !== player) break;
      backward++;
    }

    const count = 1 + forward + backward;
    const longestSidePreMove = Math.max(forward, backward);

    if (count >= 5) {
      if (longestSidePreMove >= 5) {
        // Line already had a 5 — no additional points.
      } else if (longestSidePreMove === 4) {
        total += POINTS.EXTEND_FOUR_TO_FIVE;
      } else {
        total += POINTS.FIVE_IN_A_ROW;
      }
    } else if (count === 4) {
      if (longestSidePreMove >= 4) {
        // Line was already a 4 — no additional points.
      } else {
        total += POINTS.FOUR_IN_A_ROW;
      }
    }
  }

  return total;
}
