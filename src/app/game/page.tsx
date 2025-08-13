"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Home, RotateCcw, Trophy } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

function GameContent() {
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode") || "local";

  const [gameState, setGameState] = useState<GameState>({
    board: Array(BOARD_SIZE)
      .fill(null)
      .map(() => Array(BOARD_SIZE).fill("")),
    currentPlayer: "X",
    gameActive: true,
    score: { X: 0, O: 0 },
    lastMove: { X: null, O: null },
    bonusTurn: false,
  });

  const [statusMessage, setStatusMessage] = useState(
    "Speler X is aan de beurt"
  );
  const [winner, setWinner] = useState<string | null>(null);
  const [aiDifficulty, setAiDifficulty] = useState<"easy" | "medium" | "hard">(
    "medium"
  );
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [gameStats, setGameStats] = useState({ X: 0, O: 0, ties: 0 });

  // AI Move Effect
  useEffect(() => {
    if (
      mode === "ai" &&
      gameState.currentPlayer === "O" &&
      gameState.gameActive &&
      !isAiThinking
    ) {
      makeAiMove();
    }
  }, [gameState.currentPlayer, gameState.gameActive, mode, isAiThinking]);

  const initializeGame = () => {
    setGameState({
      board: Array(BOARD_SIZE)
        .fill(null)
        .map(() => Array(BOARD_SIZE).fill("")),
      currentPlayer: "X",
      gameActive: true,
      score: { X: 0, O: 0 },
      lastMove: { X: null, O: null },
      bonusTurn: false,
    });
    setStatusMessage(
      mode === "ai" ? "Jouw beurt (X)" : "Speler X is aan de beurt"
    );
    setWinner(null);
    setIsAiThinking(false);
  };

  const isNextToLastMove = (row: number, col: number, player: "X" | "O") => {
    const last = gameState.lastMove[player];
    if (!last) return false;
    return Math.abs(row - last.row) <= 1 && Math.abs(col - last.col) <= 1;
  };

  // Calculate points gained from placing a piece at this specific position
  const checkForPoints = (
    board: string[][],
    row: number,
    col: number,
    player: string
  ) => {
    const directions = [
      { r: 0, c: 1 }, // horizontal
      { r: 1, c: 0 }, // vertical
      { r: 1, c: 1 }, // diagonal \
      { r: 1, c: -1 }, // diagonal /
    ];

    let totalPoints = 0;

    for (const { r, c } of directions) {
      // Count in both directions from the placed piece
      let count = 1; // Start with 1 for the piece we just placed

      // Count forward
      for (let i = 1; i < 5; i++) {
        const newRow = row + r * i;
        const newCol = col + c * i;
        if (
          newRow >= 0 &&
          newRow < BOARD_SIZE &&
          newCol >= 0 &&
          newCol < BOARD_SIZE &&
          board[newRow][newCol] === player
        ) {
          count++;
        } else break;
      }

      // Count backward
      for (let i = 1; i < 5; i++) {
        const newRow = row - r * i;
        const newCol = col - c * i;
        if (
          newRow >= 0 &&
          newRow < BOARD_SIZE &&
          newCol >= 0 &&
          newCol < BOARD_SIZE &&
          board[newRow][newCol] === player
        ) {
          count++;
        } else break;
      }

      // Now award points based on what we achieved
      if (count >= 5) {
        // We have 5+ in a row, but was there already a 4-in-a-row before?
        const boardBefore = board.map((r) => [...r]);
        boardBefore[row][col] = ""; // Remove our piece

        let countBefore = 0;
        // Count the exact same line without our piece
        for (let i = 1; i < 5; i++) {
          const newRow = row + r * i;
          const newCol = col + c * i;
          if (
            newRow >= 0 &&
            newRow < BOARD_SIZE &&
            newCol >= 0 &&
            newCol < BOARD_SIZE &&
            boardBefore[newRow][newCol] === player
          ) {
            countBefore++;
          } else break;
        }

        for (let i = 1; i < 5; i++) {
          const newRow = row - r * i;
          const newCol = col - c * i;
          if (
            newRow >= 0 &&
            newRow < BOARD_SIZE &&
            newCol >= 0 &&
            newCol < BOARD_SIZE &&
            boardBefore[newRow][newCol] === player
          ) {
            countBefore++;
          } else break;
        }

        // CHECK 1: Was there less than 4 before? Then +2 points (NEW 5-in-a-row)
        if (countBefore < 4) {
          totalPoints += 2;
          console.log(
            `Player ${player} created NEW 5-in-a-row (was ${countBefore} before): +2 points`
          );
        }
        // CHECK 2: Was there exactly 4 before? Then +1 point (extending 4 to 5)
        else if (countBefore === 4) {
          totalPoints += 1;
          console.log(
            `Player ${player} extended 4-in-a-row to 5-in-a-row: +1 point`
          );
        }
      } else if (count === 4) {
        // New 4-in-a-row
        totalPoints += 1;
        console.log(`Player ${player} created 4-in-a-row: +1 point`);
      }
    }

    console.log(
      `Total points for ${player} at (${row}, ${col}): ${totalPoints}`
    );
    return totalPoints;
  };

  const hasValidMove = (
    board: string[][],
    player: "X" | "O",
    lastMove: any
  ) => {
    const last = lastMove[player];
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        if (
          board[row][col] === "" &&
          (!last ||
            Math.abs(row - last.row) > 1 ||
            Math.abs(col - last.col) > 1)
        ) {
          return true;
        }
      }
    }
    return false;
  };

  const countEmptyCells = (board: string[][]) => {
    let count = 0;
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        if (board[row][col] === "") count++;
      }
    }
    return count;
  };

  const anyPotentialPoints = (board: string[][], lastMove: any) => {
    const emptyCells = countEmptyCells(board);
    if (emptyCells > 12) return true;

    for (const player of ["X", "O"]) {
      const last = lastMove[player];
      for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
          if (board[row][col] !== "") continue;
          if (
            last &&
            Math.abs(row - last.row) <= 1 &&
            Math.abs(col - last.col) <= 1
          )
            continue;

          const testBoard = board.map((r) => [...r]);
          testBoard[row][col] = player;
          const pointsGained = checkForPoints(testBoard, row, col, player);

          if (pointsGained > 0) return true;
        }
      }
    }
    return false;
  };

  // AI Logic
  const evaluatePosition = (board: string[][], player: "X" | "O") => {
    let score = 0;
    const opponent = player === "X" ? "O" : "X";

    const directions = [
      { r: 0, c: 1 },
      { r: 1, c: 0 },
      { r: 1, c: 1 },
      { r: 1, c: -1 },
    ];

    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        for (const { r, c } of directions) {
          let playerCount = 0;
          let opponentCount = 0;
          let emptyCount = 0;

          for (let i = 0; i < 5; i++) {
            const newRow = row + r * i;
            const newCol = col + c * i;

            if (
              newRow >= 0 &&
              newRow < BOARD_SIZE &&
              newCol >= 0 &&
              newCol < BOARD_SIZE
            ) {
              if (board[newRow][newCol] === player) playerCount++;
              else if (board[newRow][newCol] === opponent) opponentCount++;
              else emptyCount++;
            }
          }

          if (opponentCount === 0 && playerCount > 0) {
            score += playerCount * playerCount;
          }
          if (playerCount === 0 && opponentCount > 0) {
            score -= opponentCount * opponentCount;
          }
        }
      }
    }

    return score;
  };

  const getValidMoves = (
    board: string[][],
    player: "X" | "O",
    lastMove: any
  ) => {
    const validMoves = [];
    const last = lastMove[player];

    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        if (
          board[row][col] === "" &&
          (!last ||
            Math.abs(row - last.row) > 1 ||
            Math.abs(col - last.col) > 1)
        ) {
          validMoves.push({ row, col });
        }
      }
    }

    return validMoves;
  };

  const makeAiMove = () => {
    if (
      !gameState.gameActive ||
      gameState.currentPlayer !== "O" ||
      mode !== "ai"
    )
      return;

    setIsAiThinking(true);
    setStatusMessage("AI denkt na...");

    setTimeout(
      () => {
        const validMoves = getValidMoves(
          gameState.board,
          "O",
          gameState.lastMove
        );
        if (validMoves.length === 0) {
          setIsAiThinking(false);
          return;
        }

        let bestMove = validMoves[0];

        if (aiDifficulty === "easy") {
          bestMove = validMoves[Math.floor(Math.random() * validMoves.length)];
        } else if (aiDifficulty === "medium") {
          let bestScore = -1;

          for (const move of validMoves) {
            const testBoard = gameState.board.map((row) => [...row]);
            testBoard[move.row][move.col] = "O";
            const points = checkForPoints(testBoard, move.row, move.col, "O");

            if (points > bestScore) {
              bestScore = points;
              bestMove = move;
            }
          }

          if (bestScore === 0 && Math.random() < 0.3) {
            bestMove =
              validMoves[Math.floor(Math.random() * validMoves.length)];
          }
        } else {
          let bestScore = Number.NEGATIVE_INFINITY;

          for (const move of validMoves) {
            const testBoard = gameState.board.map((row) => [...row]);
            testBoard[move.row][move.col] = "O";

            const immediatePoints = checkForPoints(
              testBoard,
              move.row,
              move.col,
              "O"
            );
            const positionScore = evaluatePosition(testBoard, "O");
            const totalScore = immediatePoints * 100 + positionScore;

            if (totalScore > bestScore) {
              bestScore = totalScore;
              bestMove = move;
            }
          }
        }

        setIsAiThinking(false);
        handleMove(bestMove.row, bestMove.col);
      },
      aiDifficulty === "easy" ? 500 : aiDifficulty === "medium" ? 1000 : 1500
    );
  };

  const declareWinner = (newScore: { X: number; O: number }) => {
    let winnerText = "";
    const newStats = { ...gameStats };

    if (newScore.X > newScore.O) {
      winnerText = mode === "ai" ? "Jij wint! 🎉" : "Speler X wint! 🎉";
      newStats.X++;
    } else if (newScore.O > newScore.X) {
      winnerText = mode === "ai" ? "AI wint! 🤖" : "Speler O wint! 🎉";
      newStats.O++;
    } else {
      winnerText = "Gelijkspel! 🤝";
      newStats.ties++;
    }

    setWinner(winnerText);
    setGameStats(newStats);
    setGameState((prev) => ({ ...prev, gameActive: false }));
  };

  const handleMove = (row: number, col: number) => {
    if (!gameState.gameActive) return;

    if (gameState.board[row][col] !== "") {
      setStatusMessage("Dit vakje is al bezet!");
      setTimeout(() => {
        const currentMsg =
          mode === "ai"
            ? "Jouw beurt (X)"
            : `Speler ${gameState.currentPlayer} is aan de beurt`;
        setStatusMessage(currentMsg);
      }, 2000);
      return;
    }

    if (isNextToLastMove(row, col, gameState.currentPlayer)) {
      setStatusMessage("Je mag niet naast je laatste zet plaatsen!");
      setTimeout(() => {
        const currentMsg =
          mode === "ai"
            ? "Jouw beurt (X)"
            : `Speler ${gameState.currentPlayer} is aan de beurt`;
        setStatusMessage(currentMsg);
      }, 2000);
      return;
    }

    const newBoard = gameState.board.map((row) => [...row]);
    newBoard[row][col] = gameState.currentPlayer;

    // Calculate points gained from this specific move
    const pointsGained = checkForPoints(
      newBoard,
      row,
      col,
      gameState.currentPlayer
    );

    // Add points to current score
    const newScore = { ...gameState.score };
    newScore[gameState.currentPlayer] += pointsGained;

    const newLastMove = { ...gameState.lastMove };
    newLastMove[gameState.currentPlayer] = { row, col };

    // Check game end conditions
    if (gameState.bonusTurn && gameState.currentPlayer === "O") {
      setGameState((prev) => ({
        ...prev,
        board: newBoard,
        score: newScore,
        lastMove: newLastMove,
        bonusTurn: false,
        gameActive: false,
      }));
      declareWinner(newScore);
      return;
    }

    const xCanMove = hasValidMove(newBoard, "X", newLastMove);
    const oCanMove = hasValidMove(newBoard, "O", newLastMove);
    const stillPointsPossible = anyPotentialPoints(newBoard, newLastMove);

    if (
      countEmptyCells(newBoard) <= 1 ||
      (!xCanMove && !oCanMove) ||
      !stillPointsPossible
    ) {
      setGameState((prev) => ({
        ...prev,
        board: newBoard,
        score: newScore,
        lastMove: newLastMove,
        gameActive: false,
      }));
      declareWinner(newScore);
      return;
    }

    if (gameState.currentPlayer === "X" && !xCanMove && oCanMove) {
      setGameState((prev) => ({
        ...prev,
        board: newBoard,
        score: newScore,
        lastMove: newLastMove,
        bonusTurn: true,
        currentPlayer: "O",
      }));
      setStatusMessage(
        mode === "ai"
          ? "AI krijgt een bonus beurt!"
          : "Speler O krijgt een bonus beurt!"
      );
      return;
    }

    if (gameState.currentPlayer === "X" && !oCanMove) {
      setGameState((prev) => ({
        ...prev,
        board: newBoard,
        score: newScore,
        lastMove: newLastMove,
        gameActive: false,
      }));
      declareWinner(newScore);
      return;
    }

    const nextPlayer = gameState.currentPlayer === "X" ? "O" : "X";
    setGameState((prev) => ({
      ...prev,
      board: newBoard,
      score: newScore,
      lastMove: newLastMove,
      currentPlayer: nextPlayer,
    }));

    if (mode === "ai") {
      setStatusMessage(
        nextPlayer === "X" ? "Jouw beurt (X)" : "AI denkt na..."
      );
    } else {
      setStatusMessage(`Speler ${nextPlayer} is aan de beurt`);
    }
  };

  const getCellClass = (row: number, col: number) => {
    const cell = gameState.board[row][col];
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
    const lastX = gameState.lastMove.X;
    const lastO = gameState.lastMove.O;

    if (lastX && lastX.row === row && lastX.col === col) {
      classes += " ring-2 ring-purple-300";
    }
    if (lastO && lastO.row === row && lastO.col === col) {
      classes += " ring-2 ring-pink-300";
    }

    return classes;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-4 sm:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <Link href="/">
            <Button
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent"
            >
              <Home className="mr-2 h-4 w-4" />
              Home
            </Button>
          </Link>

          <div className="text-center">
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
              XXXo Game
            </h1>
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <span>{mode === "ai" ? "Tegen AI" : "Lokaal Spel"}</span>
              {mode === "ai" && (
                <>
                  <span>•</span>
                  <Select
                    value={aiDifficulty}
                    onValueChange={(value: any) => setAiDifficulty(value)}
                  >
                    <SelectTrigger className="w-24 h-8 bg-slate-800 border-slate-600 text-white text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-600">
                      <SelectItem
                        value="easy"
                        className="text-white hover:bg-slate-700"
                      >
                        Easy
                      </SelectItem>
                      <SelectItem
                        value="medium"
                        className="text-white hover:bg-slate-700"
                      >
                        Medium
                      </SelectItem>
                      <SelectItem
                        value="hard"
                        className="text-white hover:bg-slate-700"
                      >
                        Hard
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </>
              )}
            </div>
          </div>

          <Button
            onClick={initializeGame}
            className="bg-blue-500 hover:bg-blue-600"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Nieuw Spel
          </Button>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Game Board */}
          <div className="lg:col-span-3">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="pb-4">
                <CardTitle className="text-center text-white text-lg sm:text-xl">
                  {winner
                    ? winner
                    : isAiThinking
                    ? "AI denkt na..."
                    : statusMessage}
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
                          <Button
                            onClick={initializeGame}
                            className="w-full bg-blue-500 hover:bg-blue-600"
                          >
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Opnieuw Spelen
                          </Button>
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
                    {gameState.board.map((row, rowIndex) =>
                      row.map((cell, colIndex) => (
                        <button
                          key={`${rowIndex}-${colIndex}`}
                          className={getCellClass(rowIndex, colIndex)}
                          onClick={() => handleMove(rowIndex, colIndex)}
                          disabled={
                            !gameState.gameActive || cell !== "" || isAiThinking
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
            {/* Current Score */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-lg">
                  Huidige Score
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-purple-500 rounded"></div>
                    <span className="text-slate-300">
                      {mode === "ai" ? "Jij (X)" : "Speler X"}
                    </span>
                  </div>
                  <span className="text-white font-bold text-xl">
                    {gameState.score.X}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-pink-500 rounded"></div>
                    <span className="text-slate-300">
                      {mode === "ai" ? "AI (O)" : "Speler O"}
                    </span>
                  </div>
                  <span className="text-white font-bold text-xl">
                    {gameState.score.O}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Game Stats */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-lg flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  Sessie Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-300">
                    {mode === "ai" ? "Jouw overwinningen" : "X overwinningen"}:
                  </span>
                  <span className="text-white font-bold">{gameStats.X}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-300">
                    {mode === "ai" ? "AI overwinningen" : "O overwinningen"}:
                  </span>
                  <span className="text-white font-bold">{gameStats.O}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-300">Gelijkspel:</span>
                  <span className="text-white font-bold">{gameStats.ties}</span>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-lg">Acties</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  onClick={initializeGame}
                  className="w-full bg-green-500 hover:bg-green-600"
                  size="sm"
                >
                  Nieuw Spel
                </Button>
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

export default function GamePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center text-white">
          Loading...
        </div>
      }
    >
      <GameContent />
    </Suspense>
  );
}
