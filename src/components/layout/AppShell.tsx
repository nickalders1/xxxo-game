import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface AppShellProps {
  children: ReactNode;
  className?: string;
  /** When true, removes the default container max-width so the page can go edge-to-edge */
  fullBleed?: boolean;
}

export function AppShell({ children, className, fullBleed }: AppShellProps) {
  return (
    <div className={cn("min-h-screen bg-background text-foreground safe-x", className)}>
      <div
        className={cn(
          "mx-auto safe-top safe-bottom",
          !fullBleed && "container px-4 py-6 sm:py-8 max-w-5xl",
        )}
      >
        {children}
      </div>
    </div>
  );
}
