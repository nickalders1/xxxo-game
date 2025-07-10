import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Home, Play, Target, Users, Zap } from "lucide-react"

export default function RulesPage() {
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
          <h1 className="text-4xl font-bold">Spelregels</h1>
          <Link href="/game">
            <Button className="bg-green-600 hover:bg-green-700">
              <Play className="mr-2 h-4 w-4" />
              Spel Starten
            </Button>
          </Link>
        </div>

        <div className="max-w-4xl mx-auto space-y-8">
          {/* Basic Rules */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Target className="h-6 w-6 text-blue-400" />
                <CardTitle className="text-white">Basis Spelregels</CardTitle>
              </div>
              <CardDescription className="text-gray-300">Leer de fundamentele regels van XXXo The Game</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-300">
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-white">Doel van het Spel</h3>
                <p>
                  Het doel is om meer punten te scoren dan je tegenstander door 4 of 5 symbolen op een rij te maken
                  (horizontaal, verticaal of diagonaal) op een 5x5 speelbord.
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-white">Beurten</h3>
                <ul className="list-disc list-inside space-y-2">
                  <li>Speler X begint altijd</li>
                  <li>Spelers wisselen om de beurt af</li>
                  <li>Plaats je symbool (X of O) in een leeg vakje</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Scoring System */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Zap className="h-6 w-6 text-yellow-400" />
                <CardTitle className="text-white">Punten Systeem</CardTitle>
              </div>
              <CardDescription className="text-gray-300">Hoe je punten scoort in XXXo The Game</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-300">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-gray-700 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-white mb-2">4 op een rij</h3>
                  <p className="text-2xl font-bold text-yellow-400 mb-2">1 punt</p>
                  <p>Maak 4 van je symbolen op een rij (horizontaal, verticaal of diagonaal)</p>
                </div>
                <div className="bg-gray-700 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-white mb-2">5 op een rij</h3>
                  <p className="text-2xl font-bold text-green-400 mb-2">2 punten</p>
                  <p>Maak 5 van je symbolen op een rij (horizontaal, verticaal of diagonaal)</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Special Rules */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Users className="h-6 w-6 text-purple-400" />
                <CardTitle className="text-white">Speciale Regels</CardTitle>
              </div>
              <CardDescription className="text-gray-300">
                Belangrijke regels die het spel strategisch maken
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 text-gray-300">
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-white">Bewegingsbeperking</h3>
                <div className="bg-red-900/20 border border-red-700 p-4 rounded-lg">
                  <p className="font-semibold text-red-400 mb-2">Belangrijke Regel:</p>
                  <p>
                    Je mag <strong>NIET</strong> naast je laatste zet plaatsen. Dit betekent dat alle 8 vakjes rondom je
                    laatste zet verboden zijn voor je volgende zet.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-white">Bonus Beurt</h3>
                <div className="bg-blue-900/20 border border-blue-700 p-4 rounded-lg">
                  <p className="font-semibold text-blue-400 mb-2">Speciale Situatie:</p>
                  <p>
                    Als speler X geen geldige zet kan maken maar speler O wel, krijgt speler O een bonus beurt. Na deze
                    bonus beurt eindigt het spel automatisch.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-white">Spel Einde</h3>
                <ul className="list-disc list-inside space-y-2">
                  <li>Het spel eindigt wanneer er nog maar 1 leeg vakje over is</li>
                  <li>Het spel eindigt wanneer geen van beide spelers een geldige zet kan maken</li>
                  <li>Het spel eindigt na een bonus beurt van speler O</li>
                  <li>De speler met de meeste punten wint!</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Strategy Tips */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Strategie Tips</CardTitle>
              <CardDescription className="text-gray-300">Tips om beter te worden in XXXo The Game</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-300">
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="text-green-400 font-bold">•</span>
                  <span>Plan je zetten vooruit - denk na over waar je volgende zet mogelijk is</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-400 font-bold">•</span>
                  <span>Probeer je tegenstander in een positie te dwingen waar ze geen goede zetten hebben</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-400 font-bold">•</span>
                  <span>Ga voor 5 op een rij wanneer mogelijk - dubbele punten zijn het waard!</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-400 font-bold">•</span>
                  <span>Let op de bewegingsbeperking - gebruik dit tactisch tegen je tegenstander</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Visual Example */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Voorbeeld Bord</CardTitle>
              <CardDescription className="text-gray-300">Een voorbeeld van hoe het spel eruit ziet</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center">
                <div className="grid grid-cols-5 gap-1 bg-gray-700 p-4 rounded-lg">
                  {[
                    "X",
                    "",
                    "O",
                    "",
                    "",
                    "",
                    "X",
                    "",
                    "O",
                    "",
                    "",
                    "",
                    "X",
                    "",
                    "O",
                    "",
                    "",
                    "",
                    "X",
                    "",
                    "",
                    "",
                    "",
                    "",
                    "X",
                  ].map((cell, i) => (
                    <div
                      key={i}
                      className="w-10 h-10 bg-gray-600 border border-gray-500 flex items-center justify-center text-sm font-bold"
                    >
                      {cell}
                    </div>
                  ))}
                </div>
              </div>
              <p className="text-center text-gray-300 mt-4">
                In dit voorbeeld heeft X 5 op een rij diagonaal gemaakt = 2 punten!
              </p>
            </CardContent>
          </Card>

          {/* Call to Action */}
          <div className="text-center">
            <Link href="/game">
              <Button size="lg" className="bg-green-600 hover:bg-green-700">
                <Play className="mr-2 h-5 w-5" />
                Nu Spelen!
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
