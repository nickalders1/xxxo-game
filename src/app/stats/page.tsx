"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Home, Play, Trophy, TrendingUp, Target, Clock } from "lucide-react"

interface GameStats {
  totalGames: number
  xWins: number
  oWins: number
  ties: number
  averageGameLength: number
  highestScore: { player: string; score: number }
  longestWinStreak: { player: string; streak: number }
}

export default function StatsPage() {
  const [stats, setStats] = useState<GameStats>({
    totalGames: 0,
    xWins: 0,
    oWins: 0,
    ties: 0,
    averageGameLength: 0,
    highestScore: { player: "X", score: 0 },
    longestWinStreak: { player: "X", streak: 0 },
  })

  useEffect(() => {
    // In een echte app zou je dit uit localStorage of een database halen
    // Voor nu gebruiken we dummy data
    setStats({
      totalGames: 15,
      xWins: 8,
      oWins: 6,
      ties: 1,
      averageGameLength: 12.5,
      highestScore: { player: "X", score: 7 },
      longestWinStreak: { player: "O", streak: 3 },
    })
  }, [])

  const winPercentage = (wins: number) => {
    if (stats.totalGames === 0) return 0
    return Math.round((wins / stats.totalGames) * 100)
  }

  const resetStats = () => {
    setStats({
      totalGames: 0,
      xWins: 0,
      oWins: 0,
      ties: 0,
      averageGameLength: 0,
      highestScore: { player: "X", score: 0 },
      longestWinStreak: { player: "X", streak: 0 },
    })
  }

  return (
    <div className="min-h-screen bg-[#0e1014] text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <Link href="/">
            <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700 bg-transparent">
              <Home className="mr-2 h-4 w-4" />
              Home
            </Button>
          </Link>
          <h1 className="text-4xl font-bold">Statistieken</h1>
          <Link href="/game">
            <Button className="bg-green-600 hover:bg-green-700">
              <Play className="mr-2 h-4 w-4" />
              Spel Starten
            </Button>
          </Link>
        </div>

        <div className="max-w-6xl mx-auto space-y-8">
          {/* Overview Stats */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-400" />
                  <CardTitle className="text-lg text-white">Totaal Gespeeld</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-white">{stats.totalGames}</p>
                <p className="text-gray-400 text-sm">spellen</p>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-green-400" />
                  <CardTitle className="text-lg text-white">Hoogste Score</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-white">{stats.highestScore.score}</p>
                <p className="text-gray-400 text-sm">door speler {stats.highestScore.player}</p>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-purple-400" />
                  <CardTitle className="text-lg text-white">Langste Reeks</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-white">{stats.longestWinStreak.streak}</p>
                <p className="text-gray-400 text-sm">door speler {stats.longestWinStreak.player}</p>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-400" />
                  <CardTitle className="text-lg text-white">Gem. Speelduur</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-white">{stats.averageGameLength}</p>
                <p className="text-gray-400 text-sm">zetten per spel</p>
              </CardContent>
            </Card>
          </div>

          {/* Win Statistics */}
          <div className="grid lg:grid-cols-2 gap-8">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Overwinningen</CardTitle>
                <CardDescription className="text-gray-300">Verdeling van gewonnen spellen per speler</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Player X Stats */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Speler X</span>
                    <span className="text-white font-bold">
                      {stats.xWins} ({winPercentage(stats.xWins)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-3">
                    <div
                      className="bg-blue-500 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${winPercentage(stats.xWins)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Player O Stats */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Speler O</span>
                    <span className="text-white font-bold">
                      {stats.oWins} ({winPercentage(stats.oWins)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-3">
                    <div
                      className="bg-red-500 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${winPercentage(stats.oWins)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Ties */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Gelijkspel</span>
                    <span className="text-white font-bold">
                      {stats.ties} ({winPercentage(stats.ties)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-3">
                    <div
                      className="bg-yellow-500 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${winPercentage(stats.ties)}%` }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Detailed Stats */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Gedetailleerde Statistieken</CardTitle>
                <CardDescription className="text-gray-300">Meer informatie over je speelprestaties</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-700 p-4 rounded-lg text-center">
                    <p className="text-2xl font-bold text-blue-400">{stats.xWins}</p>
                    <p className="text-gray-300 text-sm">X Overwinningen</p>
                  </div>
                  <div className="bg-gray-700 p-4 rounded-lg text-center">
                    <p className="text-2xl font-bold text-red-400">{stats.oWins}</p>
                    <p className="text-gray-300 text-sm">O Overwinningen</p>
                  </div>
                  <div className="bg-gray-700 p-4 rounded-lg text-center">
                    <p className="text-2xl font-bold text-yellow-400">{stats.ties}</p>
                    <p className="text-gray-300 text-sm">Gelijkspel</p>
                  </div>
                  <div className="bg-gray-700 p-4 rounded-lg text-center">
                    <p className="text-2xl font-bold text-green-400">{stats.totalGames}</p>
                    <p className="text-gray-300 text-sm">Totaal Spellen</p>
                  </div>
                </div>

                {stats.totalGames === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-400 mb-4">Nog geen spellen gespeeld!</p>
                    <Link href="/game">
                      <Button className="bg-green-600 hover:bg-green-700">Start je eerste spel</Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Achievements */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Prestaties</CardTitle>
              <CardDescription className="text-gray-300">Jouw behaalde prestaties in XXXo The Game</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div
                  className={`p-4 rounded-lg border-2 ${stats.totalGames >= 1 ? "bg-green-900/20 border-green-700" : "bg-gray-700 border-gray-600"}`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <Trophy className={`h-6 w-6 ${stats.totalGames >= 1 ? "text-green-400" : "text-gray-500"}`} />
                    <h3 className="font-semibold text-white">Eerste Spel</h3>
                  </div>
                  <p className="text-gray-300 text-sm">Speel je eerste spel</p>
                  <p className={`text-xs mt-1 ${stats.totalGames >= 1 ? "text-green-400" : "text-gray-500"}`}>
                    {stats.totalGames >= 1 ? "✓ Behaald!" : "Nog niet behaald"}
                  </p>
                </div>

                <div
                  className={`p-4 rounded-lg border-2 ${stats.totalGames >= 10 ? "bg-green-900/20 border-green-700" : "bg-gray-700 border-gray-600"}`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <Target className={`h-6 w-6 ${stats.totalGames >= 10 ? "text-green-400" : "text-gray-500"}`} />
                    <h3 className="font-semibold text-white">Veteraan</h3>
                  </div>
                  <p className="text-gray-300 text-sm">Speel 10 spellen</p>
                  <p className={`text-xs mt-1 ${stats.totalGames >= 10 ? "text-green-400" : "text-gray-500"}`}>
                    {stats.totalGames >= 10 ? "✓ Behaald!" : `${stats.totalGames}/10`}
                  </p>
                </div>

                <div
                  className={`p-4 rounded-lg border-2 ${stats.highestScore.score >= 5 ? "bg-green-900/20 border-green-700" : "bg-gray-700 border-gray-600"}`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <TrendingUp
                      className={`h-6 w-6 ${stats.highestScore.score >= 5 ? "text-green-400" : "text-gray-500"}`}
                    />
                    <h3 className="font-semibold text-white">Hoge Score</h3>
                  </div>
                  <p className="text-gray-300 text-sm">Score 5+ punten in één spel</p>
                  <p className={`text-xs mt-1 ${stats.highestScore.score >= 5 ? "text-green-400" : "text-gray-500"}`}>
                    {stats.highestScore.score >= 5 ? "✓ Behaald!" : `Hoogste: ${stats.highestScore.score}`}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reset Button */}
          <div className="text-center">
            <Button
              onClick={resetStats}
              variant="outline"
              className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white bg-transparent"
            >
              Reset Alle Statistieken
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
