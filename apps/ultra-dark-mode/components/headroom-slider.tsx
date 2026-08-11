// Ultra mode by Kirk Strobeck – https://UltraDarkMode.com

"use client";

import { useAppearance } from "@/components/appearance-provider";
import { Slider } from "@/components/ui/slider";
import {
  HEADROOM_MAX,
  HEADROOM_MIN,
  HEADROOM_STEP,
  clampHeadroom,
} from "@/lib/appearance";

/*
  How far past SDR white the Ultra word is painted.

  This drives the WebGPU fill and nothing else. The hero photo's headroom is
  baked into its gain map at encode time and cannot follow a slider, which is
  why the label says "word" and not "Ultra" — a control that silently governs
  half of what it appears to govern is worse than one that admits its scope.

  It lives in a box that hangs off the side of the control pill (.udm-headroom
  in app/chrome.css) so that showing it moves neither of the two controls.
*/
export function HeadroomSlider() {
  const { headroom, setHeadroom } = useAppearance();

  return (
    <div className="udm-headroom">
      {/* Visible name; the thumb carries the same name for a screen reader. */}
      <span className="whitespace-nowrap text-[11px] uppercase tracking-[0.12em] text-[var(--muted)]">
        Word headroom
      </span>

      <Slider
        className="w-[120px]"
        aria-label="Ultra word headroom, in multiples of SDR white"
        min={HEADROOM_MIN}
        max={HEADROOM_MAX}
        step={HEADROOM_STEP}
        value={[headroom]}
        onValueChange={([next]) => setHeadroom(clampHeadroom(next))}
      />

      <span className="w-[38px] shrink-0 text-right font-[family-name:var(--font-geist-mono)] text-[12px] tabular-nums text-[var(--ink)]">
        {headroom.toFixed(1)}x
      </span>
    </div>
  );
}
