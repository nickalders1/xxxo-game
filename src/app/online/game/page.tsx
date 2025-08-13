"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Home, Wifi, WifiOff, Users, Clock } from "lucide-react";
import SocketManager from "@/lib/socket";
import type { Socket } from "socket.io-client";

const BOARD_SIZE = 5;

interface GameState {
  board: string[][];
  currentPlayer: "X" | "O";
  gameActive: boolean;
  score: { X: number; O: number };
  lastMove: {
    X: { row: number; col: number } | null;
    O: { row: number; col: number } | null;
  };
  bonusTurn: boolean;
}

interface Player {
  id: string;
  name: string;
  symbol: "X" | "O";
}

interface GameData {
  id: string;
  players: { X: Player | null; O: Player | null };
  gameState: GameState;
  status: "waiting" | "active" | "finished";
  winner: "X" | "O" | "tie" | null;
}

function OnlineGameContent() {
  const searchParams = useSearchParams();
  const gameId = searchParams.get("id");
  const playerName = searchParams.get("name");

  const [socket, setSocket] = useState<Socket | null>(null);
  const [game, setGame] = useState<GameData | null>(null);
  const [connected, setConnected] = useState(false);
  const [mySymbol, setMySymbol] = useState<"X" | "O" | null>(null);
  const [statusMessage, setStatusMessage] = useState("Verbinden...");
  const [winner, setWinner] = useState<string | null>(null);
  const [gameTime, setGameTime] = useState(0);
  const [actualPlayerName, setActualPlayerName] = useState<string>("");

  useEffect(() => {
    console.log("Game page loaded with:", { gameId, playerName }); // Debug log

    // Get player name from localStorage (client-side only)
    let resolvedPlayerName = playerName;
    if (typeof window !== "undefined") {
      if (!resolvedPlayerName || resolvedPlayerName.trim() === "") {
        resolvedPlayerName = localStorage.getItem("playerName");
        console.log("Got name from localStorage:", resolvedPlayerName);
      }
    }

    setActualPlayerName(resolvedPlayerName || "Unknown");

    if (!gameId || !resolvedPlayerName) {
      console.log("Missing parameters, redirecting to lobby", {
        gameId,
        resolvedPlayerName,
      });
      setTimeout(() => {
        window.location.href = "/online";
      }, 2000);
      return;
    }

    const socketManager = SocketManager.getInstance();
    const socketConnection = socketManager.connect();
    setSocket(socketConnection);

    socketConnection.on("connect", () => {
      setConnected(true);
      console.log("Connected, joining game with name:", resolvedPlayerName);
      socketConnection.emit("join-game", {
        gameId,
        playerName: resolvedPlayerName,
      });
    });

    socketConnection.on("disconnect", () => {
      setConnected(false);
      setStatusMessage("Verbinding verbroken");
    });

    socketConnection.on("game-joined", ({ game, yourSymbol }) => {
      console.log("Game joined successfully:", { game, yourSymbol });
      setGame(game);
      setMySymbol(yourSymbol);
      updateStatusMessage(game);
    });

    socketConnection.on("game-updated", ({ game }) => {
      setGame(game);
      updateStatusMessage(game);
    });

    socketConnection.on("game-ended", ({ game, winner }) => {
      setGame(game);
      if (winner === "tie") {
        setWinner("Gelijkspel! 🤝");
      } else {
        const winnerPlayer = game.players[winner];
        setWinner(`${winnerPlayer?.name} wint! 🎉`);
      }
    });

    socketConnection.on("player-disconnected", ({ playerName }) => {
      setStatusMessage(`${playerName} heeft het spel verlaten`);
    });

    socketConnection.on("error", ({ message }) => {
      console.log("Socket error:", message);
      setStatusMessage(`Fout: ${message}`);
    });

    // Game timer
    const timer = setInterval(() => {
      setGameTime((prev) => prev + 1);
    }, 1000);

    return () => {
      clearInterval(timer);
      socketManager.disconnect();
    };
  }, [gameId, playerName]);

  const updateStatusMessage = (gameData: GameData) => {
    if (gameData.status === "waiting") {
      setStatusMessage("Wachten op tegenstander...");
    } else if (gameData.status === "finished") {
      return; // Winner message is set separately
    } else if (gameData.gameState.bonusTurn) {
      const bonusPlayer = gameData.players.O;
      setStatusMessage(`${bonusPlayer?.name} krijgt een bonus beurt!`);
    } else {
      const currentPlayerData =
        gameData.players[gameData.gameState.currentPlayer];
      if (currentPlayerData?.symbol === mySymbol) {
        setStatusMessage("Jouw beurt!");
      } else {
        setStatusMessage(`${currentPlayerData?.name} is aan de beurt`);
      }
    }
  };

  const makeMove = (row: number, col: number) => {
    if (!socket || !game || !game.gameState.gameActive) return;

    const currentPlayerData = game.players[game.gameState.currentPlayer];
    if (currentPlayerData?.symbol !== mySymbol) {
      setStatusMessage("Het is niet jouw beurt!");
      return;
    }

    socket.emit("make-move", { gameId, row, col });
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  };

  const getCellClass = (row: number, col: number) => {
    const cell = game?.gameState.board[row][col] || "";
    let classes =
      "aspect-square rounded-lg border-2 flex items-center justify-center text-lg sm:text-xl font-bold transition-all duration-200 ";

    if (cell === "") {
      classes +=
        "bg-slate-700 border-slate-600 hover:bg-slate-600 cursor-pointer active:scale-95";
    } else {
      classes += "cursor-not-allowed border-slate-500";
      if (cell === "X") {
        classes += " bg-purple-500 text-white";
      } else {
        classes += " bg-pink-500 text-white";
      }
    }

    // Highlight last moves
    const lastX = game?.gameState.lastMove.X;
    const lastO = game?.gameState.lastMove.O;

    if (lastX && lastX.row === row && lastX.col === col) {
      classes += " ring-2 ring-purple-300";
    }
    if (lastO && lastO.row === row && lastO.col === col) {
      classes += " ring-2 ring-pink-300";
    }

    return classes;
  };

  if (!game) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <Card className="bg-slate-800/50 border-slate-700 max-w-md">
          <CardContent className="text-center p-6">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
            <p className="text-white mb-4">{statusMessage}</p>
            <div className="text-xs text-slate-400 mb-4">
              Game ID: {gameId}
              <br />
              Player: {actualPlayerName}
            </div>
            <Link href="/online">
              <Button className="bg-purple-500 hover:bg-purple-600">
                Terug naar Lobby
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-4 sm:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <Link href="/online">
            <Button
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent"
            >
              <Home className="mr-2 h-4 w-4" />
              Lobby
            </Button>
          </Link>

          <div className="text-center">
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
              Online Match
            </h1>
            <div className="flex items-center gap-4 justify-center text-sm text-slate-300">
              <div className="flex items-center gap-2">
                {connected ? (
                  <Wifi className="h-4 w-4 text-green-400" />
                ) : (
                  <WifiOff className="h-4 w-4 text-red-400" />
                )}
                <span>{connected ? "Verbonden" : "Niet verbonden"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{formatTime(gameTime)}</span>
              </div>
            </div>
          </div>

          <div className="w-20"></div>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Game Board */}
          <div className="lg:col-span-3">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="pb-4">
                <CardTitle className="text-center text-white text-lg sm:text-xl">
                  {winner ? winner : statusMessage}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="relative">
                  {/* Game Over Overlay */}
                  {winner && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/80 rounded-lg">
                      <div className="bg-slate-800 border border-slate-600 text-white rounded-xl p-6 text-center max-w-xs w-full mx-4">
                        <h2 className="text-xl font-semibold mb-4">{winner}</h2>
                        <div className="space-y-3">
                          <Link href="/online" className="block">
                            <Button className="w-full bg-purple-500 hover:bg-purple-600">
                              <Users className="mr-2 h-4 w-4" />
                              Nieuw Spel Zoeken
                            </Button>
                          </Link>
                          <Link href="/" className="block">
                            <Button
                              variant="outline"
                              className="w-full border-slate-600 text-slate-300 bg-transparent"
                            >
                              <Home className="mr-2 h-4 w-4" />
                              Home
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Board */}
                  <div className="grid grid-cols-5 gap-2 max-w-md mx-auto">
                    {game.gameState.board.map((row, rowIndex) =>
                      row.map((cell, colIndex) => (
                        <button
                          key={`${rowIndex}-${colIndex}`}
                          className={getCellClass(rowIndex, colIndex)}
                          onClick={() => makeMove(rowIndex, colIndex)}
                          disabled={
                            !game.gameState.gameActive ||
                            cell !== "" ||
                            !connected
                          }
                        >
                          {cell}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Players */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-lg flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Spelers
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div
                  className={`p-3 rounded-lg border ${
                    game.players.X?.symbol === mySymbol
                      ? "bg-purple-900/30 border-purple-700"
                      : "bg-slate-700/50 border-slate-600"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-semibold">
                        {game.players.X?.name || "Wachten..."}{" "}
                        {game.players.X?.symbol === mySymbol && "(Jij)"}
                      </p>
                      <p className="text-slate-400 text-sm">Speler X</p>
                    </div>
                    {game.gameState.currentPlayer === "X" &&
                      game.gameState.gameActive && (
                        <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                      )}
                  </div>
                </div>

                <div
                  className={`p-3 rounded-lg border ${
                    game.players.O?.symbol === mySymbol
                      ? "bg-pink-900/30 border-pink-700"
                      : "bg-slate-700/50 border-slate-600"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-semibold">
                        {game.players.O?.name || "Wachten..."}{" "}
                        {game.players.O?.symbol === mySymbol && "(Jij)"}
                      </p>
                      <p className="text-slate-400 text-sm">Speler O</p>
                    </div>
                    {game.gameState.currentPlayer === "O" &&
                      game.gameState.gameActive && (
                        <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                      )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Current Score */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-lg">Score</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-purple-500 rounded"></div>
                    <span className="text-slate-300">Speler X</span>
                  </div>
                  <span className="text-white font-bold text-xl">
                    {game.gameState.score.X}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-pink-500 rounded"></div>
                    <span className="text-slate-300">Speler O</span>
                  </div>
                  <span className="text-white font-bold text-xl">
                    {game.gameState.score.O}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Game Status */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-lg">Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-300">Status:</span>
                  <span className="text-white">
                    {game.status === "waiting" && "Wachten"}
                    {game.status === "active" && "Actief"}
                    {game.status === "finished" && "Afgelopen"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-300">Speeltijd:</span>
                  <span className="text-white">{formatTime(gameTime)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-300">Jouw symbool:</span>
                  <span className="text-white font-bold">
                    {mySymbol || "?"}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-lg">Acties</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href="/online" className="block">
                  <Button
                    className="w-full bg-purple-500 hover:bg-purple-600"
                    size="sm"
                  >
                    <Users className="mr-2 h-4 w-4" />
                    Nieuw Spel
                  </Button>
                </Link>
                <Link href="/rules" className="block">
                  <Button
                    variant="outline"
                    className="w-full border-slate-600 text-slate-300 bg-transparent"
                    size="sm"
                  >
                    Spelregels
                  </Button>
                </Link>
                <Link href="/" className="block">
                  <Button
                    variant="outline"
                    className="w-full border-slate-600 text-slate-300 bg-transparent"
                    size="sm"
                  >
                    <Home className="mr-2 h-4 w-4" />
                    Home
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OnlineGamePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center text-white">
          Loading...
        </div>
      }
    >
      <OnlineGameContent />
    </Suspense>
  );
}
