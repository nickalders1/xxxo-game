"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Trophy } from "lucide-react";

import { AppShell } from "@/components/layout/AppShell";
import { TopBar } from "@/components/layout/TopBar";
import { BoardRenderer } from "@/components/game/BoardRenderer";
import { ScoreCard } from "@/components/game/ScoreCard";
import { GameStatus } from "@/components/game/GameStatus";
import { GameControls } from "@/components/game/GameControls";
import { DifficultySelector } from "@/components/game/DifficultySelector";

import { useLocalGame } from "@/hooks/useLocalGame";
import { useAIGame } from "@/hooks/useAIGame";
import { ACTIVE_VARIANT_IDS, getVariant } from "@/lib/game/variants";
import type { BaseGameState, Variant, VariantId } from "@/lib/game/variants/types";
import type { Difficulty, Player } from "@/lib/game/types";

type Mode = "local" | "ai";

interface SessionStats {
  X: number;
  O: number;
  ties: number;
}

function GameContent() {
  const searchParams = useSearchParams();

  const variantId = useMemo<VariantId>(() => {
    const v = searchParams?.get("variant") as VariantId | null;
    return v && ACTIVE_VARIANT_IDS.includes(v) ? v : "classic";
  }, [searchParams]);

  const mode: Mode = useMemo(() => {
    return searchParams?.get("mode") === "ai" ? "ai" : "local";
  }, [searchParams]);

  const variant = useMemo(() => getVariant(variantId), [variantId]);

  return mode === "ai"
    ? <AIGameView variant={variant} />
    : <LocalGameView variant={variant} />;
}

function LocalGameView<TState extends BaseGameState, TMove>({
  variant,
}: {
  variant: Variant<TState, TMove>;
}) {
  const game = useLocalGame(variant);
  return (
    <GameLayout
      variant={variant}
      mode="local"
      state={game.state}
      winner={game.winner}
      moveCount={game.moveCount}
      lastErrorKind={game.lastError?.kind}
      onMove={game.makeMove}
      onReset={game.reset}
    />
  );
}

function AIGameView<TState extends BaseGameState, TMove>({
  variant,
}: {
  variant: Variant<TState, TMove>;
}) {
  const game = useAIGame(variant, "medium");
  return (
    <GameLayout
      variant={variant}
      mode="ai"
      state={game.state}
      winner={game.winner}
      moveCount={game.moveCount}
      lastErrorKind={game.lastError?.kind}
      onMove={game.makeMove}
      onReset={game.reset}
      difficulty={game.difficulty}
      onDifficultyChange={game.setDifficulty}
      isAiThinking={game.isAiThinking}
      lockBoardForAi={!game.canMove}
    />
  );
}

interface GameLayoutProps<TState extends BaseGameState, TMove> {
  variant: Variant<TState, TMove>;
  mode: Mode;
  state: TState;
  winner: Player | "tie" | null;
  moveCount: number;
  lastErrorKind?: string;
  onMove: (move: TMove) => void;
  onReset: () => void;
  difficulty?: Difficulty;
  onDifficultyChange?: (d: Difficulty) => void;
  isAiThinking?: boolean;
  lockBoardForAi?: boolean;
}

