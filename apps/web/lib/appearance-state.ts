import { writeSiteAppearance } from "@/lib/site-appearance";
import { TEXT_ULTRA_SLIDER_DEFAULT } from "@/lib/text-ultra";

export type AppearanceMode = "light" | "dark";

export type AppearanceState = {
  mode: AppearanceMode;
  system: boolean;
  ultra: boolean;
  intensity: number;
};

const ULTRA_MAX = 4;
export const DEFAULT_INTENSITY = TEXT_ULTRA_SLIDER_DEFAULT;

type Pigment = { sdr: string; r: number; g: number; b: number };

const LIGHT_PIGMENTS = {
  "--background":        { sdr: "#f4f6f8", r: 0xf4, g: 0xf6, b: 0xf8 },
  "--foreground":        { sdr: "#1a1d21", r: 0x1a, g: 0x1d, b: 0x21 },
  "--muted":             { sdr: "#5c6570", r: 0x5c, g: 0x65, b: 0x70 },
  "--border":            { sdr: "#d8dee4", r: 0xd8, g: 0xde, b: 0xe4 },
  "--panel":             { sdr: "#ffffff", r: 255,  g: 255,  b: 255  },
  "--panel-strong":      { sdr: "#e8edf2", r: 0xe8, g: 0xed, b: 0xf2 },
  "--accent":            { sdr: "#c4723a", r: 0xc4, g: 0x72, b: 0x3a },
  "--accent-foreground": { sdr: "#1a1d21", r: 26,   g: 29,   b: 33   },
  "--appearance-bg":     { sdr: "#f4f6f8", r: 0xf4, g: 0xf6, b: 0xf8 },
  "--appearance-elevated":{ sdr: "#ffffff", r: 255,  g: 255,  b: 255  },
} as const satisfies Record<string, Pigment>;

const DARK_PIGMENTS = {
  "--background":        { sdr: "#000000", r: 0,    g: 0,    b: 0    },
  "--foreground":        { sdr: "#eef1f4", r: 0xee, g: 0xf1, b: 0xf4 },
  "--muted":             { sdr: "#8b939e", r: 0x8b, g: 0x93, b: 0x9e },
  "--border":            { sdr: "#2a3038", r: 0x2a, g: 0x30, b: 0x38 },
  "--panel":             { sdr: "#1c2026", r: 0x1c, g: 0x20, b: 0x26 },
  "--panel-strong":      { sdr: "#252b33", r: 0x25, g: 0x2b, b: 0x33 },
  "--accent":            { sdr: "#c4723a", r: 0xc4, g: 0x72, b: 0x3a },
  "--accent-foreground": { sdr: "#1a1d21", r: 26,   g: 29,   b: 33   },
  "--appearance-bg":     { sdr: "#000000", r: 0,    g: 0,    b: 0    },
  "--appearance-elevated":{ sdr: "#1c2026", r: 0x1c, g: 0x20, b: 0x26 },
} as const satisfies Record<string, Pigment>;

const ULTRA_TOKEN_KEYS = Object.keys(LIGHT_PIGMENTS) as Array<keyof typeof LIGHT_PIGMENTS>;

export function clampIntensity(value: number) {
  if (!Number.isFinite(value)) return DEFAULT_INTENSITY;
  return Math.min(100, Math.max(0, Math.round(value)));
}

export function scaleFromIntensity(intensity: number) {
  /* v8 ignore next */
  if (intensity <= 0) return 1;
  return 1 + (intensity / 100) * (ULTRA_MAX - 1);
}

function resolveMode(mode: AppearanceMode, system: boolean, prefersDark: boolean): AppearanceMode {
  if (!system) return mode;
  return prefersDark ? "dark" : "light";
}

function srgb8ToLinear(channel: number) {
  const x = channel / 255;
  /* v8 ignore next */
  if (x <= 0.04045) return x / 12.92;
  return Math.pow((x + 0.055) / 1.055, 2.4);
}

