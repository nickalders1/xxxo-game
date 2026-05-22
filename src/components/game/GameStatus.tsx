import { cn } from "@/lib/utils";
import { Trophy } from "lucide-react";
import type { Player } from "@/lib/game/types";

interface GameStatusProps {
  message: string;
  winner?: Player | "tie" | null;
  className?: string;
}

export function GameStatus({ message, winner, className }: GameStatusProps) {
  if (winner) {
    const isTie = winner === "tie";
    return (
      <div
        className={cn(
          "flex items-center justify-center gap-3 rounded-xl border bg-card px-4 py-4",
          isTie && "border-muted-foreground/40",
          winner === "X" && "border-game-x/60",
          winner === "O" && "border-game-o/60",
          className,
        )}
        role="status"
        aria-live="polite"
      >
        <Trophy
          className={cn(
            "h-5 w-5 shrink-0",
            isTie && "text-muted-foreground",
            winner === "X" && "text-game-x",
            winner === "O" && "text-game-o",
          )}
        />
        <span className="font-semibold text-base sm:text-lg">{message}</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-lg bg-muted/40 px-4 py-3 text-center text-sm sm:text-base font-medium text-foreground/90",
        className,
      )}
      role="status"
      aria-live="polite"
    >
      {message}
    </div>
  );
}
