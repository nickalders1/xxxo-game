"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Difficulty } from "@/lib/game/types";

interface DifficultySelectorProps {
  value: Difficulty;
  onChange: (next: Difficulty) => void;
  disabled?: boolean;
}

const LABELS: Record<Difficulty, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
};

export function DifficultySelector({ value, onChange, disabled }: DifficultySelectorProps) {
  return (
    <Select
      value={value}
      onValueChange={(v) => onChange(v as Difficulty)}
      disabled={disabled}
    >
      <SelectTrigger className="w-36">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="easy">{LABELS.easy}</SelectItem>
        <SelectItem value="medium">{LABELS.medium}</SelectItem>
        <SelectItem value="hard">{LABELS.hard}</SelectItem>
      </SelectContent>
    </Select>
  );
}
