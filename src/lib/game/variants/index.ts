import type { Variant, VariantId, BaseGameState } from "./types";
import { Classic, type ClassicGameState } from "./classic";
import { Cube3D, type Cube3DGameState, type Move3D } from "./cube3d";
import type { Move } from "../types";

export type { VariantId, VariantMeta, BaseGameState, Variant, MoveOutcome, MoveError, MoveErrorKind, TurnAction } from "./types";
export { Classic, type ClassicGameState };
export { Cube3D, type Cube3DGameState, type Move3D };

/**
 * Lookup of all registered variants. UI and routing use this to enumerate the
 * available variants and dispatch to the right module by id.
 *
 * Casted to a flexible Variant type for the registry — concrete state/move
 * types are recovered at point of use through the specific exports above.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const VARIANTS: Record<VariantId, Variant<any, any>> = {
  classic: Classic,
  cube3d: Cube3D,
  // The remaining three are roadmap stubs — they'll point at real modules as
  // Phases 2-4 land. Until then, accessing them throws so callers fail loudly.
  gravity: undefined as never,
  fogOfWar: undefined as never,
  battleRoyale: undefined as never,
};

/** Convenience getter that asserts the variant has been implemented. */
export function getVariant(id: VariantId): Variant<BaseGameState, unknown> {
  const v = VARIANTS[id];
  if (!v) {
    throw new Error(
      `Variant "${id}" is not yet implemented. Available: ${Object.entries(VARIANTS)
        .filter(([, val]) => val !== undefined)
        .map(([k]) => k)
        .join(", ")}`,
    );
  }
  return v as Variant<BaseGameState, unknown>;
}

/** All variants that are actually wired up right now. */
export const ACTIVE_VARIANT_IDS: VariantId[] = ["classic", "cube3d"];

// Re-exports kept for backward compatibility with hooks/components that
// import these directly from the variants barrel.
export type { Move };
