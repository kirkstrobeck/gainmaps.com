"use client";

import { DarkModeIcon as MoonFilled, LightModeIcon as SunFilled } from "@/components/icons";
import { useEffect, useMemo, useState } from "react";

import { UltraIcon } from "@/components/ultra-icon";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  clampIntensity,
  DEFAULT_INTENSITY,
  persistAppearance,
  scaleFromIntensity,
  syncLab,
  type AppearanceMode,
  type AppearanceState,
} from "@/lib/appearance-state";
import {
  readSiteIntensity,
  readSiteMode,
  readSiteUltra,
  SITE_APPEARANCE_EVENT,
} from "@/lib/site-appearance";

export type { AppearanceMode, AppearanceState } from "@/lib/appearance-state";

export function AppearanceControls({ initial }: { initial: AppearanceState }) {
  const [mode, setMode] = useState<AppearanceMode>(initial.mode);
  const [system, setSystem] = useState(initial.system);
  const [ultra, setUltra] = useState(initial.ultra);
  const [intensity, setIntensity] = useState(clampIntensity(initial.intensity));
  const [prefersDark, setPrefersDark] = useState(false);

  const state = useMemo<AppearanceState>(() => ({ mode, system, ultra, intensity }), [intensity, mode, system, ultra]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const sync = () => setPrefersDark(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    function onChrome() {
      setMode(readSiteMode());
      setUltra(readSiteUltra() === "on");
      const nextIntensity = readSiteIntensity();
      /* v8 ignore next */
      if (nextIntensity != null) setIntensity(nextIntensity);
    }
    window.addEventListener(SITE_APPEARANCE_EVENT, onChrome);
    return () => window.removeEventListener(SITE_APPEARANCE_EVENT, onChrome);
  }, []);

  useEffect(() => {
    syncLab(state, prefersDark);
    persistAppearance(state);
    return () => {
      delete document.documentElement.dataset.appearanceEdr;
    };
  }, [prefersDark, state]);

  return (
    <div className="appearance-bar-inner">
      <div className="grid gap-3 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--panel-strong)] p-3">

        {/* System row */}
        <div className="flex min-h-10 items-center justify-between gap-3">
          <div className="grid gap-0.5">
            <Label htmlFor="appearance-system" className="text-sm font-semibold">
              System
            </Label>
            <p className="text-xs text-[var(--muted)]">Match OS light / dark</p>
          </div>
          <Switch
            id="appearance-system"
            checked={system}
            onCheckedChange={(next) => {
              /* v8 ignore next */
              if (!next) setMode(prefersDark ? "dark" : "light");
              setSystem(next);
            }}
            aria-label="Use system appearance"
          />
        </div>

        {/* Light / Dark toggle — hidden (not invisible) when System is active so it reclaims height */}
        {!system && (
          <div className="grid gap-1.5">
            <Label className="text-[0.68rem] uppercase tracking-[0.04em] text-[var(--muted)]">
              Appearance
            </Label>
            <ToggleGroup
              type="single"
              value={mode}
              onValueChange={(value) => {
                if (value === "light" || value === "dark") setMode(value);
              }}
              variant="outline"
              disabled={system}
              className="grid w-full grid-cols-2 gap-0 rounded-full border border-[var(--border)] bg-[var(--panel)] p-0.5"
            >
              <ToggleGroupItem value="light" aria-label="Light" className="rounded-full">
                <UltraIcon size={16}>
                  <SunFilled />
                </UltraIcon>
                Light
              </ToggleGroupItem>
              <ToggleGroupItem value="dark" aria-label="Dark" className="rounded-full">
                <UltraIcon size={16}>
                  <MoonFilled />
                </UltraIcon>
                Dark
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        )}

        {/* Ultra row */}
        <div className="flex min-h-10 items-center justify-between gap-3">
          <div className="grid gap-0.5">
            <Label htmlFor="appearance-ultra" className="text-sm font-semibold">
              Ultra
            </Label>
            <p className="text-xs text-[var(--muted)]">Brighter than SDR white</p>
          </div>
          <Switch
            id="appearance-ultra"
            checked={ultra}
            onCheckedChange={(next) => {
              setUltra(next);
              if (next && intensity <= 0) setIntensity(DEFAULT_INTENSITY);
            }}
            aria-label="Enable Ultra"
          />
        </div>

        {/* Intensity row — hidden when Ultra is off so it reclaims height on mobile */}
        {ultra && (
          <div className="grid gap-2">
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="appearance-intensity" className="text-xs text-[var(--muted)]">
                Headroom
              </Label>
              <span className="font-mono text-xs tabular-nums text-[var(--accent)]">
                {scaleFromIntensity(intensity).toFixed(2)}×
              </span>
            </div>
            <Slider
              id="appearance-intensity"
              min={0}
              max={100}
              step={1}
              value={[intensity]}
              /* v8 ignore next */
              onValueChange={(value) => setIntensity(clampIntensity(value[0] ?? DEFAULT_INTENSITY))}
              aria-label="Ultra intensity"
            />
          </div>
        )}
      </div>
    </div>
  );
}
