/**
 * Mira's "memory" — a tiny style profile per player, persisted in localStorage.
 *
 * v1 is intentionally minimal: no Mongo, no accounts, no cross-device sync.
 * Everything lives client-side under a single key. Later phases can move this
 * to a real backend without changing the public API of this module.
 */

const STORAGE_KEY = "xxxo-mira-profile-v1";

export interface MiraProfile {
  /** Display name. Defaults to null until the player sets one. */
  name: string | null;
  /** Total games finished against Mira. */
  gamesPlayed: number;
  /** Lifetime wins/losses/ties against Mira. */
  wins: number;
  losses: number;
  ties: number;
  /**
   * Frequency map of opening moves the player has played. Key is "row,col".
   * Used by adaptive AI (v3) and by personalised greetings (v1).
   */
  openingCounts: Record<string, number>;
  /** ISO date of the last completed game — for "back already?" greetings. */
  lastPlayedAt: string | null;
}

function emptyProfile(): MiraProfile {
  return {
    name: null,
    gamesPlayed: 0,
    wins: 0,
    losses: 0,
    ties: 0,
    openingCounts: {},
    lastPlayedAt: null,
  };
}

export function loadProfile(): MiraProfile {
  if (typeof window === "undefined") return emptyProfile();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyProfile();
    const parsed = JSON.parse(raw) as Partial<MiraProfile>;
    return { ...emptyProfile(), ...parsed };
  } catch {
    return emptyProfile();
  }
}

export function saveProfile(p: MiraProfile): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
  } catch {
    /* localStorage full or blocked — degrade silently */
  }
}

/** Bump game count + win/loss/tie + lastPlayedAt. Returns the new profile. */
export function recordGameFinished(
  p: MiraProfile,
  result: "win" | "loss" | "tie",
): MiraProfile {
  return {
    ...p,
    gamesPlayed: p.gamesPlayed + 1,
    wins: p.wins + (result === "win" ? 1 : 0),
    losses: p.losses + (result === "loss" ? 1 : 0),
    ties: p.ties + (result === "tie" ? 1 : 0),
    lastPlayedAt: new Date().toISOString(),
  };
}

/** Track a first-move opening choice. Returns new profile. */
export function recordOpening(
  p: MiraProfile,
  row: number,
  col: number,
): MiraProfile {
  const key = `${row},${col}`;
  return {
    ...p,
    openingCounts: {
      ...p.openingCounts,
      [key]: (p.openingCounts[key] ?? 0) + 1,
    },
  };
}

export function setProfileName(p: MiraProfile, name: string): MiraProfile {
  return { ...p, name: name.trim() || null };
}
