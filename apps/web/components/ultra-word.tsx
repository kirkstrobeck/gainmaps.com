// Ultra mode by Kirk Strobeck – https://UltraDarkMode.com

"use client";

import { useId } from "react";

import { ultraOverlayGeometry } from "@/lib/ultra-overlay";

import { UltraFillCanvas } from "./ultra-fill-canvas";

type Props = {
  word: string;
  /** Typography shared by the selectable text and the mask, so they line up. */
  typeClassName: string;
  intensity: number;
};

/*
  The word is painted by an Ultra-white canvas that is masked to the letterforms.
  The canvas is decoration; the real text sits on top, transparent but selectable.
*/
export function UltraWord({ word, typeClassName, intensity }: Props) {
  const maskId = `ultra-word-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const mask = `url(#${maskId})`;
  // Both layers are the same rectangle — see @/lib/ultra-overlay.
  const overlay = ultraOverlayGeometry();

  return (
    <span className="ultra-word relative inline-block">
      <span className={`${typeClassName} text-transparent`}>{word}</span>

      {/*
        select-none keeps the mask's copy of the word out of the selection —
        without it, copying the headline yields the word twice. The svg must
        stay sized and visible: display:none drops the mask and a 0x0 box clips
        it. Size comes from `overlay`, never from h-full w-full, which would pin
        it to the word's box and cut off accents and round overshoot.
      */}
      <svg
        aria-hidden
        className="pointer-events-none select-none"
        style={overlay}
      >
        <defs>
          <mask id={maskId}>
            <text
              x="50%"
              y="50%"
              textAnchor="middle"
              dominantBaseline="central"
              fill="#ffffff"
              className={typeClassName}
            >
              {word}
            </text>
          </mask>
        </defs>
      </svg>

      {/*
        The white floor: the same rectangle through the same mask, in plain SDR
        white, under the canvas. The canvas comes up asynchronously and is
        re-presented whenever the element moves, and the text below it is
        transparent — without this the word blinks out. See globals.css.
      */}
      <span
        aria-hidden
        className="ultra-backdrop"
        style={{ ...overlay, mask, WebkitMask: mask }}
      />

      <UltraFillCanvas
        intensity={intensity}
        className="pointer-events-none"
        style={{ ...overlay, mask, WebkitMask: mask }}
      />
    </span>
  );
}
