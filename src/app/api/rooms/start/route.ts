import { type NextRequest, NextResponse } from "next/server"
import { startGame } from "@/lib/rooms"

export async function POST(request: NextRequest) {
  try {
    const { roomCode } = await request.json()

    if (!roomCode) {
      return NextResponse.json({ error: "Room code required" }, { status: 400 })
    }

    const gameState = await startGame(roomCode)
    if (!gameState) {
      return NextResponse.json({ error: "Failed to start game" }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      roomCode,
      gameState,
    })
  } catch (error) {
    console.error("Start game error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
