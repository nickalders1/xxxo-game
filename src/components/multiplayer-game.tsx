"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Home, RotateCcw, Users, Wifi, WifiOff } from "lucide-react";
import { useMultiplayer } from "../../contexts/multiplayer-context";
import type { GameState } from "../types/database";

interface MultiplayerGameProps {
  user: any;
  token: string;
  roomCode: string;
  initialGameState: GameState;
  onBackToMenu: () => void;
  onLogout: () => void;
}

export default function MultiplayerGame({
  user,
  token,
  roomCode,
  initialGameState,
  onBackToMenu,
  onLogout,
}: MultiplayerGameProps) {
  const { currentRoom, error, isConnected, makeMove } = useMultiplayer();
  const [statusMessage, setStatusMessage] = useState("");
  const [winner, setWinner] = useState<string | null>(null);

  // Use current room's game state if available, otherwise use initial
  const gameState = currentRoom?.gameState || initialGameState;

  // Determine which player this user is
  const userSymbol = gameState?.players?.X?.id === user?.id ? "X" : "O";
  const isUserTurn =
    gameState?.currentPlayer === userSymbol && gameState?.gameActive;

  useEffect(() => {
    updateStatusMessage(gameState);
  }, [gameState, userSymbol]);

  const updateStatusMessage = (state: GameState) => {
    if (!state?.gameActive) {
      if (state?.score?.X > state?.score?.O) {
        setWinner(`${state.players.X.username} (X) Wins! 🎉`);
      } else if (state?.score?.O > state?.score?.X) {
        setWinner(`${state.players.O.username} (O) Wins! 🎉`);
      } else {
        setWinner("It's a Tie! 🤝");
      }
      setStatusMessage("Game Over");
    } else if (state?.currentPlayer === userSymbol) {
      if (state?.bonusTurn) {
        setStatusMessage("Your turn! (Bonus turn)");
      } else {
        setStatusMessage("Your turn!");
      }
    } else {
      const opponentName =
        state?.players?.[state?.currentPlayer]?.username || "Opponent";
      if (state?.bonusTurn) {
        setStatusMessage(`${opponentName}'s bonus turn`);
      } else {
        setStatusMessage(`${opponentName}'s turn`);
      }
    }
  };

  const handleMove = async (row: number, col: number) => {
    if (!isUserTurn || gameState?.board?.[row]?.[col] !== "" || !isConnected)
      return;

    // Check if move is next to last move (game rule)
    const lastMove = gameState?.lastMove?.[userSymbol];
    if (
      lastMove &&
      Math.abs(row - lastMove.row) <= 1 &&
      Math.abs(col - lastMove.col) <= 1
    ) {
      setStatusMessage("You cannot move next to your last move!");
      setTimeout(() => updateStatusMessage(gameState), 2000);
      return;
    }

    await makeMove(row, col, token);
  };

  const getCellClass = (row: number, col: number) => {
    let classes =
      "w-full h-full aspect-square text-base sm:text-xl flex items-center justify-center border border-gray-600 bg-gray-600 hover:bg-gray-500 transition-colors cursor-pointer";

    if (gameState?.board?.[row]?.[col] !== "") {
      classes += " cursor-not-allowed bg-gray-700";
    }

    if (!isUserTurn || !gameState?.gameActive || !isConnected) {
      classes += " cursor-not-allowed";
    }

    // Highlight last moves
    const lastX = gameState?.lastMove?.X;
    const lastO = gameState?.lastMove?.O;

    if (lastX && lastX.row === row && lastX.col === col) {
      classes += " !bg-blue-800 text-white";
    }
    if (lastO && lastO.row === row && lastO.col === col) {
      classes += " !bg-red-800 text-white";
    }

    return classes;
  };

  // Show loading if game state is not ready
  if (
    !gameState ||
    !gameState.players ||
    !gameState.players.X ||
    !gameState.players.O
  ) {
    return (
      <div className="min-h-screen bg-[#0e1014] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading game...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0e1014] text-white">
      <div className="container mx-auto max-w-screen-lg px-4 py-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-center mb-8 gap-4">
          <Button
            onClick={onBackToMenu}
            variant="outline"
            className="border-gray-600 text-gray-300 hover:bg-gray-700 bg-transparent"
          >
            <Home className="mr-2 h-4 w-4" />
            Back to Menu
          </Button>
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-2">XXXo Multiplayer</h1>
            <div className="text-sm text-gray-400">Room: {roomCode}</div>
            <div
              className={`flex items-center justify-center gap-2 text-sm ${
                isConnected ? "text-green-400" : "text-red-400"
              }`}
            >
              {isConnected ? (
                <Wifi className="h-4 w-4" />
              ) : (
                <WifiOff className="h-4 w-4" />
              )}
              {isConnected ? "Connected" : "Reconnecting..."}
            </div>
          </div>
          <Button
            onClick={onLogout}
            variant="outline"
            className="border-gray-600 text-gray-300 hover:bg-gray-700 bg-transparent"
          >
            Logout
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Game Board */}
          <div className="lg:col-span-2">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-center text-white">
                  {winner ? winner : statusMessage}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 relative">
                {/* Game Over Overlay */}
                {winner && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60 rounded-lg">
                    <div className="bg-gray-800 border border-white/20 text-white rounded-xl px-8 py-6 shadow-xl text-center max-w-xs w-full">
                      <h2 className="text-xl font-semibold mb-4">{winner}</h2>
                      <div className="space-y-2">
                        <div className="text-sm text-gray-300">
                          Final Score: {gameState.players.X.username}{" "}
                          {gameState.score.X} - {gameState.score.O}{" "}
                          {gameState.players.O.username}
                        </div>
                        <Button
                          onClick={onBackToMenu}
                          className="w-full bg-blue-600 hover:bg-blue-700"
                        >
                          <RotateCcw className="mr-2 h-4 w-4" />
                          New Game
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-center">
                  <div className="grid grid-cols-5 gap-2 w-full max-w-[90vw] sm:max-w-[400px] aspect-square">
                    {gameState.board.map((row, rowIndex) =>
                      row.map((cell, colIndex) => (
                        <button
                          key={`${rowIndex}-${colIndex}`}
                          className={getCellClass(rowIndex, colIndex)}
                          onClick={() => handleMove(rowIndex, colIndex)}
                          disabled={
                            !gameState.gameActive ||
                            cell !== "" ||
                            !isUserTurn ||
                            !isConnected
                          }
                        >
                          <span
                            className={
                              cell === "X" ? "text-blue-400" : "text-red-400"
                            }
                          >
                            {cell}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Game Info Sidebar */}
          <div className="space-y-6">
            {/* Players */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Players
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div
                  className={`p-3 rounded ${
                    gameState.currentPlayer === "X"
                      ? "bg-blue-900/50 border border-blue-600"
                      : "bg-gray-700"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-blue-400 font-semibold">
                      {gameState.players.X.username} (X)
                      {gameState.players.X.id === user.id && " (You)"}
                    </span>
                    <span className="text-white font-bold">
                      {gameState.score.X}
                    </span>
                  </div>
                </div>
                <div
                  className={`p-3 rounded ${
                    gameState.currentPlayer === "O"
                      ? "bg-red-900/50 border border-red-600"
                      : "bg-gray-700"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-red-400 font-semibold">
                      {gameState.players.O.username} (O)
                      {gameState.players.O.id === user.id && " (You)"}
                    </span>
                    <span className="text-white font-bold">
                      {gameState.score.O}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Game Rules Reminder */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white text-sm">Game Rules</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-gray-300 space-y-2">
                <div>• Make 4 in a row = 1 point</div>
                <div>• Make 5 in a row = 2 points</div>
                <div>• Extend 4-to-5 = +1 point only</div>
                <div>• Can't move next to your last move</div>
                <div>• Bonus turn when opponent can't move</div>
                <div>• Highest score wins!</div>
              </CardContent>
            </Card>

            {/* Error Display */}
            {error && (
              <Card className="bg-red-900/20 border-red-600">
                <CardContent className="p-3">
                  <div className="text-red-400 text-sm">{error}</div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
