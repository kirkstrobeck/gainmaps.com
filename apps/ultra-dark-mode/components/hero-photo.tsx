// Ultra mode by Kirk Strobeck – https://UltraDarkMode.com

"use client";

import { useAppearance } from "@/components/appearance-provider";
import { HeroCaption } from "@/components/hero-caption";
import {
  HERO_ALT,
  HERO_SDR,
  HERO_ULTRA,
  heroCaption,
} from "@/lib/hero-photo";

/*
  Two photos of the same mountain, stacked and crossfaded.

  Both stay in the DOM so both stay decoded: the switch is a 600ms opacity
  change, not a network request, and nothing pops. The gain map only does
  anything when html[data-ultra="on"] has lifted dynamic-range-limit — below
  that it is an ordinary JPEG, which is why the SDR copy underneath is enough
  on a display without headroom.

  These are plain <img> elements on purpose. next/image re-encodes through its
  optimizer, which strips the appended gain map image and the MPF marker that
  points at it — the Ultra photo would silently become an ordinary JPEG.
*/
export function HeroPhoto() {
  const { ultra } = useAppearance();
  const on = ultra === "on";
  const shown = on ? HERO_ULTRA : HERO_SDR;

  return (
    <figure className="m-0 flex flex-col gap-3">
      <div className="udm-frame">
        <img src={HERO_SDR.src} alt={HERO_ALT} style={{ opacity: on ? 0 : 1 }} />
        <img
          src={HERO_ULTRA.src}
          alt=""
          aria-hidden
          style={{ opacity: on ? 1 : 0 }}
        />
      </div>
      <HeroCaption file={heroCaption(shown)} state={on ? "Ultra on" : "Ultra off"} />
    </figure>
  );
}
