import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import type { Room } from "@/types/database"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const roomCode = searchParams.get("roomCode")

    if (!roomCode) {
      return NextResponse.json({ error: "Room code required" }, { status: 400 })
    }

    const db = await getDatabase()
    const room = await db.collection<Room>("rooms").findOne({ roomCode })

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      room: {
        roomCode: room.roomCode,
        hostUsername: room.hostUsername,
        playerUsernames: room.playerUsernames,
        status: room.status,
        gameState: room.gameState,
      },
    })
  } catch (error) {
    console.error("Room status error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
