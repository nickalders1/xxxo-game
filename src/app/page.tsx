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
        4 op een rij = <span className="text-foreground font-semibold">1 punt</span>
        {"  •  "}
        5 op een rij = <span className="text-foreground font-semibold">2 punten</span>
      </p>
    </div>
  );
}

export default function HomePage() {
  return (
    <AppShell>
      {/* Hero */}
      <section className="text-center mb-10 sm:mb-14">
        <div className="inline-flex items-center gap-2 mb-4 rounded-full border border-border bg-card/70 px-3 py-1 text-xs text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          Strategische 5×5 tic-tac-toe
        </div>
        <h1 className="text-5xl sm:text-6xl font-bold tracking-tight mb-3">
          <span className="text-game-x">X</span>
          <span className="text-foreground">XX</span>
          <span className="text-game-o">o</span>
        </h1>
        <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto">
          Maak 4 of 5 op een rij om punten te scoren. Plaats nooit naast je eigen
          laatste zet. Hoogste score wint.
        </p>
      </section>

      {/* Game Modes */}
      <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10 sm:mb-14">
        <ModeCard
          title="Lokaal"
          description="Speel tegen iemand op dit apparaat"
          href="/game?mode=local"
          icon={<Users className="h-7 w-7" />}
          cta="Start lokaal spel"
        />
        <ModeCard
          title="Tegen AI"
          description="Speel tegen de computer (3 niveaus)"
          href="/game?mode=ai"
          icon={<Bot className="h-7 w-7" />}
          cta="Speel tegen AI"
          highlighted
        />
        <ModeCard
          title="Online"
          description="Vind een tegenstander wereldwijd"
          href="/online"
          icon={<Wifi className="h-7 w-7" />}
          cta="Online spelen"
        />
      </section>

      {/* How it works */}
      <section className="mb-10 sm:mb-14">
        <h2 className="text-2xl font-bold tracking-tight text-center mb-6">
          Hoe het werkt
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
            <CardTitle>Spelregels</CardTitle>
            <CardDescription>
              Volledige uitleg met voorbeelden en uitzonderingen
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/rules" className="block">
              <Button variant="outline" size="lg" className="w-full tap-target">
                Bekijk regels
              </Button>
            </Link>
          </CardContent>
        </Card>
      </section>

      {/* Features */}
      <section className="grid sm:grid-cols-3 gap-6 mb-10 max-w-3xl mx-auto">
        <FeatureItem
          icon={<Users className="h-5 w-5" />}
          title="Lokaal & AI"
          desc="Speel tegen vrienden of de computer met 3 moeilijkheidsgraden."
        />
        <FeatureItem
          icon={<Wifi className="h-5 w-5" />}
          title="Matchmaking"
          desc="Vind automatisch een tegenstander van jouw niveau."
        />
        <FeatureItem
          icon={<Trophy className="h-5 w-5" />}
          title="Strategisch"
          desc="Unieke regels maken dit dieper dan gewone tic-tac-toe."
        />
      </section>

      <footer className="text-center text-xs text-muted-foreground border-t border-border pt-6">
        XXXo · Veel speelplezier
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
