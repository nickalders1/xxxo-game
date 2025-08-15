import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BookOpen,
  Trophy,
  User,
  Bot,
  Wifi,
  Users,
  Gamepad2,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl mb-4">
              <Gamepad2 className="h-10 w-10 text-white" />
            </div>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            XXXo
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Strategische 5x5 tic-tac-toe. Maak 4 of 5 op een rij om punten te
            scoren!
          </p>
        </div>

        {/* Game Mode Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto mb-12">
          {/* Local PvP */}
          <Card className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-all duration-300 hover:scale-105">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 p-3 bg-green-500 rounded-full w-fit">
                <Users className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-white text-xl">Lokaal Spel</CardTitle>
              <CardDescription className="text-gray-300">
                Speel tegen een vriend op dit apparaat
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/game?mode=local" className="w-full">
                <Button className="w-full bg-green-500 hover:bg-green-600 text-white h-12">
                  <User className="mr-2 h-5 w-5" />
                  Spelen
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* AI Game */}
          <Card className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-all duration-300 hover:scale-105">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 p-3 bg-blue-500 rounded-full w-fit">
                <Bot className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-white text-xl">Tegen AI</CardTitle>
              <CardDescription className="text-gray-300">
                Speel tegen de computer
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/game?mode=ai" className="w-full">
                <Button className="w-full bg-blue-500 hover:bg-blue-600 text-white h-12">
                  <Bot className="mr-2 h-5 w-5" />
                  Spelen
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Online Multiplayer */}
          <Card className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-all duration-300 hover:scale-105 md:col-span-2 lg:col-span-1">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 p-3 bg-purple-500 rounded-full w-fit">
                <Wifi className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-white text-xl">Online</CardTitle>
              <CardDescription className="text-gray-300">
                Speel tegen spelers wereldwijd
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/online" className="w-full">
                <Button className="w-full bg-purple-500 hover:bg-purple-600 text-white h-12">
                  <Wifi className="mr-2 h-5 w-5" />
                  Zoek Spel
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Info Cards */}
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-12">
          {/* Rules */}
          <Card className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-all duration-300 hover:scale-105 md:col-span-2 lg:col-span-1">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-3 bg-orange-500 rounded-full w-fit">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-white">Spelregels</CardTitle>
              <CardDescription className="text-gray-300">
                Leer hoe je XXXo speelt
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/rules" className="w-full">
                <Button
                  variant="outline"
                  className="w-full border-orange-500 text-orange-400 hover:bg-orange-500 hover:text-white bg-transparent"
                >
                  Regels Bekijken
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Game Preview */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-6 text-white">Hoe het werkt</h2>
          <div className="bg-slate-800/50 rounded-2xl p-6 max-w-md mx-auto border border-slate-700">
            <div className="grid grid-cols-5 gap-1 mb-4">
              {Array.from({ length: 25 }, (_, i) => (
                <div
                  key={i}
                  className={`aspect-square rounded flex items-center justify-center text-sm font-bold ${
                    i === 6 || i === 7 || i === 8 || i === 9
                      ? "bg-purple-500 text-white"
                      : i === 12
                      ? "bg-pink-500 text-white"
                      : "bg-slate-700"
                  }`}
                >
                  {i === 6 || i === 7 || i === 8 || i === 9
                    ? "X"
                    : i === 12
                    ? "O"
                    : ""}
                </div>
              ))}
            </div>
            <p className="text-gray-300 text-sm">
              4 op een rij = 1 punt • 5 op een rij = 2 punten
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto mb-12">
          <div className="text-center">
            <div className="bg-green-500 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <User className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Lokaal & AI</h3>
            <p className="text-gray-300">
              Speel tegen vrienden of slimme AI met verschillende
              moeilijkheidsgraden
            </p>
          </div>
          <div className="text-center">
            <div className="bg-purple-500 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Wifi className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">
              Online Matchmaking
            </h3>
            <p className="text-gray-300">
              Automatische matchmaking vindt tegenstanders van jouw niveau
            </p>
          </div>
          <div className="text-center">
            <div className="bg-orange-500 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Trophy className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Strategisch</h3>
            <p className="text-gray-300">
              Unieke regels maken dit veel strategischer dan gewone tic-tac-toe
            </p>
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center text-gray-400 border-t border-slate-700 pt-8">
          <p>&copy; 2024 XXXo Game. Veel plezier met spelen!</p>
        </footer>
      </div>
    </div>
  );
}
