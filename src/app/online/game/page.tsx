"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import type { Socket } from "socket.io-client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AppShell } from "@/components/layout/AppShell";
import { TopBar } from "@/components/layout/TopBar";
import { Board } from "@/components/game/Board";
import { ScoreCard } from "@/components/game/ScoreCard";
import { GameStatus } from "@/components/game/GameStatus";
import { LastMoveLegend } from "@/components/game/LastMoveLegend";
import { PlayerBadge } from "@/components/game/PlayerBadge";

import SocketManager from "@/lib/socket";
import type { Player } from "@/lib/game/types";
import { Clock, Home, Users, Wifi, WifiOff } from "lucide-react";

interface OnlinePlayer {
  id: string;
  name: string;
  symbol: Player;
}

interface OnlineGameState {
  board: ("X" | "O" | "")[][];
  currentPlayer: Player;
  gameActive: boolean;
  score: { X: number; O: number };
  lastMove: {
    X: { row: number; col: number } | null;
    O: { row: number; col: number } | null;
  };
  bonusTurn: boolean;
}

interface OnlineGameData {
  id: string;
  players: { X: OnlinePlayer | null; O: OnlinePlayer | null };
  gameState: OnlineGameState;
  status: "waiting" | "active" | "finished";
  winner: Player | "tie" | null;
}

