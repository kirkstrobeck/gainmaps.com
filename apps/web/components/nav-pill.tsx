"use client";

import { cn } from "@/lib/utils";

const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]";

export function NavPill({
  leftLabel, rightLabel, leftActive, onLeft, onRight, label,
}: {
  leftLabel: string; rightLabel: string; leftActive: boolean;
  onLeft: () => void; onRight: () => void; label?: string;
}) {
  return (
    <div
      className="inline-flex h-7 items-center rounded-[999px] border border-[var(--border)] bg-[var(--panel)] p-0.5"
      role="group"
      aria-label={label}
    >
      <button
        type="button"
        onClick={onLeft}
        aria-pressed={leftActive}
        className={cn(
          "h-full rounded-[999px] px-2.5 font-mono text-[12px] font-medium transition",
          FOCUS,
          leftActive
            ? "bg-[var(--foreground)] text-[var(--background)]"
            : "text-[var(--muted)] hover:text-[var(--foreground)]",
        )}
      >
        {leftLabel}
      </button>
      <button
        type="button"
        onClick={onRight}
        aria-pressed={!leftActive}
        className={cn(
          "h-full rounded-[999px] px-2.5 font-mono text-[12px] font-medium transition",
          FOCUS,
          !leftActive
            ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
            : "text-[var(--muted)] hover:text-[var(--foreground)]",
        )}
      >
        {rightLabel}
      </button>
    </div>
  );
}
