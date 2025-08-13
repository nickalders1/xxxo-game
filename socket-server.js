const { createServer } = require("http");
const { Server } = require("socket.io");

const port = process.env.SOCKET_PORT || 3001;
const BOARD_SIZE = 5;

// Game state management
const games = new Map();
const playerQueue = [];
const connectedPlayers = new Map();

class Game {
  constructor(id, player1, player2) {
    this.id = id;
    this.players = {
      X: { id: player1.id, name: player1.name, symbol: "X" },
      O: { id: player2.id, name: player2.name, symbol: "O" },
    };
    this.gameState = {
      board: Array(BOARD_SIZE)
        .fill(null)
        .map(() => Array(BOARD_SIZE).fill("")),
      currentPlayer: "X",
      gameActive: true,
      score: { X: 0, O: 0 },
      lastMove: { X: null, O: null },
      bonusTurn: false,
    };
    this.status = "active";
    this.winner = null;
    this.createdAt = new Date();
  }

  getPlayerBySocketId(socketId) {
    if (this.players.X.id === socketId) return this.players.X;
    if (this.players.O.id === socketId) return this.players.O;
    return null;
  }

  isPlayerTurn(socketId) {
    const player = this.getPlayerBySocketId(socketId);
    return player && player.symbol === this.gameState.currentPlayer;
  }
}

// Game logic functions
function isNextToLastMove(row, col, player, lastMove) {
  const last = lastMove[player];
  if (!last) return false;
  return Math.abs(row - last.row) <= 1 && Math.abs(col - last.col) <= 1;
}

// SUPER SIMPLE scoring - find all unique lines and score them
function calculateTotalScore(board, player) {
  const directions = [
    { r: 0, c: 1 }, // horizontal
    { r: 1, c: 0 }, // vertical
    { r: 1, c: 1 }, // diagonal \
    { r: 1, c: -1 }, // diagonal /
  ];

  const uniqueLines = new Set();
  let totalScore = 0;

  // Check every possible starting position
  for (let startRow = 0; startRow < BOARD_SIZE; startRow++) {
    for (let startCol = 0; startCol < BOARD_SIZE; startCol++) {
      for (const { r, c } of directions) {
        // Count consecutive pieces from this starting position
        let count = 0;
        let row = startRow;
        let col = startCol;
        const positions = [];

        while (
          row >= 0 &&
          row < BOARD_SIZE &&
          col >= 0 &&
          col < BOARD_SIZE &&
          board[row][col] === player
        ) {
          count++;
          positions.push(`${row},${col}`);
          row += r;
          col += c;
        }

        // Only score lines of 4+ pieces
        if (count >= 4) {
          // Create unique identifier for this line
          const lineId = `${r},${c}:${positions.sort().join("-")}`;

          if (!uniqueLines.has(lineId)) {
            uniqueLines.add(lineId);

            if (count >= 5) {
              totalScore += 2; // 2 points for 5+ in a row
            } else {
              totalScore += 1; // 1 point for exactly 4 in a row
            }
          }
        }
      }
    }
  }

  return totalScore;
}

function hasValidMove(board, player, lastMove) {
  const last = lastMove[player];
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
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

function countEmptyCells(board) {
  let count = 0;
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (board[row][col] === "") count++;
    }
  }
  return count;
}

function anyPotentialPoints(board, lastMove) {
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
        const newScore = calculateTotalScore(testBoard, player);
        const currentScore = calculateTotalScore(board, player);

        if (newScore > currentScore) return true;
      }
    }
  }
  return false;
}

function generateGameId() {
  return Math.random().toString(36).substring(2, 15);
}

function findMatch(player) {
  const availablePlayer = playerQueue.find((p) => p.id !== player.id);
  if (availablePlayer) {
    playerQueue.splice(playerQueue.indexOf(availablePlayer), 1);
    return availablePlayer;
  }
  return null;
}

function updateQueuePositions(io) {
  playerQueue.forEach((player, index) => {
    const socket = io.sockets.sockets.get(player.id);
    if (socket) {
      socket.emit("queue-update", {
        position: index + 1,
        estimatedWait: Math.max(5, (index + 1) * 10),
      });
    }
  });
}

