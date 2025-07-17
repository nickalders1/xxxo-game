"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Home, RotateCcw } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Bot, User } from "lucide-react";

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
  totalScore: { X: number; O: number };
}

export default function GamePage() {
  const [gameState, setGameState] = useState<GameState>({
    board: Array(BOARD_SIZE)
      .fill(null)
      .map(() => Array(BOARD_SIZE).fill("")),
    currentPlayer: "X",
    gameActive: true,
    score: { X: 0, O: 0 },
    lastMove: { X: null, O: null },
    bonusTurn: false,
    totalScore: { X: 0, O: 0 },
  });

  const [statusMessage, setStatusMessage] = useState("Player X's turn");
  const [winner, setWinner] = useState<string | null>(null);
  const [gameMode, setGameMode] = useState<"pvp" | "ai">("pvp");
  const [aiDifficulty, setAiDifficulty] = useState<"easy" | "medium" | "hard">(
    "medium"
  );
  const [isAiThinking, setIsAiThinking] = useState(false);

  // AI Move Effect
  useEffect(() => {
    if (
      gameMode === "ai" &&
      gameState.currentPlayer === "O" &&
      gameState.gameActive &&
      !isAiThinking
    ) {
      makeAiMove();
    }
  }, [gameState.currentPlayer, gameState.gameActive, gameMode, isAiThinking]);

  const initializeGame = () => {
    setGameState((prev) => ({
      ...prev,
      board: Array(BOARD_SIZE)
        .fill(null)
        .map(() => Array(BOARD_SIZE).fill("")),
      currentPlayer: "X",
      gameActive: true,
      score: { X: 0, O: 0 },
      lastMove: { X: null, O: null },
      bonusTurn: false,
    }));
    setStatusMessage(gameMode === "ai" ? "Your turn (X)" : "Player X's turn");
    setWinner(null);
    setIsAiThinking(false);
  };

  const isNextToLastMove = (row: number, col: number, player: "X" | "O") => {
    const last = gameState.lastMove[player];
    if (!last) return false;
    return Math.abs(row - last.row) <= 1 && Math.abs(col - last.col) <= 1;
  };

  const countDirection = (
    board: string[][],
    row: number,
    col: number,
    r: number,
    c: number,
    player: string
  ) => {
    let count = 0;
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
    return count;
  };

  const checkForPoints = (
    board: string[][],
    row: number,
    col: number,
    player: string
  ) => {
    const directions = [
      { r: 0, c: 1 },
      { r: 1, c: 0 },
      { r: 1, c: 1 },
      { r: 1, c: -1 },
    ];

    let totalPoints = 0;

    for (const { r, c } of directions) {
      let line = [{ row, col }];

      // Check achteruit
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
          line.unshift({ row: newRow, col: newCol });
        } else break;
      }

      // Check vooruit
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
          line.push({ row: newRow, col: newCol });
        } else break;
      }

      // Als deze lijn precies 4 is: 1 punt
      if (line.length === 4) {
  totalPoints += 1;
} else if (line.length === 5) {
  totalPoints += 2; // 1 voor 4 + 1 bonus voor 5
}


    return totalPoints;
  };

  const anyPotentialPoints = (
    board: string[][],
    lastMove: {
      X: { row: number; col: number } | null;
      O: { row: number; col: number } | null;
    }
  ) => {
    console.log("🔍 Checking for potential points...");

    // Als er nog veel lege vakjes zijn, zijn er waarschijnlijk nog punten mogelijk
    const emptyCells = countEmptyCells(board);
    if (emptyCells > 12) {
      console.log(`✅ Many empty cells (${emptyCells}), points still possible`);
      return true;
    }

    // Voor beide spelers, check realistisch of ze nog kunnen scoren
    for (const player of ["X", "O"]) {
      const last = lastMove[player as "X" | "O"];
      const opponent = player === "X" ? "O" : "X";
      console.log(`🎯 Checking player ${player}, last move:`, last);

      // Check alle lege vakjes die geldig zijn voor deze speler
      for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
          // Skip als vakje bezet is
          if (board[row][col] !== "") continue;

          // Skip als het naast de laatste zet van deze speler is
          if (
            last &&
            Math.abs(row - last.row) <= 1 &&
            Math.abs(col - last.col) <= 1
          ) {
            continue;
          }

          // Simuleer het plaatsen van dit symbool en check direct voor punten
          const testBoard = board.map((r) => [...r]);
          testBoard[row][col] = player;
          const directPoints = checkForPoints(testBoard, row, col, player);

          if (directPoints > 0) {
            console.log(
              `✅ Player ${player} can score ${directPoints} points directly at (${row}, ${col})`
            );
            return true;
          }

          // Check ook voor potentiële lijnen (minder streng dan voorheen)
          const directions = [
            { r: 0, c: 1, name: "horizontal" },
            { r: 1, c: 0, name: "vertical" },
            { r: 1, c: 1, name: "diagonal \\" },
            { r: 1, c: -1, name: "diagonal /" },
          ];

          for (const { r, c, name } of directions) {
            // Check of we een lijn van 4 kunnen maken in deze richting
            for (let lineStart = -3; lineStart <= 0; lineStart++) {
              let playerCount = 0;
              let emptyCount = 0;
              let opponentCount = 0;
              let hasCurrentPos = false;

              // Check 4 posities in deze lijn (voor 4 op een rij)
              for (let i = 0; i < 4; i++) {
                const checkRow = row + r * (lineStart + i);
                const checkCol = col + c * (lineStart + i);

                if (
                  checkRow >= 0 &&
                  checkRow < BOARD_SIZE &&
                  checkCol >= 0 &&
                  checkCol < BOARD_SIZE
                ) {
                  if (checkRow === row && checkCol === col) {
                    hasCurrentPos = true;
                    emptyCount++;
                  } else if (board[checkRow][checkCol] === player) {
                    playerCount++;
                  } else if (board[checkRow][checkCol] === "") {
                    emptyCount++;
                  } else if (board[checkRow][checkCol] === opponent) {
                    opponentCount++;
                  }
                } else {
                  opponentCount++; // Buiten bord = geblokkeerd
                }
              }

              // Als deze lijn de huidige positie bevat, geen tegenstander heeft,
              // en genoeg ruimte heeft voor 4 op een rij
              if (
                hasCurrentPos &&
                opponentCount === 0 &&
                playerCount + emptyCount >= 4
              ) {
                console.log(
                  `✅ Player ${player} has potential 4-in-a-row in ${name} direction at (${row}, ${col})`
                );
                console.log(
                  `   - Player pieces: ${playerCount}, Empty spaces: ${emptyCount}`
                );
                return true;
              }
            }
          }
        }
      }
    }

    console.log("❌ No realistic scoring opportunities left");
    return false;
  };

  const hasValidMove = (
    board: string[][],
    player: "X" | "O",
    lastMove: {
      X: { row: number; col: number } | null;
      O: { row: number; col: number } | null;
    }
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

  // AI Helper Functions
  const evaluatePosition = (board: string[][], player: "X" | "O") => {
    let score = 0;
    const opponent = player === "X" ? "O" : "X";

    // Check all possible lines for scoring opportunities
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

          // Only count if line has potential (no opponent pieces)
          if (opponentCount === 0 && playerCount > 0) {
            score += playerCount * playerCount;
          }
          // Penalty for opponent opportunities
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
      for (let col = 0; col < BOARD_SIZE; row++) {
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
      gameMode !== "ai"
    )
      return;

    setIsAiThinking(true);

    // Simulate thinking time
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
          // Random move
          bestMove = validMoves[Math.floor(Math.random() * validMoves.length)];
        } else if (aiDifficulty === "medium") {
          // Look for immediate scoring opportunities
          let bestScore = Number.NEGATIVE_INFINITY;

          for (const move of validMoves) {
            const testBoard = gameState.board.map((row) => [...row]);
            testBoard[move.row][move.col] = "O";
            const points = checkForPoints(testBoard, move.row, move.col, "O");

            if (points > bestScore) {
              bestScore = points;
              bestMove = move;
            }
          }

          // If no immediate points, add some randomness
          if (bestScore === 0 && Math.random() < 0.3) {
            bestMove =
              validMoves[Math.floor(Math.random() * validMoves.length)];
          }
        } else {
          // hard
          // More sophisticated evaluation
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
    const newTotalScore = { ...gameState.totalScore };

    if (newScore.X > newScore.O) {
      winnerText = "PLAYER X WINS! 🎉";
      newTotalScore.X++;
    } else if (newScore.O > newScore.X) {
      winnerText = "PLAYER O WINS! 🎉";
      newTotalScore.O++;
    } else {
      winnerText = "It's a Tie!";
    }

    setWinner(winnerText);
    setGameState((prev) => ({
      ...prev,
      totalScore: newTotalScore,
      gameActive: false,
    }));
  };

  const handleMove = (row: number, col: number) => {
    if (!gameState.gameActive) return;

    if (gameState.board[row][col] !== "") {
      setStatusMessage("This spot is already taken!");
      setTimeout(
        () => setStatusMessage(`Player ${gameState.currentPlayer}'s turn`),
        2000
      );
      return;
    }

    if (isNextToLastMove(row, col, gameState.currentPlayer)) {
      setStatusMessage("You may not make a move next to your last move.");
      setTimeout(
        () => setStatusMessage(`Player ${gameState.currentPlayer}'s turn`),
        2000
      );
      return;
    }

    const newBoard = gameState.board.map((row) => [...row]);
    newBoard[row][col] = gameState.currentPlayer;

    const points = checkForPoints(newBoard, row, col, gameState.currentPlayer);
    const newScore = { ...gameState.score };
    newScore[gameState.currentPlayer] += points;

    const newLastMove = { ...gameState.lastMove };
    newLastMove[gameState.currentPlayer] = { row, col };

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

    // ✨ Check ook of er nog punten te halen zijn
    const stillPointsPossible = anyPotentialPoints(newBoard, newLastMove);

    // Debug logging
    console.log("🎮 Game state check:", {
      emptyCells: countEmptyCells(newBoard),
      xCanMove,
      oCanMove,
      stillPointsPossible,
    });

    if (
      countEmptyCells(newBoard) <= 1 ||
      (!xCanMove && !oCanMove) ||
      !stillPointsPossible
    ) {
      let endReason = "";
      if (countEmptyCells(newBoard) <= 1) {
        endReason = "Board is full";
      } else if (!xCanMove && !oCanMove) {
        endReason = "No valid moves left";
      } else if (!stillPointsPossible) {
        endReason = "No more points possible";
      }

      console.log(`🏁 Game ended: ${endReason}`);
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
      setStatusMessage("Player O's bonus turn");
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
    setStatusMessage(
      gameMode === "ai"
        ? nextPlayer === "X"
          ? "Your turn (X)"
          : "AI thinking..."
        : `Player ${nextPlayer}'s turn`
    );
  };

  const resetTotalScore = () => {
    setGameState((prev) => ({ ...prev, totalScore: { X: 0, O: 0 } }));
  };

  const getCellClass = (row: number, col: number) => {
    let classes =
      "w-20 h-20 bg-gray-600 border-2 border-black flex items-center justify-center text-2xl font-bold cursor-pointer hover:bg-gray-500 transition-colors";

    if (gameState.board[row][col] !== "") {
      classes += " cursor-not-allowed bg-gray-600";
    }

    const lastX = gameState.lastMove.X;
    const lastO = gameState.lastMove.O;

    if (lastX && lastX.row === row && lastX.col === col) {
      classes += " !bg-gray-800 text-white";
    }
    if (lastO && lastO.row === row && lastO.col === col) {
      classes += " !bg-gray-800 text-white";
    }

    return classes;
  };

  return (
    <div className="min-h-screen bg-[#0e1014] text-white">
      <div className="container mx-auto max-w-screen-md px-4 py-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-center mb-8 gap-4">
          <Link href="/">
            <Button
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-700 bg-transparent"
            >
              <Home className="mr-2 h-4 w-4" />
              Home
            </Button>
          </Link>
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-2">XXXo The Game</h1>
            <div className="flex items-center gap-4 justify-center">
              <Select
                value={gameMode}
                onValueChange={(value: "pvp" | "ai") => setGameMode(value)}
              >
                <SelectTrigger className="w-full sm:w-50 bg-gray-800 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  <SelectItem
                    value="pvp"
                    className="text-white hover:bg-gray-700"
                  >
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Player vs Player
                    </div>
                  </SelectItem>
                  <SelectItem
                    value="ai"
                    className="text-white hover:bg-gray-700"
                  >
                    <div className="flex items-center gap-2">
                      <Bot className="h-4 w-4" />
                      Player vs AI
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>

              {gameMode === "ai" && (
                <Select
                  value={aiDifficulty}
                  onValueChange={(value: "easy" | "medium" | "hard") =>
                    setAiDifficulty(value)
                  }
                >
                  <SelectTrigger className="w-full sm:w-50 bg-gray-800 border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-600">
                    <SelectItem
                      value="easy"
                      className="text-white hover:bg-gray-700"
                    >
                      Easy
                    </SelectItem>
                    <SelectItem
                      value="medium"
                      className="text-white hover:bg-gray-700"
                    >
                      Medium
                    </SelectItem>
                    <SelectItem
                      value="hard"
                      className="text-white hover:bg-gray-700"
                    >
                      Hard
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
          <Button
            onClick={initializeGame}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            New Game
          </Button>
        </div>

        <div className="flex flex-col gap-8">
          {/* Game Board */}
          <div className="w-full">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-center text-white">
                  {winner
                    ? winner
                    : isAiThinking
                    ? "AI is thinking..."
                    : statusMessage}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                {/* Overlay bij einde spel */}
                {winner && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center">
                    <div className="bg-black/80 border border-white/20 text-white rounded-xl px-12 py-5 shadow-xl text-center max-w-xs w-full">
                      <h2 className="text-xl font-semibold mb-4">{winner}</h2>
                      <Button
                        onClick={initializeGame}
                        className="w-full bg-blue-600 hover:bg-blue-700"
                      >
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Play Again
                      </Button>
                    </div>
                  </div>
                )}

                <div className="flex justify-center">
                  <div className="grid grid-cols-5 gap-2 w-full max-w-[90vw] sm:max-w-[400px] aspect-square">
                    {gameState.board.map((row, rowIndex) =>
                      row.map((cell, colIndex) => (
                        <button
                          key={`${rowIndex}-${colIndex}`}
                          className={`w-full h-full aspect-square text-base sm:text-xl flex items-center justify-center border border-gray-600 ${getCellClass(
                            rowIndex,
                            colIndex
                          )}`}
                          onClick={() => handleMove(rowIndex, colIndex)}
                          disabled={!gameState.gameActive || cell !== ""}
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

          {/* Score Panel */}
          <div className="w-full space-y-6">
            {/* Current Game Score */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Current Game</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Player X:</span>
                    <span className="text-white font-bold">
                      {gameState.score.X}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Player O:</span>
                    <span className="text-white font-bold">
                      {gameState.score.O}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Total Scoreboard */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Total Scoreboard</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Games Won - X:</span>
                    <span className="text-white font-bold">
                      {gameState.totalScore.X}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Games Won - O:</span>
                    <span className="text-white font-bold">
                      {gameState.totalScore.O}
                    </span>
                  </div>
                  <Button
                    onClick={resetTotalScore}
                    variant="outline"
                    className="w-full border-red-600 text-red-400 hover:bg-red-600 hover:text-white bg-transparent"
                  >
                    Reset Scoreboard
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Game Controls */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Game Controls</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={initializeGame}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  Start New Game
                </Button>
                <Link href="/rules" className="block">
                  <Button
                    variant="outline"
                    className="w-full border-blue-600 text-blue-400 hover:bg-blue-600 hover:text-white bg-transparent"
                  >
                    View Rules
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
