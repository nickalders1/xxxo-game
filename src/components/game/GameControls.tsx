"use client";

import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";

interface GameControlsProps {
  onReset: () => void;
  resetLabel?: string;
}

export function GameControls({ onReset, resetLabel = "Nieuwe partij" }: GameControlsProps) {
  return (
    <Button
      type="button"
      onClick={onReset}
      variant="default"
      size="lg"
      className="w-full"
    >
      <RotateCcw className="h-4 w-4" />
      {resetLabel}
    </Button>
  );
}
