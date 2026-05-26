"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  type MiraCategory,
  type MiraProfile,
  loadProfile,
  pickLine,
  preloadVoices,
  recordGameFinished,
  saveProfile,
  speak,
  getVoiceEnabled,
} from "@/lib/mira";
import type { GameState, Player } from "@/lib/game/types";

interface UseMiraOptions {
  state: GameState;
  /** Move count from the parent hook — used for cadence decisions
   *  (filler probability, first-move greeting). */
  moveCount: number;
  /** True only while Mira is the opponent (AI mode). */
  active: boolean;
  isAiThinking?: boolean;
}

export interface UseMiraResult {
  /** Current line Mira is "saying", or null when she's quiet. */
  currentLine: string | null;
  /** Persistent profile — gamesPlayed, win/loss counts, opening freq. */
  profile: MiraProfile;
  /** Toggle the voice synthesis. */
  voiceEnabled: boolean;
  setVoiceEnabled: (v: boolean) => void;
  /** Manually clear the current line (UI close button). */
  dismiss: () => void;
}

export function useMira({
  state,
  moveCount,
  active,
  isAiThinking,
}: UseMiraOptions): UseMiraResult {
  const [profile, setProfile] = useState<MiraProfile>(() => loadProfile());
  const [currentLine, setCurrentLine] = useState<string | null>(null);
  const [voiceEnabled, setVoiceEnabledState] = useState<boolean>(false);

  const prevStateRef = useRef<GameState | null>(null);
  const recentLinesRef = useRef<Set<string>>(new Set());
  const greetedRef = useRef(false);
  const finishedRef = useRef(false);

  // Hydrate the voice preference on the client (avoid SSR localStorage access).
  // Also kick off voice loading immediately so the browser's TTS engine has
  // its voice list ready by the time Mira's greeting fires ~400ms later.
  useEffect(() => {
    setVoiceEnabledState(getVoiceEnabled());
    preloadVoices();
  }, []);

  const say = useCallback(
    (category: MiraCategory) => {
      // Resolve profile via a ref pattern so we always pick from latest profile
      // even when several events fire in the same render.
      const line = pickLine(category, profile, recentLinesRef.current);
      if (!line) return;
      setCurrentLine(line);
      if (voiceEnabled) speak(line);
      // Drop the oldest entries to keep the dedupe Set bounded.
      if (recentLinesRef.current.size > 25) {
        const first = recentLinesRef.current.values().next().value;
        if (first !== undefined) recentLinesRef.current.delete(first);
      }
    },
    [profile, voiceEnabled],
  );

  // Greet on first mount in AI mode.
  useEffect(() => {
    if (!active) return;
    if (greetedRef.current) return;
    greetedRef.current = true;
    const category: MiraCategory =
      profile.gamesPlayed === 0 ? "greeting_first" : "greeting_returning";
    // Delay slightly so the page has a chance to mount visually first.
    const t = setTimeout(() => say(category), 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  // React to state transitions: scoring, game end.
  useEffect(() => {
    if (!active) return;
    const prev = prevStateRef.current;
    prevStateRef.current = state;
    if (!prev) return;

    // Game just ended.
    if (prev.gameActive && !state.gameActive && !finishedRef.current) {
      finishedRef.current = true;
      const result =
        state.score.X > state.score.O
          ? "win"
          : state.score.O > state.score.X
          ? "loss"
          : "tie";
      const winCategory: MiraCategory =
        result === "win" ? "win_player" : result === "loss" ? "win_mira" : "tie";

      // Update + persist profile *before* picking the line, so the line sees
      // the post-game numbers (game count + losses bump).
      const next = recordGameFinished(profile, result);
      setProfile(next);
      saveProfile(next);

      // Use the freshly updated profile for templating — bypass the closure
      // by calling pickLine directly with `next`.
      const line = pickLine(winCategory, next, recentLinesRef.current);
      setCurrentLine(line);
      if (voiceEnabled) speak(line);
      return;
    }

    // A move was just made — only react when the AI side or player just scored.
    if (moveCount > 0 && state.gameActive) {
      // Whoever just moved is the one whose turn it WAS one tick ago — i.e.
      // the player opposite the current player.
      const justMoved: Player = state.currentPlayer === "X" ? "O" : "X";
      const scoreGained = (state.score[justMoved] ?? 0) - (prev.score[justMoved] ?? 0);
      if (scoreGained > 0) {
        say(justMoved === "X" ? "mid_score_yours" : "mid_score_mine");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, active]);

  // Reset finished flag when a new game starts (moveCount back to 0 and
  // gameActive is true).
  useEffect(() => {
    if (state.gameActive && moveCount === 0) {
      finishedRef.current = false;
    }
  }, [state.gameActive, moveCount]);

  // Mid-game filler: occasionally make Mira mutter something while it's the
  // player's turn (NOT every move — too chatty). Probability stays low so it
  // feels organic.
  useEffect(() => {
    if (!active) return;
    if (!state.gameActive) return;
    if (isAiThinking) return;
    if (moveCount < 2 || moveCount > 18) return;
    // ~15% chance per turn to add a filler. Players don't want a wall of text.
    if (Math.random() > 0.15) return;
    say("mid_filler");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moveCount, state.gameActive, active, isAiThinking]);

  const setVoiceEnabled = useCallback((v: boolean) => {
    setVoiceEnabledState(v);
    // Persist preference.
    import("@/lib/mira/voice").then(({ setVoiceEnabled: persist }) => persist(v));
  }, []);

  const dismiss = useCallback(() => setCurrentLine(null), []);

  return {
    currentLine,
    profile,
    voiceEnabled,
    setVoiceEnabled,
    dismiss,
  };
}
