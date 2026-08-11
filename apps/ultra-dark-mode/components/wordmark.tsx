// Ultra mode by Kirk Strobeck – https://UltraDarkMode.com

"use client";

import { useAppearance } from "@/components/appearance-provider";
import { UltraWord } from "@/components/ultra-word";

/*
  The one accent moment on the page.

  In dark mode with Ultra on, the word is real HDR white: a masked WebGPU
  canvas painted past SDR white (see components/ultra-word). In every other
  state it is a plain heading in --ink. Both branches render the same <h1> with
  the same live text, so the word stays selectable and readable to a screen
  reader either way — the Ultra version only replaces how the ink is painted.
*/

const TYPE =
  "font-[family-name:var(--font-geist-sans)] text-[clamp(72px,17vw,168px)] font-extrabold leading-[0.9] tracking-[-0.04em]";

const WORD = "ULTRA";

export function Wordmark() {
  const { mode, ultra, headroom } = useAppearance();

  // Headroom for the fill, in multiples of SDR white — the headroom slider
  // drives it, and DEFAULT_HEADROOM in lib/appearance.ts is the 2.2 this used
  // to hard-code. The hero photo cannot follow: its gain map is already encoded.
  if (mode === "dark" && ultra === "on") {
    return (
      <h1 className="m-0">
        <UltraWord word={WORD} typeClassName={TYPE} intensity={headroom} />
      </h1>
    );
  }

  return (
    <h1 className={`m-0 text-[var(--ink)] ${TYPE}`}>{WORD}</h1>
  );
}
