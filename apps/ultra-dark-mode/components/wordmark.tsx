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

/** Headroom for the fill, in multiples of SDR white. Matches apps/web. */
const INTENSITY = 2.2;

export function Wordmark() {
  const { mode, ultra } = useAppearance();

  if (mode === "dark" && ultra === "on") {
    return (
      <h1 className="m-0">
        <UltraWord word={WORD} typeClassName={TYPE} intensity={INTENSITY} />
      </h1>
    );
  }

  return (
    <h1 className={`m-0 text-[var(--ink)] ${TYPE}`}>{WORD}</h1>
  );
}
