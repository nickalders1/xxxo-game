import { nanoid } from "nanoid"
import { getDatabase } from "./mongodb"
import type { Room, GameState } from "@/types/database"

export function generateRoomCode(): string {
  return nanoid(6).toUpperCase()
}

export async function createRoom(hostId: string, hostUsername: string): Promise<Room> {
  const db = await getDatabase()

  const room: Room = {
    roomCode: generateRoomCode(),
    hostId,
    hostUsername,
    playerIds: [hostId],
    playerUsernames: [hostUsername],
    status: "waiting",
    maxPlayers: 2,
    createdAt: new Date(),
  }

  await db.collection<Room>("rooms").insertOne(room)
  return room
}

export async function joinRoom(roomCode: string, playerId: string, playerUsername: string): Promise<Room | null> {
  const db = await getDatabase()

  const room = await db.collection<Room>("rooms").findOne({ roomCode })
  if (!room || room.playerIds.length >= room.maxPlayers || room.status !== "waiting") {
    return null
  }

  const updatedRoom = await db.collection<Room>("rooms").findOneAndUpdate(
    { roomCode },
    {
      $push: {
        playerIds: playerId,
        playerUsernames: playerUsername,
      },
    },
    { returnDocument: "after" },
  )

  return updatedRoom || null
}

export async function startGame(roomCode: string): Promise<GameState | null> {
  const db = await getDatabase()

  const room = await db.collection<Room>("rooms").findOne({ roomCode })
  if (!room || room.playerIds.length !== 2) return null

  const gameState: GameState = {
    board: Array(5)
      .fill(null)
      .map(() => Array(5).fill("")),
    currentPlayer: "X",
    gameActive: true,
    score: { X: 0, O: 0 },
    lastMove: { X: null, O: null },
    bonusTurn: false,
    players: {
      X: { id: room.playerIds[0], username: room.playerUsernames[0] },
      O: { id: room.playerIds[1], username: room.playerUsernames[1] },
    },
  }

  await db.collection<Room>("rooms").updateOne(
    { roomCode },
    {
      $set: {
        status: "playing",
        gameState,
      },
    },
  )

  return gameState
}
