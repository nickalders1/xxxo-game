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
        title="Rules"
        backHref="/"
        right={
          <Link href="/game?mode=local">
            <Button size="sm" className="tap-target">
              <Play className="h-4 w-4" />
              <span className="hidden sm:inline">Start game</span>
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
              <CardTitle>Basics</CardTitle>
            </div>
            <CardDescription>The fundamentals of XXXo</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 text-foreground/90">
            <Section title="Goal">
              <p>
                Score more points than your opponent by making 4 or 5 symbols
                in a row (horizontally, vertically or diagonally) on a 5×5
                board.
              </p>
            </Section>
            <Section title="Turns">
              <ul className="list-disc list-inside space-y-1 text-foreground/80">
                <li>Player X always starts</li>
                <li>Players alternate turns</li>
                <li>Place your symbol in an empty cell</li>
              </ul>
            </Section>
          </CardContent>
        </Card>

        {/* Scoring */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Zap className="h-5 w-5 text-accent" />
              <CardTitle>Scoring</CardTitle>
            </div>
            <CardDescription>How you score in XXXo</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-4">
              <ScoreTile points={1} title="4 in a row" />
              <ScoreTile points={2} title="5 in a row" />
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              Extending an existing 4 to a 5 only awards the extension point
              (+1), not the full +2.
            </p>
          </CardContent>
        </Card>

        {/* Special rules */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <CardTitle>Important rules</CardTitle>
            </div>
            <CardDescription>What makes this game strategic</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <Callout tone="destructive" title="Movement restriction">
              <p>
                You may <strong>not</strong> place next to your own last move.
                All 8 cells around your last move are forbidden for your next
                turn.
              </p>
            </Callout>

            <Callout tone="primary" title="Bonus turn">
              <p>
                If one player has no valid moves left while the other still
                does, the other player gets one bonus turn. After that the
                game ends.
              </p>
            </Callout>

            <Section title="Game end">
              <ul className="list-disc list-inside space-y-1 text-foreground/80">
                <li>Only 1 empty cell left, or</li>
                <li>Neither player can make a valid move, or</li>
                <li>No more points can be scored, or</li>
                <li>After a bonus turn</li>
              </ul>
              <p className="text-foreground/90">
                Player with the most points wins. Equal score = tie.
              </p>
            </Section>
          </CardContent>
        </Card>

        {/* Strategy */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Lightbulb className="h-5 w-5 text-accent" />
              <CardTitle>Strategy</CardTitle>
            </div>
            <CardDescription>Tips to get better</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-foreground/90">
              {[
                "Plan ahead — where can you still play two moves from now?",
                "Force your opponent into positions with no good moves.",
                "Go for 5 in a row when you can — double points are worth it.",
                "Use the movement restriction tactically against yourself too.",
                "Create multiple threats at the same time.",
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
            <CardTitle>Example board</CardTitle>
            <CardDescription>
              Diagonal from top-left to bottom-right — X has 5 in a row = 2
              points.
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
              Play local
            </Button>
          </Link>
          <Link href="/online" className="flex-1 sm:flex-none">
            <Button size="lg" variant="secondary" className="w-full sm:w-auto tap-target">
              <Users className="h-4 w-4" />
              Play online
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
          {points === 1 ? "point" : "points"}
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
