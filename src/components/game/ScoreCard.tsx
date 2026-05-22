import { cn } from "@/lib/utils";
import { PlayerBadge } from "./PlayerBadge";
import type { Player, Score } from "@/lib/game/types";

interface ScoreCardProps {
  score: Score;
  currentPlayer?: Player;
  gameActive: boolean;
  labelX?: string;
  labelO?: string;
  className?: string;
}

function ScoreColumn({
  player,
  value,
  active,
  label,
}: {
  player: Player;
  value: number;
  active: boolean;
  label?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2",
        "rounded-xl border border-border/60 bg-card px-4 py-4",
        "transition-all duration-200",
        active && player === "X" && "ring-2 ring-game-x",
        active && player === "O" && "ring-2 ring-game-o",
      )}
    >
      <div className="flex items-center gap-2">
        <PlayerBadge player={player} size="md" />
        {label && (
          <span className="text-sm text-muted-foreground truncate max-w-[7rem]">
            {label}
          </span>
        )}
      </div>
      <div
        className={cn(
          "text-3xl sm:text-4xl font-bold tabular leading-none",
          player === "X" && "text-game-x",
          player === "O" && "text-game-o",
        )}
      >
        {value}
      </div>
    </div>
  );
}

export function ScoreCard({
  score,
  currentPlayer,
  gameActive,
  labelX,
  labelO,
  className,
}: ScoreCardProps) {
  return (
    <div className={cn("grid grid-cols-2 gap-3", className)}>
      <ScoreColumn
        player="X"
        value={score.X}
        active={gameActive && currentPlayer === "X"}
        label={labelX}
      />
      <ScoreColumn
        player="O"
        value={score.O}
        active={gameActive && currentPlayer === "O"}
        label={labelO}
      />
    </div>
  );
}
