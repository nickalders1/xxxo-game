import { type NextRequest, NextResponse } from "next/server"
import { getUserFromToken } from "@/lib/auth"
import { getDatabase } from "@/lib/mongodb"
import type { Room } from "@/types/database"

export async function POST(request: NextRequest) {
  try {
    const { roomCode } = await request.json()

    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const user = await getUserFromToken(token)
    if (!user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    if (!roomCode) {
      return NextResponse.json({ error: "Room code required" }, { status: 400 })
    }

    const db = await getDatabase()

    // Find the room
    const room = await db.collection<Room>("rooms").findOne({ roomCode })
    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 })
    }

    // Check if room is full or not waiting
    if (room.playerIds.length >= room.maxPlayers) {
      return NextResponse.json({ error: "Room is full" }, { status: 400 })
    }

    if (room.status !== "waiting") {
      return NextResponse.json({ error: "Room is not accepting new players" }, { status: 400 })
    }

    // Check if user is already in the room
    if (room.playerIds.includes(user._id!.toString())) {
      return NextResponse.json({ error: "You are already in this room" }, { status: 400 })
    }

    // Add player to room
    const updatedRoom = await db.collection<Room>("rooms").findOneAndUpdate(
      { roomCode },
      {
        $push: {
          playerIds: user._id!.toString(),
          playerUsernames: user.username,
        },
      },
      { returnDocument: "after" },
    )

    if (!updatedRoom) {
      return NextResponse.json({ error: "Failed to join room" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      room: {
        roomCode: updatedRoom.roomCode,
        hostUsername: updatedRoom.hostUsername,
        playerUsernames: updatedRoom.playerUsernames,
        status: updatedRoom.status,
      },
    })
  } catch (error) {
    console.error("Join room error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
