export interface User {
  _id?: string
  username: string
  email: string
  password: string
  createdAt: Date
  stats: {
    gamesPlayed: number
    gamesWon: number
    totalScore: number
  }
}

export interface Room {
  _id?: string
  roomCode: string
  hostId: string
  hostUsername: string
  playerIds: string[]
  playerUsernames: string[]
  status: "waiting" | "playing" | "finished"
  maxPlayers: number
  createdAt: Date
  gameState?: GameState
}

export interface GameState {
  board: string[][]
  currentPlayer: "X" | "O"
  gameActive: boolean
  score: { X: number; O: number }
  lastMove: {
    X: { row: number; col: number } | null
    O: { row: number; col: number } | null
  }
  bonusTurn: boolean
  players: {
    X: { id: string; username: string }
    O: { id: string; username: string }
  }
}

export interface GameMove {
  roomCode: string
  playerId: string
  row: number
  col: number
  timestamp: Date
}
