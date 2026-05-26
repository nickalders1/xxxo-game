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
import { Board } from "@/components/game/Board";
import { ScoreCard } from "@/components/game/ScoreCard";
import { GameStatus } from "@/components/game/GameStatus";
import { GameControls } from "@/components/game/GameControls";
import { DifficultySelector } from "@/components/game/DifficultySelector";
import { LastMoveLegend } from "@/components/game/LastMoveLegend";

import { useLocalGame } from "@/hooks/useLocalGame";
import { useAIGame } from "@/hooks/useAIGame";
import { useMira } from "@/hooks/useMira";
import { MiraOverlay } from "@/components/mira/MiraOverlay";
import type { GameMode, Player } from "@/lib/game/types";

interface SessionStats {
  X: number;
  O: number;
  ties: number;
}

function GameContent() {
  const searchParams = useSearchParams();
  const mode: GameMode = useMemo(() => {
    return searchParams?.get("mode") === "ai" ? "ai" : "local";
  }, [searchParams]);

  // Conditionally use either the AI hook or the local-only hook. We render
  // exactly one of two top-level components so React sees a stable hook order.
  return mode === "ai" ? <AIGameView /> : <LocalGameView />;
}

function LocalGameView() {
  const game = useLocalGame();
  return (
    <GameLayout
      mode="local"
      state={game.state}
      winner={game.winner}
      moveCount={game.moveCount}
      lastErrorKind={game.lastError?.kind}
      // Pass the hook's stable useCallback directly so memo'd Cells don't
      // re-render every time something unrelated changes upstream.
      onMove={game.makeMove}
      onReset={game.reset}
    />
  );
}

function AIGameView() {
  const game = useAIGame("medium");
  return (
    <GameLayout
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

interface GameLayoutProps {
  mode: GameMode;
  state: ReturnType<typeof useLocalGame>["state"];
  winner: Player | "tie" | null;
  moveCount: number;
  lastErrorKind?: string;
  onMove: (row: number, col: number) => void;
  onReset: () => void;
  // AI-only:
  difficulty?: ReturnType<typeof useAIGame>["difficulty"];
  onDifficultyChange?: (d: ReturnType<typeof useAIGame>["difficulty"]) => void;
  isAiThinking?: boolean;
  lockBoardForAi?: boolean;
}

function GameLayout({
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
}: GameLayoutProps) {
  const [stats, setStats] = useState<SessionStats>({ X: 0, O: 0, ties: 0 });

  // When the game finishes (winner becomes non-null), bump the corresponding
  // session-stat counter exactly once per finished game.
  const [countedFor, setCountedFor] = useState<string | null>(null);
  useEffect(() => {
    if (!winner) {
      // Reset the "counted" marker once a new game starts.
      if (state.gameActive && countedFor) setCountedFor(null);
      return;
    }
    const key = `${winner}-${moveCount}-${state.score.X}-${state.score.O}`;
    if (countedFor === key) return;
    setStats((s) => ({
      X: s.X + (winner === "X" ? 1 : 0),
      O: s.O + (winner === "O" ? 1 : 0),
      ties: s.ties + (winner === "tie" ? 1 : 0),
    }));
    setCountedFor(key);
  }, [winner, moveCount, state.score.X, state.score.O, state.gameActive, countedFor]);

  const handleReset = () => {
    onReset();
    setCountedFor(null);
  };

  const labelX = mode === "ai" ? "You" : "Player X";
  const labelO = mode === "ai" ? "Mira" : "Player O";

  // Mira: only active in AI mode. The hook is safe to call unconditionally —
  // it just stays silent when `active` is false.
  const mira = useMira({
    state,
    moveCount,
    active: mode === "ai",
    isAiThinking,
  });

  const statusMessage = useMemo(() => {
    if (winner) {
      if (winner === "tie") return "Tie!";
      if (mode === "ai") return winner === "X" ? "You win!" : "Mira wins!";
      return `Player ${winner} wins!`;
    }
    if (state.bonusTurn) {
      const who = mode === "ai" && state.currentPlayer === "O" ? "Mira" : `Player ${state.currentPlayer}`;
      return `${who} gets a bonus turn!`;
    }
    if (isAiThinking) return "Mira is thinking…";
    if (lastErrorKind === "adjacent-to-last-move") {
      return "You can't place next to your own last move.";
    }
    if (lastErrorKind === "cell-occupied") {
      return "That cell is already taken.";
    }
    if (mode === "ai") {
      return state.currentPlayer === "X" ? "Your turn (X)" : "Mira's turn";
    }
    return `Player ${state.currentPlayer}'s turn`;
  }, [winner, state.bonusTurn, state.currentPlayer, isAiThinking, lastErrorKind, mode]);

  const subtitle = (
    <span className="inline-flex items-center gap-2">
      <span>{mode === "ai" ? "vs Mira" : "Local game"}</span>
      <span className="text-border">•</span>
      <span>Move #{moveCount}</span>
    </span>
  );

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
        {/* Board column */}
        <div className="space-y-4">
          <GameStatus message={statusMessage} winner={winner} />
          <Board
            board={state.board}
            lastMove={state.lastMove}
            currentPlayer={state.currentPlayer}
            gameActive={state.gameActive}
            locked={Boolean(lockBoardForAi) || Boolean(isAiThinking)}
            onMove={onMove}
          />
          <LastMoveLegend />
          {mode === "ai" && (
            <MiraOverlay
              line={mira.currentLine}
              voiceEnabled={mira.voiceEnabled}
              onToggleVoice={mira.setVoiceEnabled}
              onDismiss={mira.dismiss}
            />
          )}
        </div>

        {/* Sidebar column */}
        <aside className="space-y-4">
          <ScoreCard
            score={state.score}
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
              <StatRow label={mode === "ai" ? "Mira won" : "O won"} value={stats.O} />
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