function GameLayout<TState extends BaseGameState, TMove>({
  variant,
  mode,
  state,
  winner,
  moveCount,
  lastErrorKind,
  onMove,
  onReset,
  difficulty,
  onDifficultyChange,
  isAiThinking,
  lockBoardForAi,
}: GameLayoutProps<TState, TMove>) {
  const [stats, setStats] = useState<SessionStats>({ X: 0, O: 0, ties: 0 });
  const [countedFor, setCountedFor] = useState<string | null>(null);

  // Bump the session counter exactly once per finished game.
  useEffect(() => {
    if (!winner) {
      if (state.gameActive && countedFor) setCountedFor(null);
      return;
    }
    const key = `${variant.meta.id}-${winner}-${moveCount}-${state.score.X ?? 0}-${state.score.O ?? 0}`;
    if (countedFor === key) return;
    setStats((s) => ({
      X: s.X + (winner === "X" ? 1 : 0),
      O: s.O + (winner === "O" ? 1 : 0),
      ties: s.ties + (winner === "tie" ? 1 : 0),
    }));
    setCountedFor(key);
  }, [winner, moveCount, state.score, state.gameActive, countedFor, variant.meta.id]);

  // Reset session stats when the variant changes — they're per-variant.
  useEffect(() => {
    setStats({ X: 0, O: 0, ties: 0 });
    setCountedFor(null);
  }, [variant.meta.id]);

  const handleReset = () => {
    onReset();
    setCountedFor(null);
  };

  const labelX = mode === "ai" ? "You" : "Player X";
  const labelO = mode === "ai" ? "AI" : "Player O";

  const statusMessage = useMemo(() => {
    if (winner) {
      if (winner === "tie") return "Tie!";
      if (mode === "ai") return winner === "X" ? "You win!" : "AI wins!";
      return `Player ${winner} wins!`;
    }
    // bonusTurn is Classic-only; safe optional access through a type assertion.
    const bonusTurn = (state as unknown as { bonusTurn?: boolean }).bonusTurn;
    if (bonusTurn) {
      const who = mode === "ai" && state.currentPlayer === "O" ? "AI" : `Player ${state.currentPlayer}`;
      return `${who} gets a bonus turn!`;
    }
    if (isAiThinking) return "AI is thinking…";
    if (lastErrorKind === "adjacent-to-last-move") {
      return "You can't place next to your own last move.";
    }
    if (lastErrorKind === "cell-occupied") {
      return "That cell is already taken.";
    }
    if (mode === "ai") {
      return state.currentPlayer === "X" ? "Your turn (X)" : "AI's turn";
    }
    return `Player ${state.currentPlayer}'s turn`;
  }, [winner, state, isAiThinking, lastErrorKind, mode]);

  const subtitle = (
    <span className="inline-flex items-center gap-2">
      <span>{variant.meta.name}</span>
      <span className="text-border">•</span>
      <span>{mode === "ai" ? "vs AI" : "Local"}</span>
      <span className="text-border">•</span>
      <span>Move #{moveCount}</span>
    </span>
  );

  // Classic-only score shape narrows safely; for other variants the score is
  // Record<string, number> and X/O entries default to 0 if absent.
  const score = {
    X: state.score.X ?? 0,
    O: state.score.O ?? 0,
  };

  return (
    <AppShell>
      <TopBar
        title="XXXo"
        subtitle={subtitle}
        right={
          mode === "ai" && difficulty && onDifficultyChange ? (
            <DifficultySelector
              value={difficulty}
              onChange={onDifficultyChange}
              disabled={!state.gameActive || Boolean(isAiThinking)}
            />
          ) : null
        }
      />

      <div className="grid lg:grid-cols-[1fr_18rem] gap-6 lg:gap-8 items-start">
        <div className="space-y-4">
          <GameStatus message={statusMessage} winner={winner} />
          <BoardRenderer
            variant={variant}
            state={state}
            locked={Boolean(lockBoardForAi) || Boolean(isAiThinking)}
            onMove={onMove}
          />
        </div>

        <aside className="space-y-4">
          <ScoreCard
            score={score}
            currentPlayer={state.currentPlayer}
            gameActive={state.gameActive}
            labelX={labelX}
            labelO={labelO}
          />

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Trophy className="h-4 w-4 text-muted-foreground" />
                Session
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <StatRow label={mode === "ai" ? "You won" : "X won"} value={stats.X} />
              <StatRow label={mode === "ai" ? "AI won" : "O won"} value={stats.O} />
              <StatRow label="Ties" value={stats.ties} />
            </CardContent>
          </Card>

          <GameControls onReset={handleReset} />

          <div className="grid grid-cols-2 gap-2">
            <Link href="/rules">
              <Button variant="outline" size="default" className="w-full">
                Rules
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" size="default" className="w-full">
                Home
              </Button>
            </Link>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}

function StatRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold tabular">{value}</span>
    </div>
  );
}

export default function GamePage() {
  return (
    <Suspense
      fallback={
        <AppShell>
          <div className="text-center py-16 text-muted-foreground">Loading…</div>
        </AppShell>
      }
    >
      <GameContent />
    </Suspense>
  );
}
