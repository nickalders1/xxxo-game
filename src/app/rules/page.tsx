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
  AlertTriangle,
  Lightbulb,
  Play,
  Target,
  Users,
  Zap,
} from "lucide-react";

import { AppShell } from "@/components/layout/AppShell";
import { TopBar } from "@/components/layout/TopBar";

// Static example board: an X 5-in-a-row diagonal worth 2 points.
const EXAMPLE_BOARD: ReadonlyArray<"X" | "O" | ""> = [
  "X", "", "O", "", "",
  "", "X", "", "O", "",
  "", "", "X", "", "O",
  "", "", "", "X", "",
  "", "", "", "", "X",
] as const;

export default function RulesPage() {
  return (
    <AppShell>
      <TopBar
        title="Spelregels"
        backHref="/"
        right={
          <Link href="/game?mode=local">
            <Button size="sm" className="tap-target">
              <Play className="h-4 w-4" />
              <span className="hidden sm:inline">Start spel</span>
            </Button>
          </Link>
        }
      />

      <div className="max-w-3xl mx-auto space-y-6">
        {/* Basic rules */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Target className="h-5 w-5 text-primary" />
              <CardTitle>Basisregels</CardTitle>
            </div>
            <CardDescription>De fundamentele regels van XXXo</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 text-foreground/90">
            <Section title="Doel">
              <p>
                Scoor meer punten dan je tegenstander door 4 of 5 symbolen op een
                rij te maken (horizontaal, verticaal of diagonaal) op een 5×5
                bord.
              </p>
            </Section>
            <Section title="Beurten">
              <ul className="list-disc list-inside space-y-1 text-foreground/80">
                <li>Speler X begint altijd</li>
                <li>Spelers wisselen om de beurt af</li>
                <li>Plaats je symbool in een leeg vakje</li>
              </ul>
            </Section>
          </CardContent>
        </Card>

        {/* Scoring */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Zap className="h-5 w-5 text-accent" />
              <CardTitle>Punten</CardTitle>
            </div>
            <CardDescription>Hoe je scoort in XXXo</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-4">
              <ScoreTile points={1} title="4 op een rij" />
              <ScoreTile points={2} title="5 op een rij" />
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              Als je een bestaande 4 doortrekt naar een 5, scoor je alleen het
              uitbreidingspunt (+1), niet de volle +2.
            </p>
          </CardContent>
        </Card>

        {/* Special rules */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <CardTitle>Belangrijke regels</CardTitle>
            </div>
            <CardDescription>Wat dit spel strategisch maakt</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <Callout tone="destructive" title="Bewegingsbeperking">
              <p>
                Je mag <strong>niet</strong> naast je eigen laatste zet
                plaatsen. Alle 8 vakjes rondom je laatste zet zijn verboden voor
                je volgende beurt.
              </p>
            </Callout>

            <Callout tone="primary" title="Bonus beurt">
              <p>
                Heeft één speler geen geldige zet meer maar de ander wel? Dan
                krijgt de ander één bonusbeurt. Daarna eindigt het spel.
              </p>
            </Callout>

            <Section title="Spel einde">
              <ul className="list-disc list-inside space-y-1 text-foreground/80">
                <li>Nog maar 1 leeg vakje over, óf</li>
                <li>Geen van beide spelers kan een geldige zet maken, óf</li>
                <li>Er zijn geen punten meer te behalen, óf</li>
                <li>Na een bonusbeurt</li>
              </ul>
              <p className="text-foreground/90">
                Speler met de meeste punten wint. Gelijke stand → gelijkspel.
              </p>
            </Section>
          </CardContent>
        </Card>

        {/* Strategy */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Lightbulb className="h-5 w-5 text-accent" />
              <CardTitle>Strategie</CardTitle>
            </div>
            <CardDescription>Tips om beter te worden</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-foreground/90">
              {[
                "Plan vooruit — waar mag je over twee zetten nog komen?",
                "Forceer je tegenstander in posities zonder goede zetten.",
                "Ga voor 5 op een rij als het kan — dubbele punten waard.",
                "Gebruik de bewegingsbeperking ook tactisch tegen jezelf.",
                "Creëer meerdere dreigingen tegelijk.",
              ].map((tip) => (
                <li key={tip} className="flex items-start gap-2">
                  <span className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Example board */}
        <Card>
          <CardHeader>
            <CardTitle>Voorbeeldbord</CardTitle>
            <CardDescription>
              Diagonaal van linksboven naar rechtsonder — X heeft 5 op een rij = 2
              punten.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-game-board rounded-2xl border border-border/60 p-3 max-w-xs mx-auto">
              <div className="grid grid-cols-5 gap-1.5">
                {EXAMPLE_BOARD.map((cell, i) => (
                  <div
                    key={i}
                    className={
                      cell === "X"
                        ? "aspect-square rounded-md bg-game-x-soft text-game-x flex items-center justify-center text-sm font-bold tabular"
                        : cell === "O"
                        ? "aspect-square rounded-md bg-game-o-soft text-game-o flex items-center justify-center text-sm font-bold tabular"
                        : "aspect-square rounded-md bg-game-cell"
                    }
                  >
                    {cell}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Link href="/game?mode=local" className="flex-1 sm:flex-none">
            <Button size="lg" className="w-full sm:w-auto tap-target">
              <Play className="h-4 w-4" />
              Lokaal spelen
            </Button>
          </Link>
          <Link href="/online" className="flex-1 sm:flex-none">
            <Button size="lg" variant="secondary" className="w-full sm:w-auto tap-target">
              <Users className="h-4 w-4" />
              Online spelen
            </Button>
          </Link>
        </div>
      </div>
    </AppShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h3 className="font-semibold">{title}</h3>
      {children}
    </div>
  );
}

function ScoreTile({ points, title }: { points: 1 | 2; title: string }) {
  return (
    <div className="rounded-xl border border-border bg-muted/30 p-4">
      <div className="text-sm text-muted-foreground mb-1">{title}</div>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold tabular text-accent">{points}</span>
        <span className="text-sm text-muted-foreground">
          {points === 1 ? "punt" : "punten"}
        </span>
      </div>
    </div>
  );
}

function Callout({
  tone,
  title,
  children,
}: {
  tone: "destructive" | "primary";
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={
        tone === "destructive"
          ? "rounded-xl border border-destructive/40 bg-destructive/10 p-4"
          : "rounded-xl border border-primary/40 bg-primary/10 p-4"
      }
    >
      <div
        className={
          tone === "destructive"
            ? "font-semibold text-destructive mb-1"
            : "font-semibold text-primary mb-1"
        }
      >
        {title}
      </div>
      <div className="text-foreground/90 text-sm">{children}</div>
    </div>
  );
}