function OnlineGameContent() {
  const searchParams = useSearchParams();
  const gameId = useMemo(() => searchParams?.get("id") ?? null, [searchParams]);
  const playerNameParam = useMemo(
    () => searchParams?.get("name") ?? null,
    [searchParams],
  );

  const [socket, setSocket] = useState<Socket | null>(null);
  const [game, setGame] = useState<OnlineGameData | null>(null);
  const [connected, setConnected] = useState(false);
  const [mySymbol, setMySymbol] = useState<Player | null>(null);
  const [statusMessage, setStatusMessage] = useState("Verbinden…");
  const [winnerMessage, setWinnerMessage] = useState<string | null>(null);
  const [gameTime, setGameTime] = useState(0);
  const [resolvedName, setResolvedName] = useState("");

  useEffect(() => {
    if (gameId === null || playerNameParam === null) return;

    let name: string | null = playerNameParam;
    if (typeof window !== "undefined" && (!name || name.trim() === "")) {
      name = window.localStorage.getItem("playerName");
    }
    setResolvedName(name ?? "Onbekend");

    if (!gameId || !name) {
      setStatusMessage("Ongeldige game — terug naar lobby…");
      setTimeout(() => (window.location.href = "/online"), 1500);
      return;
    }

    const manager = SocketManager.getInstance();
    const s = manager.connect();
    setSocket(s);

    const onConnect = () => {
      setConnected(true);
      s.emit("join-game", { gameId, playerName: name });
    };
    const onDisconnect = () => {
      setConnected(false);
      setStatusMessage("Verbinding verbroken");
    };
    const onGameJoined = ({
      game,
      yourSymbol,
    }: {
      game: OnlineGameData;
      yourSymbol: Player;
    }) => {
      setGame(game);
      setMySymbol(yourSymbol);
    };
    const onGameUpdated = ({ game }: { game: OnlineGameData }) => {
      setGame(game);
    };
    const onGameEnded = ({
      game,
      winner,
    }: {
      game: OnlineGameData;
      winner: Player | "tie";
    }) => {
      setGame(game);
      if (winner === "tie") {
        setWinnerMessage("Gelijkspel!");
      } else {
        const w = game.players[winner];
        setWinnerMessage(`${w?.name ?? `Speler ${winner}`} wint!`);
      }
    };
    const onPlayerDisconnected = ({ playerName }: { playerName: string }) => {
      setStatusMessage(`${playerName} heeft het spel verlaten`);
    };
    const onError = ({ message }: { message: string }) => {
      setStatusMessage(`Fout: ${message}`);
    };

    s.on("connect", onConnect);
    s.on("disconnect", onDisconnect);
    s.on("game-joined", onGameJoined);
    s.on("game-updated", onGameUpdated);
    s.on("game-ended", onGameEnded);
    s.on("player-disconnected", onPlayerDisconnected);
    s.on("error", onError);

    const timer = setInterval(() => setGameTime((t) => t + 1), 1000);

    return () => {
      clearInterval(timer);
      s.off("connect", onConnect);
      s.off("disconnect", onDisconnect);
      s.off("game-joined", onGameJoined);
      s.off("game-updated", onGameUpdated);
      s.off("game-ended", onGameEnded);
      s.off("player-disconnected", onPlayerDisconnected);
      s.off("error", onError);
      manager.disconnect();
    };
  }, [gameId, playerNameParam]);

  // Derive a status message from game state (without bonus/winner cases — those
  // are handled separately via setWinnerMessage / explicit messages).
  useEffect(() => {
    if (!game || winnerMessage) return;
    if (game.status === "waiting") {
      setStatusMessage("Wachten op tegenstander…");
      return;
    }
    if (game.status === "finished") return;
    if (game.gameState.bonusTurn) {
      const who = game.players[game.gameState.currentPlayer];
      setStatusMessage(`${who?.name ?? "Speler"} krijgt een bonus beurt!`);
      return;
    }
    const current = game.players[game.gameState.currentPlayer];
    if (current?.symbol === mySymbol) {
      setStatusMessage("Jouw beurt!");
    } else {
      setStatusMessage(`${current?.name ?? "Tegenstander"} is aan de beurt`);
    }
  }, [game, mySymbol, winnerMessage]);

  const makeMove = (row: number, col: number) => {
    if (!socket || !game || !game.gameState.gameActive) return;
    const current = game.players[game.gameState.currentPlayer];
    if (current?.symbol !== mySymbol) return;
    socket.emit("make-move", { gameId, row, col });
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${m.toString().padStart(2, "0")}:${r.toString().padStart(2, "0")}`;
  };

  // Loading state (still waiting for first game-joined event)
  if (!game) {
    return (
      <AppShell>
        <Card className="max-w-md mx-auto mt-12">
          <CardContent className="p-6 text-center space-y-4">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="font-semibold">{statusMessage}</p>
            <p className="text-xs text-muted-foreground">
              Game ID: <span className="tabular">{gameId}</span>
              <br />
              Speler: {resolvedName}
            </p>
            <Link href="/online">
              <Button variant="outline" className="w-full">
                Terug naar lobby
              </Button>
            </Link>
          </CardContent>
        </Card>
      </AppShell>
    );
  }

  const winner = game.winner;
  const isLocked =
    !game.gameState.gameActive ||
    !connected ||
    game.players[game.gameState.currentPlayer]?.symbol !== mySymbol;

  return (
    <AppShell>
      <TopBar
        title="Online match"
        backHref="/online"
        backLabel="Lobby"
        subtitle={
          <span className="inline-flex items-center gap-2">
            {connected ? (
              <Wifi className="h-3.5 w-3.5 text-accent" />
            ) : (
              <WifiOff className="h-3.5 w-3.5 text-destructive" />
            )}
            <span>{connected ? "Verbonden" : "Niet verbonden"}</span>
            <span className="text-border">•</span>
            <Clock className="h-3.5 w-3.5" />
            <span className="tabular">{formatTime(gameTime)}</span>
          </span>
        }
      />

      <div className="grid lg:grid-cols-[1fr_18rem] gap-6 lg:gap-8 items-start">
        {/* Board */}
        <div className="space-y-4">
          <GameStatus message={winnerMessage ?? statusMessage} winner={winner} />
          <Board
            board={game.gameState.board}
            lastMove={game.gameState.lastMove}
            currentPlayer={game.gameState.currentPlayer}
            gameActive={game.gameState.gameActive}
            locked={isLocked}
            onMove={makeMove}
          />
          <LastMoveLegend />
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                Spelers
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <PlayerRow
                player="X"
                name={game.players.X?.name ?? "Wachten…"}
                isMe={game.players.X?.symbol === mySymbol}
                isTurn={
                  game.gameState.currentPlayer === "X" && game.gameState.gameActive
                }
              />
              <PlayerRow
                player="O"
                name={game.players.O?.name ?? "Wachten…"}
                isMe={game.players.O?.symbol === mySymbol}
                isTurn={
                  game.gameState.currentPlayer === "O" && game.gameState.gameActive
                }
              />
            </CardContent>
          </Card>

          <ScoreCard
            score={game.gameState.score}
            currentPlayer={game.gameState.currentPlayer}
            gameActive={game.gameState.gameActive}
            labelX={game.players.X?.name}
            labelO={game.players.O?.name}
          />

          <div className="grid grid-cols-2 gap-2">
            <Link href="/online">
              <Button variant="default" size="default" className="w-full">
                <Users className="h-4 w-4" />
                Nieuw spel
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" size="default" className="w-full">
                <Home className="h-4 w-4" />
                Home
              </Button>
            </Link>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}

function PlayerRow({
  player,
  name,
  isMe,
  isTurn,
}: {
  player: Player;
  name: string;
  isMe: boolean;
  isTurn: boolean;
}) {
  return (
    <div
      className={
        isTurn
          ? player === "X"
            ? "flex items-center gap-3 rounded-lg border bg-muted/30 px-3 py-2.5 ring-2 ring-game-x"
            : "flex items-center gap-3 rounded-lg border bg-muted/30 px-3 py-2.5 ring-2 ring-game-o"
          : "flex items-center gap-3 rounded-lg border bg-muted/30 px-3 py-2.5"
      }
    >
      <PlayerBadge player={player} size="md" />
      <div className="min-w-0 flex-1">
        <p className="font-semibold truncate">
          {name} {isMe && <span className="text-muted-foreground">(Jij)</span>}
        </p>
        <p className="text-xs text-muted-foreground">Speler {player}</p>
      </div>
      {isTurn && (
        <span
          aria-hidden="true"
          className="h-2 w-2 rounded-full bg-accent animate-pulse"
        />
      )}
    </div>
  );
}

export default function OnlineGamePage() {
  return (
    <Suspense
      fallback={
        <AppShell>
          <div className="text-center py-16 text-muted-foreground">Laden…</div>
        </AppShell>
      }
    >
      <OnlineGameContent />
    </Suspense>
  );
}
