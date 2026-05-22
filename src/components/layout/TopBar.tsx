import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface TopBarProps {
  title?: ReactNode;
  subtitle?: ReactNode;
  backHref?: string;
  backLabel?: string;
  right?: ReactNode;
  className?: string;
}

export function TopBar({
  title,
  subtitle,
  backHref = "/",
  backLabel = "Home",
  right,
  className,
}: TopBarProps) {
  return (
    <header
      className={cn(
        "flex items-center justify-between gap-3 mb-6",
        className,
      )}
    >
      <Link href={backHref} aria-label={backLabel}>
        <Button variant="outline" size="sm" className="tap-target">
          <Home className="h-4 w-4" />
          <span className="hidden sm:inline">{backLabel}</span>
        </Button>
      </Link>

      <div className="text-center min-w-0">
        {title && (
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight truncate">
            {title}
          </h1>
        )}
        {subtitle && (
          <div className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            {subtitle}
          </div>
        )}
      </div>

      <div className="flex items-center justify-end min-w-[44px]">{right}</div>
    </header>
  );
}
