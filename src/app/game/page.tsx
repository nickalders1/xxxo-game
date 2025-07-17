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

type Coord = { row: number; col: number };

interface GameState {
  board: string[][];
  currentPlayer: "X" | "O";
  gameActive: boolean;
  score: { X: number; O: number };
  lastMove: { X: Coord | null; O: Coord | null };
  bonusTurn: boolean;
  totalScore: { X: number; O: number };
  countedLines: Set<string>;
}

export default function GamePage() {
  const [gameState, setGameState] = useState<GameState>({
    board: Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill("")),
    currentPlayer: "X",
    gameActive: true,
    score: { X: 0, O: 0 },
    lastMove: { X: null, O: null },
    bonusTurn: false,
    totalScore: { X: 0, O: 0 },
    countedLines: new Set(),
  });

  const [statusMessage, setStatusMessage] = useState("Player X's turn");

  const directions = [
    { r: 0, c: 1 },
    { r: 1, c: 0 },
    { r: 1, c: 1 },
    { r: 1, c: -1 },
  ];

  const getLineKey = (line: Coord[]) =>
    line.map((p) => `${p.row},${p.col}`).join("-");

  const checkForPoints = (
    board: string[][],
    row: number,
    col: number,
    player: string,
    countedLines: Set<string>
  ) => {
    let totalPoints = 0;

    for (const { r, c } of directions) {
      let line = [{ row, col }];

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

      if (line.length >= 4) {
        const key = getLineKey(line.slice(0, 5));
        if (!countedLines.has(key)) {
          if (line.length === 4) totalPoints += 1;
          else if (line.length === 5) totalPoints += 2;
          countedLines.add(key);
        }
      }
    }

    return totalPoints;
  };

  const handleMove = (row: number, col: number) => {
    if (!gameState.gameActive || gameState.board[row][col] !== "") return;

    const newBoard = gameState.board.map((r) => [...r]);
    newBoard[row][col] = gameState.currentPlayer;

    const newLastMove = { ...gameState.lastMove };
    newLastMove[gameState.currentPlayer] = { row, col };

    const newCountedLines = new Set(gameState.countedLines);
    const points = checkForPoints(
      newBoard,
      row,
      col,
      gameState.currentPlayer,
      newCountedLines
    );

    const newScore = { ...gameState.score };
    newScore[gameState.currentPlayer] += points;

    const nextPlayer = gameState.currentPlayer === "X" ? "O" : "X";

    const empty = newBoard.flat().filter((c) => c === "").length;

    const shouldEnd = empty <= 1;

    if (shouldEnd) {
      const winner =
        newScore.X > newScore.O
          ? "Player X wins!"
          : newScore.O > newScore.X
          ? "Player O wins!"
          : "Draw!";
      setStatusMessage(winner);
      return setGameState((prev) => ({
        ...prev,
        board: newBoard,
        score: newScore,
        lastMove: newLastMove,
        gameActive: false,
        countedLines: newCountedLines,
      }));
    }

    setGameState((prev) => ({
      ...prev,
      board: newBoard,
      score: newScore,
      lastMove: newLastMove,
      currentPlayer: nextPlayer,
      countedLines: newCountedLines,
    }));
    setStatusMessage(`Player ${nextPlayer}'s turn`);
  };

  const initializeGame = () => {
    setGameState({
      board: Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill("")),
      currentPlayer: "X",
      gameActive: true,
      score: { X: 0, O: 0 },
      lastMove: { X: null, O: null },
      bonusTurn: false,
      totalScore: { X: 0, O: 0 },
      countedLines: new Set(),
    });
    setStatusMessage("Player X's turn");
  };

  return (
    <div className="min-h-screen bg-[#0e1014] text-white p-4">
      <div className="max-w-screen-md mx-auto">
        <h1 className="text-3xl font-bold mb-4">XXXo The Game</h1>
        <p className="mb-4">{statusMessage}</p>
        <div className="grid grid-cols-5 gap-2 w-full max-w-[400px] aspect-square mx-auto mb-4">
          {gameState.board.map((row, rowIndex) =>
            row.map((cell, colIndex) => (
              <button
                key={`${rowIndex}-${colIndex}`}
                className="w-full h-full bg-gray-600 text-white flex items-center justify-center text-xl font-bold"
                onClick={() => handleMove(rowIndex, colIndex)}
              >
                {cell}
              </button>
            ))
          )}
        </div>
        <div className="flex justify-between items-center">
          <span>Player X: {gameState.score.X}</span>
          <span>Player O: {gameState.score.O}</span>
          <Button onClick={initializeGame}>New Game</Button>
        </div>
      </div>
    </div>
  );
}