// Create HTTP server and Socket.IO - Listen on all interfaces
const server = createServer();
const io = new Server(server, {
  cors: {
    origin: "*", // Allow all origins for development
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// All the socket event handlers
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);
  io.emit("online-count", { count: io.engine.clientsCount });

  socket.on("join-queue", ({ playerName }) => {
    console.log(`${playerName} trying to join queue`);
    const existingIndex = playerQueue.findIndex((p) => p.id === socket.id);
    if (existingIndex !== -1) {
      playerQueue.splice(existingIndex, 1);
    }

    const player = { id: socket.id, name: playerName };
    connectedPlayers.set(socket.id, player);

    const opponent = findMatch(player);

    if (opponent) {
      const gameId = generateGameId();
      const game = new Game(gameId, player, opponent);
      games.set(gameId, game);

      console.log(`Sending match-found to ${player.name} (${player.id})`);
      socket.emit("match-found", { gameId });

      const opponentSocket = io.sockets.sockets.get(opponent.id);
      if (opponentSocket) {
        console.log(`Sending match-found to ${opponent.name} (${opponent.id})`);
        opponentSocket.emit("match-found", { gameId });
      }

      console.log(
        `Match created: ${player.name} vs ${opponent.name} (Game: ${gameId})`
      );
    } else {
      playerQueue.push(player);
      socket.emit("queue-joined", {
        position: playerQueue.length,
        estimatedWait: Math.max(5, playerQueue.length * 10),
      });

      console.log(
        `${playerName} joined queue (position: ${playerQueue.length})`
      );
    }

    updateQueuePositions(io);
  });

  socket.on("leave-queue", () => {
    const playerIndex = playerQueue.findIndex((p) => p.id === socket.id);
    if (playerIndex !== -1) {
      playerQueue.splice(playerIndex, 1);
      socket.emit("queue-left");
      updateQueuePositions(io);
      console.log("Player left queue:", socket.id);
    }
  });

  socket.on("join-game", ({ gameId, playerName }) => {
    console.log(`${playerName} trying to join game ${gameId}`);
    const game = games.get(gameId);
    if (!game) {
      console.log(`Game ${gameId} not found`);
      socket.emit("error", { message: "Game not found" });
      return;
    }

    // Find player by name instead of socket ID (since socket ID might have changed)
    let player = null;
    if (game.players.X.name === playerName) {
      player = game.players.X;
      // Update socket ID
      game.players.X.id = socket.id;
    } else if (game.players.O.name === playerName) {
      player = game.players.O;
      // Update socket ID
      game.players.O.id = socket.id;
    }

    if (!player) {
      console.log(`Player ${playerName} not found in game ${gameId}`);
      socket.emit("error", { message: "You are not part of this game" });
      return;
    }

    socket.join(gameId);
    socket.emit("game-joined", {
      game: {
        id: game.id,
        players: game.players,
        gameState: game.gameState,
        status: game.status,
        winner: game.winner,
      },
      yourSymbol: player.symbol,
    });

    console.log(
      `${playerName} successfully joined game ${gameId} as ${player.symbol}`
    );
  });

  socket.on("make-move", ({ gameId, row, col }) => {
    const game = games.get(gameId);
    if (!game || !game.isPlayerTurn(socket.id) || !game.gameState.gameActive) {
      return;
    }

    const { board, currentPlayer, lastMove } = game.gameState;

    if (
      board[row][col] !== "" ||
      isNextToLastMove(row, col, currentPlayer, lastMove)
    ) {
      socket.emit("error", { message: "Invalid move" });
      return;
    }

    const newBoard = board.map((row) => [...row]);
    newBoard[row][col] = currentPlayer;

    // Calculate new total scores for both players
    const newScoreX = calculateTotalScore(newBoard, "X");
    const newScoreO = calculateTotalScore(newBoard, "O");
    const newScore = { X: newScoreX, O: newScoreO };

    const newLastMove = { ...lastMove };
    newLastMove[currentPlayer] = { row, col };

    game.gameState.board = newBoard;
    game.gameState.score = newScore;
    game.gameState.lastMove = newLastMove;

    const xCanMove = hasValidMove(newBoard, "X", newLastMove);
    const oCanMove = hasValidMove(newBoard, "O", newLastMove);
    const stillPointsPossible = anyPotentialPoints(newBoard, newLastMove);

    if (game.gameState.bonusTurn && currentPlayer === "O") {
      game.gameState.bonusTurn = false;
      game.gameState.gameActive = false;
      game.status = "finished";
      game.winner =
        newScore.X > newScore.O ? "X" : newScore.O > newScore.X ? "O" : "tie";
      io.to(gameId).emit("game-ended", { game: game, winner: game.winner });
      return;
    }

    if (
      countEmptyCells(newBoard) <= 1 ||
      (!xCanMove && !oCanMove) ||
      !stillPointsPossible
    ) {
      game.gameState.gameActive = false;
      game.status = "finished";
      game.winner =
        newScore.X > newScore.O ? "X" : newScore.O > newScore.X ? "O" : "tie";
      io.to(gameId).emit("game-ended", { game: game, winner: game.winner });
      return;
    }

    if (currentPlayer === "X" && !xCanMove && oCanMove) {
      game.gameState.bonusTurn = true;
      game.gameState.currentPlayer = "O";
      io.to(gameId).emit("game-updated", { game: game });
      return;
    }

    if (currentPlayer === "X" && !oCanMove) {
      game.gameState.gameActive = false;
      game.status = "finished";
      game.winner =
        newScore.X > newScore.O ? "X" : newScore.O > newScore.X ? "O" : "tie";
      io.to(gameId).emit("game-ended", { game: game, winner: game.winner });
      return;
    }

    game.gameState.currentPlayer = currentPlayer === "X" ? "O" : "X";
    io.to(gameId).emit("game-updated", { game: game });
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);

    const playerIndex = playerQueue.findIndex((p) => p.id === socket.id);
    if (playerIndex !== -1) {
      playerQueue.splice(playerIndex, 1);
      updateQueuePositions(io);
    }

    const player = connectedPlayers.get(socket.id);
    if (player) {
      for (const [gameId, game] of games.entries()) {
        if (
          game.players.X.id === socket.id ||
          game.players.O.id === socket.id
        ) {
          socket
            .to(gameId)
            .emit("player-disconnected", { playerName: player.name });
          break;
        }
      }
      connectedPlayers.delete(socket.id);
    }

    setTimeout(() => {
      io.emit("online-count", { count: io.engine.clientsCount });
    }, 100);
  });
});

// Listen on all interfaces (0.0.0.0) instead of just localhost
server.listen(port, "0.0.0.0", (err) => {
  if (err) throw err;
  console.log(`> Socket.IO server ready on http://0.0.0.0:${port}`);
  console.log(`> Accessible from external domains`);
});
