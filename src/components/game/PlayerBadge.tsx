import { cn } from "@/lib/utils";
import type { Player } from "@/lib/game/types";

interface PlayerBadgeProps {
  player: Player;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function PlayerBadge({ player, size = "md", className }: PlayerBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-md font-bold tabular",
        size === "sm" && "h-6 w-6 text-sm",
        size === "md" && "h-8 w-8 text-base",
        size === "lg" && "h-10 w-10 text-lg",
        player === "X" && "bg-game-x-soft text-game-x",
        player === "O" && "bg-game-o-soft text-game-o",
        className,
      )}
      aria-label={`Player ${player}`}
    >
      {player}
    </span>
  );
}
