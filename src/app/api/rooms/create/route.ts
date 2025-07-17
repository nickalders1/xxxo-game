import { type NextRequest, NextResponse } from "next/server"
import { getUserFromToken } from "@/lib/auth"
import { createRoom } from "@/lib/rooms"

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const user = await getUserFromToken(token)
    if (!user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const room = await createRoom(user._id!.toString(), user.username)

    return NextResponse.json({
      success: true,
      room: {
        roomCode: room.roomCode,
        hostUsername: room.hostUsername,
        playerUsernames: room.playerUsernames,
        status: room.status,
      },
    })
  } catch (error) {
    console.error("Create room error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