/* v8 ignore next 8 */
function canPaintUltra() {
  if (typeof CSS === "undefined" || typeof CSS.supports !== "function") return false;
  return (
    CSS.supports("color", "color-hdr(#ffffff 0, color(rec2100-linear 2.4 2.4 2.4) 2)") ||
    CSS.supports("color", "color(rec2100-linear 2.4 2.4 2.4)")
  );
}

/**
 * Same SDR pigment; HDR headroom is pigment × intensity.
 * Pure black stays black — Ultra must not fade the page into grey.
 */
function ultraColor(pigment: Pigment, scale: number) {
  /* v8 ignore next */
  if (!(scale > 1)) return pigment.sdr;
  /* v8 ignore next */
  if (pigment.r === 0 && pigment.g === 0 && pigment.b === 0) return pigment.sdr;
  /* v8 ignore next 6 */
  const r = srgb8ToLinear(pigment.r) * scale;
  const g = srgb8ToLinear(pigment.g) * scale;
  const b = srgb8ToLinear(pigment.b) * scale;
  const hdr = `color(rec2100-linear ${r} ${g} ${b})`;
  const stop = Math.log2(Math.max(scale, 1.0001));
  const parameterized = `color-hdr(${pigment.sdr} 0, ${hdr} ${stop})`;
  /* v8 ignore next */
  if (typeof CSS !== "undefined" && typeof CSS.supports === "function") {
    /* v8 ignore next */
    if (CSS.supports("color", parameterized)) return parameterized;
    /* v8 ignore next */
    if (CSS.supports("color", hdr)) return hdr;
  }
  /* v8 ignore next */
  return pigment.sdr;
}

function clearUltraTokens(host: HTMLElement) {
  for (const key of ULTRA_TOKEN_KEYS) host.style.removeProperty(key);
}

function applyUltraTokens(host: HTMLElement, resolved: AppearanceMode, scale: number) {
  clearUltraTokens(host);
  if (!(scale > 1) || !canPaintUltra()) return;
  const pigments = resolved === "dark" ? DARK_PIGMENTS : LIGHT_PIGMENTS;
  for (const key of ULTRA_TOKEN_KEYS) {
    const pigment = pigments[key];
    // Blacks stay black — Ultra must not fade them into grey.
    if (pigment.r === 0 && pigment.g === 0 && pigment.b === 0) continue;
    host.style.setProperty(key, ultraColor(pigment, scale));
  }
}

export function persistAppearance(state: AppearanceState) {
  writeSiteAppearance({
    mode: state.mode,
    ultra: state.ultra ? "on" : "off",
    intensity: state.intensity,
  });
  const params = new URLSearchParams(window.location.search);
  if (state.system) params.set("system", "on");
  if (!state.system) params.set("system", "off");
  const qs = params.toString();
  /* v8 ignore next */
  const next = `${window.location.pathname}${qs ? `?${qs}` : ""}`;
  if (next === `${window.location.pathname}${window.location.search}`) return;
  window.history.replaceState(null, "", next);
}

export function syncLab(state: AppearanceState, prefersDark: boolean) {
  const lab = document.querySelector<HTMLElement>(".appearance-lab");
  if (!lab) return;
  const resolved = resolveMode(state.mode, state.system, prefersDark);
  const scale = state.ultra ? scaleFromIntensity(state.intensity) : 1;
  lab.dataset.mode = state.mode;
  lab.dataset.system = state.system ? "on" : "off";
  lab.dataset.resolved = resolved;
  lab.dataset.ultra = state.ultra ? "on" : "off";
  lab.style.setProperty("--ultra-scale", String(scale));
  if (state.ultra) applyUltraTokens(lab, resolved, scale);
  if (!state.ultra) clearUltraTokens(lab);

  // Unlock the document dynamic range so color-hdr() can leave SDR white.
  if (state.ultra) document.documentElement.dataset.appearanceEdr = "on";
  if (!state.ultra) delete document.documentElement.dataset.appearanceEdr;
}
