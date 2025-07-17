import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { hashPassword, generateToken } from "@/lib/auth"
import type { User } from "@/types/database"

export async function POST(request: NextRequest) {
  try {
    const { username, email, password } = await request.json()

    if (!username || !email || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const db = await getDatabase()

    // Check if user already exists
    const existingUser = await db.collection<User>("users").findOne({
      $or: [{ email }, { username }],
    })

    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 })
    }

    // Create new user
    const hashedPassword = await hashPassword(password)
    const newUser: User = {
      username,
      email,
      password: hashedPassword,
      createdAt: new Date(),
      stats: {
        gamesPlayed: 0,
        gamesWon: 0,
        totalScore: 0,
      },
    }

    const result = await db.collection<User>("users").insertOne(newUser)
    const token = generateToken(result.insertedId.toString())

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: result.insertedId.toString(),
        username,
        email,
        stats: newUser.stats,
      },
    })
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
