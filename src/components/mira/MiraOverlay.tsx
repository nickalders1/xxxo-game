"use client";

import { useEffect, useState } from "react";
import { Volume2, VolumeX, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MiraOverlayProps {
  line: string | null;
  voiceEnabled: boolean;
  onToggleVoice: (v: boolean) => void;
  onDismiss: () => void;
  className?: string;
}

/**
 * Subtle banner that displays Mira's current line. Fades in when a new line
 * arrives, stays for a few seconds, then can be dismissed manually. Lives at
 * the bottom of the game card (mobile-friendly: above the safe-area bottom).
 */
export function MiraOverlay({
  line,
  voiceEnabled,
  onToggleVoice,
  onDismiss,
  className,
}: MiraOverlayProps) {
  const [visible, setVisible] = useState(false);
  const [displayLine, setDisplayLine] = useState<string | null>(null);

  // Update displayed line when the prop changes — but keep the previous line
  // briefly visible during the swap so it doesn't flicker.
  useEffect(() => {
    if (!line) {
      setVisible(false);
      return;
    }
    setDisplayLine(line);
    setVisible(true);
    // Auto-fade after 8 seconds of silence (next line resets the timer).
    const t = setTimeout(() => setVisible(false), 8000);
    return () => clearTimeout(t);
  }, [line]);

  if (!displayLine) return null;

  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card/95 backdrop-blur",
        "shadow-lg px-4 py-3",
        "flex items-start gap-3",
        "transition-all duration-300",
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none",
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-game-o-soft text-game-o font-bold text-sm">
        M
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-0.5">
          Mira
        </div>
        <p className="text-sm leading-snug text-foreground">{displayLine}</p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => onToggleVoice(!voiceEnabled)}
          aria-label={voiceEnabled ? "Mute Mira" : "Unmute Mira"}
          aria-pressed={voiceEnabled}
          className="h-7 w-7"
        >
          {voiceEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="h-7 w-7"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
