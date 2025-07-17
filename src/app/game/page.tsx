"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Home } from "lucide-react"

const BOARD_SIZE = 5

export default function GamePage() {
  const [gameState, setGameState] = useState({
    board: Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill("")),
    currentPlayer: "X",
    gameActive: true,
    score: { X: 0, O: 0 },
    lastMove: { X: null, O: null },
    pointLines: new Set(),
  })

  const [statusMessage, setStatusMessage] = useState("Player X's turn")

  const checkForPoints = (board, row, col, player, existingLines) => {
    const directions = [
      { r: 0, c: 1 },
      { r: 1, c: 0 },
      { r: 1, c: 1 },
      { r: 1, c: -1 },
    ]

    let totalPoints = 0
    const newLines = new Set()

    for (const { r, c } of directions) {
      let line = [{ row, col }]

      for (let i = 1; i < 5; i++) {
        const newRow = row - r * i
        const newCol = col - c * i
        if (
          newRow >= 0 &&
          newRow < BOARD_SIZE &&
          newCol >= 0 &&
          newCol < BOARD_SIZE &&
          board[newRow][newCol] === player
        ) {
          line.unshift({ row: newRow, col: newCol })
        } else break
      }

      for (let i = 1; i < 5; i++) {
        const newRow = row + r * i
        const newCol = col + c * i
        if (
          newRow >= 0 &&
          newRow < BOARD_SIZE &&
          newCol >= 0 &&
          newCol < BOARD_SIZE &&
          board[newRow][newCol] === player
        ) {
          line.push({ row: newRow, col: newCol })
        } else break
      }

      if (line.length >= 4) {
        const key = line.map(p => `${p.row},${p.col}`).sort().join("|")
        if (!existingLines.has(key)) {
          totalPoints += line.length === 5 ? 2 : 1
          newLines.add(key)
        }
      }
    }

    return { totalPoints, newLines }
  }

  const handleMove = (row: number, col: number) => {
    if (!gameState.gameActive || gameState.board[row][col] !== "") return

    const newBoard = gameState.board.map(r => [...r])
    newBoard[row][col] = gameState.currentPlayer

    const { totalPoints, newLines } = checkForPoints(
      newBoard,
      row,
      col,
      gameState.currentPlayer,
      gameState.pointLines
    )

    const updatedPointLines = new Set(gameState.pointLines)
    newLines.forEach(line => updatedPointLines.add(line))

    const newScore = { ...gameState.score }
    newScore[gameState.currentPlayer] += totalPoints

    const newLastMove = { ...gameState.lastMove, [gameState.currentPlayer]: { row, col } }
    const nextPlayer = gameState.currentPlayer === "X" ? "O" : "X"

    setGameState(prev => ({
      ...prev,
      board: newBoard,
      score: newScore,
      lastMove: newLastMove,
      currentPlayer: nextPlayer,
      pointLines: updatedPointLines,
    }))

    setStatusMessage(`Player ${nextPlayer}'s turn`)
  }

  const getCellClass = (row: number, col: number) => {
    const last = gameState.lastMove[gameState.board[row][col]]
    const isLastMove = last?.row === row && last?.col === col
    return `w-16 h-16 bg-gray-600 text-2xl font-bold ${isLastMove ? "!bg-gray-800 text-white" : ""}`
  }

  const resetGame = () => {
    setGameState({
      board: Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill("")),
      currentPlayer: "X",
      gameActive: true,
      score: { X: 0, O: 0 },
      lastMove: { X: null, O: null },
      pointLines: new Set(),
    })
    setStatusMessage("Player X's turn")
  }

  return (
    <div className="min-h-screen p-6 text-white bg-[#0e1014]">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">XXXo The Game</h1>
        <Link href="/">
          <Button variant="outline">
            <Home className="mr-2 h-4 w-4" />
            Home
          </Button>
        </Link>
      </div>

      <p className="mb-4">{statusMessage}</p>

      <div className="grid grid-cols-5 gap-2">
        {gameState.board.map((row, rowIndex) =>
          row.map((cell, colIndex) => (
            <button
              key={`${rowIndex}-${colIndex}`}
              className={getCellClass(rowIndex, colIndex)}
              onClick={() => handleMove(rowIndex, colIndex)}
              disabled={!gameState.gameActive || cell !== ""}
            >
              {cell}
            </button>
          ))
        )}
      </div>

      <div className="mt-4 space-y-2">
        <p>Player X: {gameState.score.X}</p>
        <p>Player O: {gameState.score.O}</p>
        <Button onClick={resetGame} className="mt-4 bg-blue-600 hover:bg-blue-700">
          New Game
        </Button>
      </div>
    </div>
  )
}
