import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AppShell } from "@/components/layout/AppShell";
import { BookOpen, Bot, Trophy, Users, Wifi } from "lucide-react";

interface ModeCardProps {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  cta: string;
  highlighted?: boolean;
}

function ModeCard({
  title,
  description,
  href,
  icon,
  cta,
  highlighted,
}: ModeCardProps) {
  return (
    <Card className="group transition-all duration-200 hover:border-primary/40 hover:bg-card/80">
      <CardHeader className="text-center">
        <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-foreground/80 group-hover:text-primary transition-colors">
          {icon}
        </div>
        <CardTitle className="text-lg sm:text-xl">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Link href={href} className="block">
          <Button
            variant={highlighted ? "default" : "secondary"}
            size="lg"
            className="w-full tap-target"
          >
            {cta}
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

function MiniBoardPreview() {
  // A static preview row showing an X 4-in-a-row pattern that scored a point.
  const xPositions = new Set([6, 7, 8, 9]);
  const oPositions = new Set([12]);
  return (
    <div className="bg-game-board rounded-2xl border border-border/60 p-3 shadow-xl max-w-sm mx-auto">
      <div className="grid grid-cols-5 gap-1.5">
        {Array.from({ length: 25 }, (_, i) => (
          <div
            key={i}
            className={
              xPositions.has(i)
                ? "aspect-square rounded-md bg-game-x-soft text-game-x flex items-center justify-center text-sm font-bold tabular"
                : oPositions.has(i)
                ? "aspect-square rounded-md bg-game-o-soft text-game-o flex items-center justify-center text-sm font-bold tabular"
                : "aspect-square rounded-md bg-game-cell"
            }
          >
            {xPositions.has(i) ? "X" : oPositions.has(i) ? "O" : ""}
          </div>
        ))}
      </div>
      <p className="mt-4 text-center text-sm text-muted-foreground">
        4 in a row = <span className="text-foreground font-semibold">1 point</span>
        {"  •  "}
        5 in a row = <span className="text-foreground font-semibold">2 points</span>
      </p>
    </div>
  );
}

export default function HomePage() {
  return (
    <AppShell>
      {/* Hero */}
      <section className="text-center mb-10 sm:mb-14">
        <h1 className="text-5xl sm:text-6xl font-bold tracking-tight mb-3">
          <span className="text-game-x">X</span>
          <span className="text-foreground">XX</span>
          <span className="text-game-o">o</span>
        </h1>
        <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto">
          Make 4 or 5 in a row to score points. Never place next to your own
          last move. Highest score wins.
        </p>
      </section>

      {/* Game Modes */}
      <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10 sm:mb-14">
        <ModeCard
          title="Local"
          description="Play against someone on this device"
          href="/game?mode=local"
          icon={<Users className="h-7 w-7" />}
          cta="Start local game"
        />
        <ModeCard
          title="vs AI"
          description="Play against the computer (3 levels)"
          href="/game?mode=ai"
          icon={<Bot className="h-7 w-7" />}
          cta="Play against AI"
          highlighted
        />
        <ModeCard
          title="Online"
          description="Find an opponent worldwide"
          href="/online"
          icon={<Wifi className="h-7 w-7" />}
          cta="Play online"
        />
      </section>

      {/* How it works */}
      <section className="mb-10 sm:mb-14">
        <h2 className="text-2xl font-bold tracking-tight text-center mb-6">
          How it works
        </h2>
        <MiniBoardPreview />
      </section>

      {/* Rules link */}
      <section className="mb-12 max-w-md mx-auto">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-foreground/80">
              <BookOpen className="h-6 w-6" />
            </div>
            <CardTitle>Game rules</CardTitle>
            <CardDescription>
              Full explanation with examples and edge cases
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/rules" className="block">
              <Button variant="outline" size="lg" className="w-full tap-target">
                View rules
              </Button>
            </Link>
          </CardContent>
        </Card>
      </section>

      {/* Features */}
      <section className="grid sm:grid-cols-3 gap-6 mb-10 max-w-3xl mx-auto">
        <FeatureItem
          icon={<Users className="h-5 w-5" />}
          title="Local & AI"
          desc="Play against friends or the computer with 3 difficulty levels."
        />
        <FeatureItem
          icon={<Wifi className="h-5 w-5" />}
          title="Matchmaking"
          desc="Automatically find an opponent at your level."
        />
        <FeatureItem
          icon={<Trophy className="h-5 w-5" />}
          title="Strategic"
          desc="Unique rules make this deeper than regular tic-tac-toe."
        />
      </section>

      <footer className="text-center text-xs text-muted-foreground border-t border-border pt-6">
        XXXo · Enjoy the game
      </footer>
    </AppShell>
  );
}

function FeatureItem({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="text-center">
      <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-foreground/80">
        {icon}
      </div>
      <h3 className="font-semibold mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}
