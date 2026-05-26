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
import { BookOpen, Bot, Sparkles, Trophy, Users, Wifi } from "lucide-react";
import { cn } from "@/lib/utils";

import { ACTIVE_VARIANT_IDS, getVariant } from "@/lib/game/variants";
import type { VariantId, VariantMeta } from "@/lib/game/variants/types";

/** Decorative badge per variant — for quick visual differentiation on cards. */
const VARIANT_ACCENT: Record<VariantId, string> = {
  classic: "bg-game-x-soft text-game-x",
  cube3d: "bg-game-o-soft text-game-o",
  gravity: "bg-accent/20 text-accent",
  fogOfWar: "bg-muted text-muted-foreground",
  battleRoyale: "bg-destructive/20 text-destructive",
};

/** Optional "NEW" / "POPULAR" tags. */
const VARIANT_TAG: Partial<Record<VariantId, string>> = {
  cube3d: "NEW",
};

function MiniBoardPreview() {
  // Static preview: X 4-in-a-row pattern, signalling +1 scored.
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

interface VariantCardProps {
  meta: VariantMeta;
}

function VariantCard({ meta }: VariantCardProps) {
  const accent = VARIANT_ACCENT[meta.id];
  const tag = VARIANT_TAG[meta.id];

  return (
    <Card className="group transition-all duration-200 hover:border-primary/40 hover:bg-card/80">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center font-bold text-sm", accent)}>
            {meta.name.charAt(0)}
          </div>
          {tag && (
            <span className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-full bg-accent/20 text-accent">
              {tag}
            </span>
          )}
        </div>
        <CardTitle className="text-lg">{meta.name}</CardTitle>
        <CardDescription>{meta.tagline}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {meta.supportsLocal && (
          <Link href={`/game?variant=${meta.id}&mode=local`}>
            <Button variant="secondary" size="default" className="w-full justify-start">
              <Users className="h-4 w-4" />
              Local — 2 players
            </Button>
          </Link>
        )}
        {meta.supportsAi && (
          <Link href={`/game?variant=${meta.id}&mode=ai`}>
            <Button variant="default" size="default" className="w-full justify-start">
              <Bot className="h-4 w-4" />
              vs AI
            </Button>
          </Link>
        )}
        {meta.supportsOnline && (
          <Link href={`/online?variant=${meta.id}`}>
            <Button variant="outline" size="default" className="w-full justify-start">
              <Wifi className="h-4 w-4" />
              Online
            </Button>
          </Link>
        )}
        {!meta.supportsOnline && (
          <p className="text-[11px] text-muted-foreground text-center pt-1">
            Online matchmaking coming soon for this variant.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default function HomePage() {
  const variants = ACTIVE_VARIANT_IDS.map((id) => getVariant(id).meta);

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
          Make 4 or 5 in a row to score points. One game, multiple board
          shapes — pick a variant and start playing.
        </p>
      </section>

      {/* Variant picker */}
      <section className="mb-10 sm:mb-14">
        <div className="flex items-center justify-center gap-2 mb-5 text-sm">
          <Sparkles className="h-4 w-4 text-accent" />
          <span className="text-muted-foreground">
            {variants.length} {variants.length === 1 ? "variant" : "variants"} available
          </span>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          {variants.map((meta) => (
            <VariantCard key={meta.id} meta={meta} />
          ))}
        </div>
      </section>

      {/* How it works (universal — same scoring across variants) */}
      <section className="mb-10 sm:mb-14">
        <h2 className="text-2xl font-bold tracking-tight text-center mb-6">
          How scoring works
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
          desc="Play friends or the computer with 3 difficulty levels."
        />
        <FeatureItem
          icon={<Wifi className="h-5 w-5" />}
          title="Matchmaking"
          desc="Online matchmaking with skill-based pairing."
        />
        <FeatureItem
          icon={<Trophy className="h-5 w-5" />}
          title="Strategic"
          desc="Five variants, one core idea — make a line of 4 or 5."
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
