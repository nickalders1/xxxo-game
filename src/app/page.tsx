import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Play, BookOpen, Trophy } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0e1014] text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold mb-4 text-white">XXXo The Game</h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Een strategische variant van tic-tac-toe op een 5x5 bord. Maak 4 of
            5 op een rij om punten te scoren!
          </p>
        </div>

        {/* Main Menu Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {/* Start Game */}
          <Card className="bg-gray-800 border-gray-700 hover:bg-gray-750 transition-colors">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-3 bg-green-600 rounded-full w-fit">
                <Play className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-white text-xl">Spel Starten</CardTitle>
              <CardDescription className="text-gray-300">
                Begin een nieuw spel tegen een vriend
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/game" className="w-full">
                <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                  Nieuw Spel
                </Button>
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
              <CardDescription className="text-gray-300">
                Leer hoe je XXXo The Game speelt
              </CardDescription>
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
          <Card className="bg-gray-800 border-gray-700 hover:bg-gray-750 transition-colors md:col-span-2 lg:col-span-1">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-3 bg-purple-600 rounded-full w-fit">
                <Trophy className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-white text-xl">Statistieken</CardTitle>
              <CardDescription className="text-gray-300">
                Bekijk je spelstatistieken en prestaties
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/stats" className="w-full">
                <Button
                  variant="outline"
                  className="w-full border-purple-600 text-purple-400 hover:bg-purple-600 hover:text-white bg-transparent"
                >
                  Stats Bekijken
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <footer className="mt-16 text-center text-gray-400">
          <p>&copy; 2024 XXXo The Game. Veel plezier met spelen!</p>
        </footer>
      </div>
    </div>
  );
}
