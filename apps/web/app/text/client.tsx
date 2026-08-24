"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";

import { SiteNav } from "@/components/site-nav";
import { UltraWord } from "@/components/ultra-word";
import {
  sliderToHeadroom,
  TEXT_ULTRA_SLIDER_DEFAULT,
} from "@/lib/text-ultra";

function sliderFromSearch(raw: string | null): number {
  const v = Number(raw ?? String(TEXT_ULTRA_SLIDER_DEFAULT));
  if (!Number.isFinite(v)) return TEXT_ULTRA_SLIDER_DEFAULT;
  return Math.min(100, Math.max(0, Math.round(v)));
}

export function TextPageClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [slider, setSlider] = useState(() => sliderFromSearch(searchParams.get("intensity")));
  const headroom = sliderToHeadroom(slider);

  function handleIntensity(next: number) {
    const clamped = sliderFromSearch(String(next));
    setSlider(clamped);
    const params = new URLSearchParams(window.location.search);
    params.set("intensity", String(clamped));
    router.replace(`?${params.toString()}`);
  }

  return (
    <main>
      <SiteNav />
      <section className="mx-auto max-w-7xl space-y-8 px-4 py-12 sm:px-6 lg:px-8">
        <header>
          <h1 className="font-display text-4xl font-bold leading-[1.03] tracking-normal sm:text-5xl">
            Ultra text demo
          </h1>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
            Drag the slider to push text past SDR reference white.
          </p>
        </header>

        <div className="ultra-surface overflow-hidden rounded-[var(--radius)] border border-[var(--border)] bg-[var(--panel)]">
          {/* UltraWord stage */}
          <div
            className="flex min-h-[18rem] flex-col justify-center gap-5 px-8 py-10"
            style={{
              background: "color-mix(in srgb, var(--accent) 5%, var(--panel))",
            }}
          >
            <UltraWord
              word="Gainmaps"
              typeClassName="font-display text-6xl font-bold sm:text-7xl lg:text-8xl"
              intensity={headroom}
            />
            <UltraWord
              word="Ultra"
              typeClassName="font-display text-3xl font-bold sm:text-4xl"
              intensity={headroom}
            />
            <UltraWord
              word="HDR"
              typeClassName="font-display text-xl font-bold sm:text-2xl"
              intensity={headroom}
            />
          </div>

          {/* Instrument slider bar */}
          <div className="flex items-center gap-4 border-t border-[var(--border)] px-6 py-4">
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={slider}
              onChange={(event) => handleIntensity(Number(event.target.value))}
              className="flex-1 accent-[var(--accent)]"
              aria-label="Intensity"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={slider}
            />
            <span className="w-14 text-right font-mono text-sm tabular-nums text-[var(--muted)]">
              {headroom.toFixed(2)}×
            </span>
          </div>
        </div>
      </section>
    </main>
  );
}
