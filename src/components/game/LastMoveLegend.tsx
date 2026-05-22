export function LastMoveLegend() {
  return (
    <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
      <span
        aria-hidden="true"
        className="inline-block h-4 w-4 rounded-md ring-2 ring-game-cell-last ring-offset-1 ring-offset-background bg-game-cell"
      />
      <span>= last move</span>
    </div>
  );
}
