import { describe, expect, it } from "vitest";
import { ACTIVE_VARIANT_IDS, getVariant } from "..";
import type { Player } from "../../types";

/**
 * Every active variant must implement the full Variant interface coherently.
 * These tests are deliberately variant-agnostic — they call only the public
 * methods declared on the interface, so they catch regressions in any variant
 * (existing or future) when ACTIVE_VARIANT_IDS gets a new entry.
 */
describe("Variant conformance", () => {
  for (const id of ACTIVE_VARIANT_IDS) {
    describe(`variant: ${id}`, () => {
      const variant = getVariant(id);

      it("has complete meta", () => {
        const m = variant.meta;
        expect(m.id).toBe(id);
        expect(m.name.length).toBeGreaterThan(0);
        expect(m.tagline.length).toBeGreaterThan(0);
        expect(m.description.length).toBeGreaterThan(0);
        expect(m.minPlayers).toBeGreaterThanOrEqual(2);
        expect(m.maxPlayers).toBeGreaterThanOrEqual(m.minPlayers);
        // Must support at least one play mode, otherwise the variant is unreachable.
        expect(m.supportsLocal || m.supportsAi || m.supportsOnline).toBe(true);
      });

      it("createInitialState produces a fresh game", () => {
        const s = variant.createInitialState();
        expect(s.variantId).toBe(id);
        expect(s.currentPlayer).toBe("X");
        expect(s.gameActive).toBe(true);
        expect(s.turnNumber).toBe(0);
        // Score starts at zero for every active player.
        for (const p of variant.getPlayers(s)) {
          expect(s.score[p]).toBe(0);
        }
      });

      it("getValidMoves returns moves on a fresh board", () => {
        const s = variant.createInitialState();
        const moves = variant.getValidMoves(s, "X" as Player);
        expect(moves.length).toBeGreaterThan(0);
      });

      it("isValidMove agrees with getValidMoves on a fresh board", () => {
        const s = variant.createInitialState();
        const moves = variant.getValidMoves(s, "X" as Player);
        // Spot-check the first 3 moves — full enumeration is wasteful.
        for (const m of moves.slice(0, 3)) {
          expect(variant.isValidMove(s, m)).toBe(true);
        }
      });

      it("applyMove with a valid move advances state", () => {
        const s = variant.createInitialState();
        const move = variant.getValidMoves(s, "X")[0];
        const outcome = variant.applyMove(s, move);
        expect(outcome.ok).toBe(true);
        if (!outcome.ok) return;
        expect(outcome.result.state.turnNumber).toBe(1);
        // Either game ended on this move or it switched player.
        if (!outcome.result.ended) {
          expect(outcome.result.state.currentPlayer).not.toBe(s.currentPlayer);
        }
      });

      it("moveKey returns a stable string for a given move", () => {
        const s = variant.createInitialState();
        const m = variant.getValidMoves(s, "X")[0];
        const k1 = variant.moveKey(m);
        const k2 = variant.moveKey(m);
        expect(k1).toBe(k2);
        expect(typeof k1).toBe("string");
        expect(k1.length).toBeGreaterThan(0);
      });

      it("hasPotentialPoints is true on a fresh board", () => {
        const s = variant.createInitialState();
        expect(variant.hasPotentialPoints(s)).toBe(true);
      });

      it("evaluatePosition is 0 on a fresh board for both players", () => {
        const s = variant.createInitialState();
        expect(variant.evaluatePosition(s, "X")).toBe(0);
        expect(variant.evaluatePosition(s, "O")).toBe(0);
      });

      it("AI returns a valid move on a fresh board (if AI is supported)", () => {
        if (!variant.meta.supportsAi) return;
        const s = variant.createInitialState();
        // AI plays as O — this is the convention everywhere in the codebase.
        // But to be safe, try the active second player.
        const players = variant.getPlayers(s);
        const aiPlayer = players[1] ?? "O";
        const move = variant.chooseAiMove(s, aiPlayer, "medium");
        expect(move).not.toBeNull();
        if (move) {
          expect(variant.isValidMove(s, move)).toBe(true);
        }
      });
    });
  }
});
