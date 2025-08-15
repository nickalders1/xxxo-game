import { type NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import type { GameState } from "@/types/database";

// Corrected game logic based on single player
function makeMove(
  gameState: GameState,
  row: number,
  col: number,
  player: "X" | "O"
) {
  const newBoard = gameState.board.map((r) => [...r]);
  newBoard[row][col] = player;

  // Check for points using the correct logic (with old board for comparison)
  const points = checkForPoints(newBoard, row, col, player, gameState.board);

  const newScore = { ...gameState.score };
  newScore[player] += points;

  const newLastMove = { ...gameState.lastMove };
  newLastMove[player] = { row, col };

  // Handle bonus turn logic exactly like single player
  if (gameState.bonusTurn && player === "O") {
    // If this was O's bonus turn, end the game
    const updatedGameState: GameState = {
      ...gameState,
      board: newBoard,
      score: newScore,
      lastMove: newLastMove,
      bonusTurn: false,
      gameActive: false,
    };

    let winner = null;
    if (newScore.X > newScore.O) winner = "X";
    else if (newScore.O > newScore.X) winner = "O";
    else winner = "tie";

    return {
      gameState: updatedGameState,
      gameEnded: true,
      winner,
      moveResult: { points },
    };
  }

  // Check move possibilities
  const xCanMove = hasValidMove(newBoard, "X", newLastMove);
  const oCanMove = hasValidMove(newBoard, "O", newLastMove);
  const stillPointsPossible = anyPotentialPoints(newBoard, newLastMove);

  console.log("🎮 Game state check:", {
    emptyCells: countEmptyCells(newBoard),
    xCanMove,
    oCanMove,
    stillPointsPossible,
    currentPlayer: player,
    bonusTurn: gameState.bonusTurn,
  });

  // Check if game should end
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

    const updatedGameState: GameState = {
      ...gameState,
      board: newBoard,
      score: newScore,
      lastMove: newLastMove,
      gameActive: false,
      bonusTurn: false,
    };

    let winner = null;
    if (newScore.X > newScore.O) winner = "X";
    else if (newScore.O > newScore.X) winner = "O";
    else winner = "tie";

    return {
      gameState: updatedGameState,
      gameEnded: true,
      winner,
      moveResult: { points },
    };
  }

  // Handle bonus turn scenarios (from single player logic)
  if (player === "X" && !xCanMove && oCanMove) {
    console.log("🎯 X can't move, O gets bonus turn");
    const updatedGameState: GameState = {
      ...gameState,
      board: newBoard,
      score: newScore,
      lastMove: newLastMove,
      bonusTurn: true,
      currentPlayer: "O",
      gameActive: true,
    };

    return {
      gameState: updatedGameState,
      gameEnded: false,
      winner: null,
      moveResult: { points },
    };
  }

  if (player === "X" && !oCanMove) {
    console.log("🏁 O can't move, game ends");
    const updatedGameState: GameState = {
      ...gameState,
      board: newBoard,
      score: newScore,
      lastMove: newLastMove,
      gameActive: false,
      bonusTurn: false,
    };

    let winner = null;
    if (newScore.X > newScore.O) winner = "X";
    else if (newScore.O > newScore.X) winner = "O";
    else winner = "tie";

    return {
      gameState: updatedGameState,
      gameEnded: true,
      winner,
      moveResult: { points },
    };
  }

  // Normal turn progression
  const nextPlayer = player === "X" ? "O" : "X";
  const updatedGameState: GameState = {
    ...gameState,
    board: newBoard,
    score: newScore,
    lastMove: newLastMove,
    currentPlayer: nextPlayer,
    gameActive: true,
    bonusTurn: false,
  };

  return {
    gameState: updatedGameState,
    gameEnded: false,
    winner: null,
    moveResult: { points },
  };
}

// Corrected point calculation with old board comparison
function checkForPoints(
  board: string[][],
  row: number,
  col: number,
  player: string,
  oldBoard: string[][]
): number {
  const directions = [
    { r: 0, c: 1 },
    { r: 1, c: 0 },
    { r: 1, c: 1 },
    { r: 1, c: -1 },
  ];

  let totalPoints = 0;

  for (const { r, c } of directions) {
    const line = [{ row, col }];

    // Check achteruit
    for (let i = 1; i < 5; i++) {
      const newRow = row - r * i;
      const newCol = col - c * i;
      if (
        newRow >= 0 &&
        newRow < 5 &&
        newCol >= 0 &&
        newCol < 5 &&
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
        newRow < 5 &&
        newCol >= 0 &&
        newCol < 5 &&
        board[newRow][newCol] === player
      ) {
        line.push({ row: newRow, col: newCol });
      } else break;
    }

    // Check if this was already a 4-in-a-row before this move
    if (line.length === 4) {
      totalPoints += 1;
    } else if (line.length === 5) {
      // Check if this was already a 4-in-a-row that got extended
      const wasAlready4 = checkWasAlready4InRow(
        oldBoard,
        line,
        player,
        row,
        col
      );
      if (wasAlready4) {
        totalPoints += 1; // Only +1 for extending 4 to 5
      } else {
        totalPoints += 2; // Full 2 points for new 5-in-a-row
      }
    }
  }

  return totalPoints;
}

// Check if this 5-in-a-row was already a 4-in-a-row before
function checkWasAlready4InRow(
  oldBoard: string[][],
  line: any[],
  player: string,
  newRow: number,
  newCol: number
): boolean {
  // Remove the new move from the line
  const lineWithoutNewMove = line.filter(
    (pos) => !(pos.row === newRow && pos.col === newCol)
  );

  // Check if the remaining positions were already a 4-in-a-row
  return (
    lineWithoutNewMove.length >= 4 &&
    lineWithoutNewMove.every((pos) => oldBoard[pos.row][pos.col] === player)
  );
}

// Helper functions remain the same
function countEmptyCells(board: string[][]): number {
  let count = 0;
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 5; col++) {
      if (board[row][col] === "") count++;
    }
  }
  return count;
}

function hasValidMove(
  board: string[][],
  player: "X" | "O",
  lastMove: any
): boolean {
  const last = lastMove[player];
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 5; col++) {
      if (
        board[row][col] === "" &&
        (!last || Math.abs(row - last.row) > 1 || Math.abs(col - last.col) > 1)
      ) {
        return true;
      }
    }
  }
  return false;
}

function anyPotentialPoints(board: string[][], lastMove: any): boolean {
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
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 5; col++) {
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
        const directPoints = checkForPoints(testBoard, row, col, player, board);

        if (directPoints > 0) {
          console.log(
            `✅ Player ${player} can score ${directPoints} points directly at (${row}, ${col})`
          );
          return true;
        }

        // Check ook voor potentiële lijnen
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
                checkRow < 5 &&
                checkCol >= 0 &&
                checkCol < 5
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
}
