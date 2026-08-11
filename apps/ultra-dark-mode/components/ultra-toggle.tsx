// Ultra mode by Kirk Strobeck – https://UltraDarkMode.com

"use client";

import { useAppearance } from "@/components/appearance-provider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/*
  The Ultra toggle.

  Light-mode Ultra is deferred, so in light mode this is disabled and says so.
  It is not hidden: the feature exists, it simply has no light form yet, and a
  control that disappears reads as a bug. `settle()` in lib/appearance.ts is
  what actually enforces the rule — this is only how it looks.

  disabled:pointer-events-auto overrides the ported Button's base style: with
  pointer events off, the browser never shows the title, and the tooltip is the
  whole explanation.
*/

const SHAPE =
  "h-8 rounded-full px-[14px] text-[12px] font-medium uppercase tracking-[0.09em] disabled:pointer-events-auto disabled:cursor-not-allowed";

const OFF = "border-[var(--line)] bg-transparent text-[var(--muted)]";
const ON = "udm-ultra-on border-transparent bg-[var(--ink)] text-[var(--bg)]";

export function UltraToggle() {
  const { mode, ultra, setUltra } = useAppearance();
  const deferred = mode === "light";
  const on = ultra === "on";
  const label = deferred ? "Ultra light mode is coming" : "Ultra";

  return (
    <Button
      variant="ghost"
      disabled={deferred}
      aria-pressed={on}
      aria-label={label}
      title={deferred ? label : undefined}
      onClick={() => setUltra(on ? "off" : "on")}
      className={cn(SHAPE, on ? ON : OFF)}
    >
      Ultra
    </Button>
  );
}
