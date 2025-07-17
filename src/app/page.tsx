"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Play, BookOpen, Trophy, Users } from "lucide-react"
import AuthForm from "@/components/auth-form"
import RoomManager from "@/components/room-manager"
import MultiplayerGame from "@/components/multiplayer-game"

export default function HomePage() {
  const [user, setUser] = useState<any>(null)
  const [token, setToken] = useState<string>("")
  const [gameRoom, setGameRoom] = useState<string>("")
  const [gameState, setGameState] = useState<any>(null)
  const [showRoomManager, setShowRoomManager] = useState(false)

  useEffect(() => {
    // Check for existing auth
    const savedToken = localStorage.getItem("token")
    const savedUser = localStorage.getItem("user")

    if (savedToken && savedUser) {
      setToken(savedToken)
      setUser(JSON.parse(savedUser))
    }
  }, [])

  const handleAuthSuccess = (newToken: string, newUser: any) => {
    setToken(newToken)
    setUser(newUser)
  }

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    setToken("")
    setUser(null)
    setGameRoom("")
    setGameState(null)
    setShowRoomManager(false)
  }

  const handleMultiplayerClick = () => {
    setShowRoomManager(true)
  }

  const handleGameStart = (roomCode: string, initialGameState?: any) => {
    console.log("Game starting:", { roomCode, initialGameState })
    setGameRoom(roomCode)
    setGameState(initialGameState)
  }

  const handleBackToMenu = () => {
    setShowRoomManager(false)
    setGameRoom("")
    setGameState(null)
  }

  // Show auth form if not logged in
  if (!user || !token) {
    return <AuthForm onAuthSuccess={handleAuthSuccess} />
  }

  // Show multiplayer game if game is active
  if (gameRoom && gameState && gameState.players && gameState.players.X && gameState.players.O) {
    return (
      <MultiplayerGame
        user={user}
        token={token}
        roomCode={gameRoom}
        initialGameState={gameState}
        onBackToMenu={handleBackToMenu}
        onLogout={handleLogout}
      />
    )
  }

  // Show room manager if user clicked multiplayer
  if (showRoomManager) {
    return (
      <RoomManager
        user={user}
        token={token}
        onGameStart={handleGameStart}
        onLogout={handleLogout}
        onBack={handleBackToMenu}
      />
    )
  }

  // Show main menu by default after login
  return (
    <div className="min-h-screen bg-[#0e1014] text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="text-center flex-1">
            <h1 className="text-6xl font-bold mb-4 text-white">XXXo The Game</h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Een strategische variant van tic-tac-toe op een 5x5 bord. Maak 4 of 5 op een rij om punten te scoren!
            </p>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="border-gray-600 text-gray-300 hover:bg-gray-700 bg-transparent"
          >
            Logout
          </Button>
        </div>

        {/* Main Menu Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {/* Multiplayer Game */}
          <Card className="bg-gray-800 border-gray-700 hover:bg-gray-750 transition-colors">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-3 bg-purple-600 rounded-full w-fit">
                <Users className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-white text-xl">Multiplayer</CardTitle>
              <CardDescription className="text-gray-300">Speel online tegen andere spelers</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleMultiplayerClick} className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                Online Spelen
              </Button>
            </CardContent>
          </Card>

          {/* Single Player Game */}
          <Card className="bg-gray-800 border-gray-700 hover:bg-gray-750 transition-colors">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-3 bg-green-600 rounded-full w-fit">
                <Play className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-white text-xl">Lokaal Spel</CardTitle>
              <CardDescription className="text-gray-300">Speel lokaal tegen een vriend of AI</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/game" className="w-full">
                <Button className="w-full bg-green-600 hover:bg-green-700 text-white">Lokaal Spelen</Button>
              </Link>
            </CardContent>
          </Card>

          {/* Game Rules */}
          <Card className="bg-gray-800 border-gray-700 hover:bg-gray-750 transition-colors">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-3 bg-blue-600 rounded-full w-fit">
                <BookOpen className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-white text-xl">Spelregels</CardTitle>
              <CardDescription className="text-gray-300">Leer hoe je XXXo The Game speelt</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/rules" className="w-full">
                <Button
                  variant="outline"
                  className="w-full border-blue-600 text-blue-400 hover:bg-blue-600 hover:text-white bg-transparent"
                >
                  Regels Bekijken
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Statistics */}
          <Card className="bg-gray-800 border-gray-700 hover:bg-gray-750 transition-colors">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-3 bg-orange-600 rounded-full w-fit">
                <Trophy className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-white text-xl">Statistieken</CardTitle>
              <CardDescription className="text-gray-300">Bekijk je spelstatistieken en prestaties</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/stats" className="w-full">
                <Button
                  variant="outline"
                  className="w-full border-orange-600 text-orange-400 hover:bg-orange-600 hover:text-white bg-transparent"
                >
                  Stats Bekijken
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* User Info */}
        <div className="mt-12 text-center">
          <p className="text-gray-400">
            Welkom terug, <span className="text-white font-semibold">{user.username}</span>!
          </p>
          <p className="text-gray-500 text-sm mt-1">
            Games gespeeld: {user.stats.gamesPlayed} | Games gewonnen: {user.stats.gamesWon}
          </p>
        </div>

        {/* Footer */}
        <footer className="mt-16 text-center text-gray-400">
          <p>&copy; 2024 XXXo The Game. Veel plezier met spelen!</p>
        </footer>
      </div>
    </div>
  )
}
