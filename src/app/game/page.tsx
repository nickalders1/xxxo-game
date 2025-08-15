"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
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

type Move = { row: number; col: number };
type Mode = "local" | "ai";
type Difficulty = "easy" | "medium" | "hard";

function GameContent() {
  const searchParams = useSearchParams();

  // ✅ Typesafe en SSR-proof uitlezen
  const mode: Mode = useMemo(() => {
    const m = searchParams?.get("mode");
    return m === "ai" ? "ai" : "local";
  }, [searchParams]);

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
  const [aiDifficulty, setAiDifficulty] = useState<Difficulty>("medium");
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [gameStats, setGameStats] = useState({ X: 0, O: 0, ties: 0 });
  const [moveCount, setMoveCount] = useState(0);

  useEffect(() => {
    if (
      mode === "ai" &&
      gameState.currentPlayer === "O" &&
      gameState.gameActive &&
      !isAiThinking
    ) {
      makeAiMove();
    }
  }, [
    gameState.currentPlayer,
    gameState.gameActive,
    mode,
    isAiThinking,
    aiDifficulty,
  ]);

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
    setMoveCount(0);
  };

  const isNextToLastMove = (row: number, col: number, player: "X" | "O") => {
    const last = gameState.lastMove[player];
    if (!last) return false;
    return Math.abs(row - last.row) <= 1 && Math.abs(col - last.col) <= 1;
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

    for (const { r: dirR, c: dirC } of directions) {
      let forward = 0;
      for (let i = 1; i < 5; i++) {
        const nr = row + dirR * i;
        const nc = col + dirC * i;
        if (nr < 0 || nr >= BOARD_SIZE || nc < 0 || nc >= BOARD_SIZE) break;
        if (board[nr][nc] !== player) break;
        forward++;
      }
      let backward = 0;
      for (let i = 1; i < 5; i++) {
        const nr = row - dirR * i;
        const nc = col - dirC * i;
        if (nr < 0 || nr >= BOARD_SIZE || nc < 0 || nc >= BOARD_SIZE) break;
        if (board[nr][nc] !== player) break;
        backward++;
      }
      const count = 1 + forward + backward;
      const beforeMax = Math.max(forward, backward);
      if (count >= 5) {
        if (beforeMax >= 5) {
          // do nothing
        } else if (beforeMax === 4) {
          totalPoints += 1;
        } else {
          totalPoints += 2;
        }
      } else if (count === 4) {
        if (beforeMax >= 4) {
          // do nothing
        } else {
          totalPoints += 1;
        }
      }
    }
    return totalPoints;
  };

  const hasValidMove = (
    board: string[][],
    player: "X" | "O",
    lastMove: GameState["lastMove"]
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

  const anyPotentialPoints = (board: string[][]) => {
    const dirs = [
      { r: 0, c: 1 },
      { r: 1, c: 0 },
      { r: 1, c: 1 },
      { r: 1, c: -1 },
    ];
    const inBounds = (r: number, c: number) =>
      r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE;

    for (const { r: dr, c: dc } of dirs) {
      for (let sr = 0; sr < BOARD_SIZE; sr++) {
        for (let sc = 0; sc < BOARD_SIZE; sc++) {
          const er4r = sr + dr * 3;
          const er4c = sc + dc * 3;
          if (inBounds(er4r, er4c)) {
            let hasX = false,
              hasO = false,
              hasEmpty = false;
            for (let i = 0; i < 4; i++) {
              const v = board[sr + dr * i][sc + dc * i];
              if (v === "X") hasX = true;
              else if (v === "O") hasO = true;
              else hasEmpty = true;
            }
            if (hasEmpty && (!hasO || !hasX)) return true;
          }

          const er5r = sr + dr * 4;
          const er5c = sc + dc * 4;
          if (inBounds(er5r, er5c)) {
            let hasX = false,
              hasO = false,
              hasEmpty = false;
            for (let i = 0; i < 5; i++) {
              const v = board[sr + dr * i][sc + dc * i];
              if (v === "X") hasX = true;
              else if (v === "O") hasO = true;
              else hasEmpty = true;
            }
            if (hasEmpty && (!hasO || !hasX)) return true;
          }
        }
      }
    }
    return false;
  };

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
          if (opponentCount === 0 && playerCount > 0)
            score += playerCount * playerCount;
          if (playerCount === 0 && opponentCount > 0)
            score -= opponentCount * opponentCount;
        }
      }
    }
    return score;
  };

  const getValidMoves = (
    board: string[][],
    player: "X" | "O",
    lastMove: GameState["lastMove"]
  ) => {
    const validMoves: Move[] = [];
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

  const cloneBoard = (board: string[][]) => board.map((r) => [...r]);
  const opponentOf = (p: "X" | "O") => (p === "X" ? "O" : "X");

  const evalBoardForO = (
    board: string[][],
    score: { X: number; O: number },
    lastMove: GameState["lastMove"]
  ) => {
    const scoreDiff = (score.O - score.X) * 120;
    const patternDiff =
      evaluatePosition(board, "O") - evaluatePosition(board, "X");
    const mobility =
      getValidMoves(board, "O", lastMove).length -
      getValidMoves(board, "X", lastMove).length;
    return scoreDiff + patternDiff + mobility * 2;
  };

  const terminalAfter = (
    board: string[][],
    score: { X: number; O: number },
    lastMove: GameState["lastMove"]
  ) => {
    const xCanMove = hasValidMove(board, "X", lastMove);
    const oCanMove = hasValidMove(board, "O", lastMove);
    const stillPoints = anyPotentialPoints(board);
    const empty = countEmptyCells(board);
    if (empty <= 1 || (!xCanMove && !oCanMove) || !stillPoints) {
      if (score.X > score.O) return { done: true, value: -99999 };
      if (score.O > score.X) return { done: true, value: 99999 };
      return { done: true, value: 0 };
    }
    return { done: false, value: 0 };
  };

  const minimax = (
    board: string[][],
    lastMove: GameState["lastMove"],
    score: { X: number; O: number },
    current: "X" | "O",
    depth: number,
    alpha: number,
    beta: number
  ): { value: number; move?: Move } => {
    const term = terminalAfter(board, score, lastMove);
    if (term.done || depth === 0) {
      return {
        value: evalBoardForO(board, score, lastMove) + Math.random() * 0.5,
      };
    }
    if (current === "O") {
      let bestVal = -Infinity;
      let bestMove: Move | undefined;
      const moves = getValidMoves(board, "O", lastMove);
      for (const m of moves) {
        const nb = cloneBoard(board);
        nb[m.row][m.col] = "O";
        const pts = checkForPoints(nb, m.row, m.col, "O");
        const sc = { X: score.X, O: score.O + pts };
        const lm: GameState["lastMove"] = {
          ...lastMove,
          O: { row: m.row, col: m.col },
        };
        const res = minimax(nb, lm, sc, "X", depth - 1, alpha, beta);
        if (res.value > bestVal) {
          bestVal = res.value;
          bestMove = m;
        }
        alpha = Math.max(alpha, bestVal);
        if (beta <= alpha) break;
      }
      return { value: bestVal, move: bestMove };
    } else {
      let bestVal = Infinity;
      const moves = getValidMoves(board, "X", lastMove);
      for (const m of moves) {
        const nb = cloneBoard(board);
        nb[m.row][m.col] = "X";
        const pts = checkForPoints(nb, m.row, m.col, "X");
        const sc = { X: score.X + pts, O: score.O };
        const lm: GameState["lastMove"] = {
          ...lastMove,
          X: { row: m.row, col: m.col },
        };
        const res = minimax(nb, lm, sc, "O", depth - 1, alpha, beta);
        if (res.value < bestVal) {
          bestVal = res.value;
        }
        beta = Math.min(beta, bestVal);
        if (beta <= alpha) break;
      }
      return { value: bestVal };
    }
  };

  const centerBias = (m: Move) => {
    const cx = (BOARD_SIZE - 1) / 2;
    return -Math.abs(m.row - cx) - Math.abs(m.col - cx);
    // dichter bij het midden krijgt lichte voorkeur
  };

  const pickFromTop = (scored: { move: Move; score: number }[]) => {
    if (scored.length === 0) return null;
    scored.sort((a, b) => b.score - a.score);
    const best = scored[0].score;
    const band = scored.filter((s) => s.score >= best - 1.5);
    return band[Math.floor(Math.random() * band.length)].move;
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

        let chosen: Move | null = null;

        if (aiDifficulty === "easy") {
          const greedy = validMoves
            .map((m) => {
              const tb = cloneBoard(gameState.board);
              tb[m.row][m.col] = "O";
              const p = checkForPoints(tb, m.row, m.col, "O");
              return { move: m, score: p + Math.random() };
            })
            .filter((x) => x.score > 0);
          chosen =
            greedy.length > 0
              ? pickFromTop(greedy)
              : validMoves[Math.floor(Math.random() * validMoves.length)];
        } else if (aiDifficulty === "medium") {
          let scored: { move: Move; score: number }[] = [];
          for (const m of validMoves) {
            const tb = cloneBoard(gameState.board);
            tb[m.row][m.col] = "O";
            const gain = checkForPoints(tb, m.row, m.col, "O");
            const oppMoves = getValidMoves(tb, "X", {
              ...gameState.lastMove,
              O: { row: m.row, col: m.col },
            } as GameState["lastMove"]);
            let oppBest = 0;
            for (const om of oppMoves) {
              const t2 = cloneBoard(tb);
              t2[om.row][om.col] = "X";
              const opg = checkForPoints(t2, om.row, om.col, "X");
              if (opg > oppBest) oppBest = opg;
            }
            const score =
              gain * 120 -
              oppBest * 110 +
              (evaluatePosition(tb, "O") - evaluatePosition(tb, "X")) +
              centerBias(m) * 2 +
              Math.random();
            scored.push({ move: m, score });
          }
          chosen = pickFromTop(scored);
          if (!chosen)
            chosen = validMoves[Math.floor(Math.random() * validMoves.length)];
        } else {
          const res = minimax(
            gameState.board,
            gameState.lastMove,
            { ...gameState.score },
            "O",
            2,
            -Infinity,
            Infinity
          );
          if (res.move) chosen = res.move;
          if (!chosen) {
            const backup = validMoves.map((m) => {
              const tb = cloneBoard(gameState.board);
              tb[m.row][m.col] = "O";
              const sc =
                checkForPoints(tb, m.row, m.col, "O") * 120 +
                (evaluatePosition(tb, "O") - evaluatePosition(tb, "X")) +
                centerBias(m) +
                Math.random();
              return { move: m, score: sc };
            });
            chosen =
              pickFromTop(backup) ||
              validMoves[Math.floor(Math.random() * validMoves.length)];
          }
        }

        setIsAiThinking(false);
        if (chosen) handleMove(chosen.row, chosen.col);
      },
      aiDifficulty === "easy"
        ? 400
        : aiDifficulty === "medium"
        ? 800
        : 900 + Math.floor(Math.random() * 400)
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
        const msg =
          mode === "ai"
            ? "Jouw beurt (X)"
            : `Speler ${gameState.currentPlayer} is aan de beurt`;
        setStatusMessage(msg);
      }, 1200);
      return;
    }
    if (isNextToLastMove(row, col, gameState.currentPlayer)) {
      setStatusMessage("Je mag niet naast je laatste zet plaatsen!");
      setTimeout(() => {
        const msg =
          mode === "ai"
            ? "Jouw beurt (X)"
            : `Speler ${gameState.currentPlayer} is aan de beurt`;
        setStatusMessage(msg);
      }, 1200);
      return;
    }

    const newMoveCount = moveCount + 1;
    setMoveCount(newMoveCount);

    const newBoard = gameState.board.map((r) => [...r]);
    newBoard[row][col] = gameState.currentPlayer;

    const pointsGained = checkForPoints(
      newBoard,
      row,
      col,
      gameState.currentPlayer
    );
    const newScore = { ...gameState.score };
    newScore[gameState.currentPlayer] += pointsGained;

    const newLastMove: GameState["lastMove"] = { ...gameState.lastMove };
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
    const stillPointsPossible = anyPotentialPoints(newBoard);

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
      classes +=
        cell === "X" ? " bg-purple-500 text-white" : " bg-pink-500 text-white";
    }

    const lastX = gameState.lastMove.X;
    const lastO = gameState.lastMove.O;
    if (lastX && lastX.row === row && lastX.col === col)
      classes += " ring-2 ring-purple-300";
    if (lastO && lastO.row === row && lastO.col === col)
      classes += " ring-2 ring-pink-300";
    return classes;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-4 sm:py-8">
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
              <span>• Zet #{moveCount}</span>
              {mode === "ai" && (
                <>
                  <span>•</span>
                  <Select
                    value={aiDifficulty}
                    onValueChange={(value) =>
                      setAiDifficulty((value as Difficulty) ?? "medium")
                    }
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
          <div className="lg:col-span-3">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="pb-4">
                <CardTitle className="text-center text-white text-lg sm:text-xl">
                  {winner
                    ? (winner as string)
                    : isAiThinking
                    ? "AI denkt na..."
                    : statusMessage}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="relative">
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

          <div className="space-y-4">
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
