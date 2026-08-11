// Ultra mode by Kirk Strobeck – https://UltraDarkMode.com

/*
  The whole appearance state: a colour mode, an Ultra switch and the headroom
  the Ultra fill is painted at. The first two are stamped on <html> as data
  attributes so CSS is the only consumer. There is no System option — light and
  dark are the two states, and dark is the default.

  Ultra is a dark-mode feature today. Light-mode Ultra is deferred, so every
  writer here routes through `settle`, which is the single place that says a
  light page cannot be Ultra.

  Headroom drives the WebGPU Ultra fill only. The hero photo's gain map has its
  own headroom baked in at encode time and cannot follow this number.
*/

export type Mode = "dark" | "light";
export type Ultra = "on" | "off";

export type Appearance = {
  mode: Mode;
  ultra: Ultra;
  headroom: number;
};

export const MODE_STORAGE_KEY = "udm-mode";
export const ULTRA_STORAGE_KEY = "udm-ultra";
export const HEADROOM_STORAGE_KEY = "udm-headroom";

/*
  Headroom in multiples of SDR white. The floor is strictly above 1.0 because
  1.0 *is* SDR reference white: at exactly 1 the fill is ordinary white and the
  control looks broken, and below it the word would be dimmer than the page's
  own ink. The ceiling is well past any shipping display's headroom, so the
  slider runs out of visible effect before it runs out of travel.
*/
export const HEADROOM_MIN = 1.1;
export const HEADROOM_MAX = 6;
export const HEADROOM_STEP = 0.1;
export const DEFAULT_HEADROOM = 2.2;

export const DEFAULT_APPEARANCE: Appearance = {
  mode: "dark",
  ultra: "off",
  headroom: DEFAULT_HEADROOM,
};

export function isMode(value: unknown): value is Mode {
  return value === "dark" || value === "light";
}

export function isUltra(value: unknown): value is Ultra {
  return value === "on" || value === "off";
}

/*
  Storage is a text file a visitor can edit, so every read is clamped: a stored
  0, a NaN or a 400 would otherwise reach the WebGPU clear value directly.
*/
export function clampHeadroom(value: unknown): number {
  const headroom =
    typeof value === "number" ? value : Number.parseFloat(String(value ?? ""));
  if (!Number.isFinite(headroom)) return DEFAULT_HEADROOM;
  return Math.min(HEADROOM_MAX, Math.max(HEADROOM_MIN, headroom));
}

/** Light mode has no Ultra yet, so a light page is always Ultra off. */
export function settle(appearance: Appearance): Appearance {
  const headroom = clampHeadroom(appearance.headroom);
  if (appearance.mode === "light") return { mode: "light", ultra: "off", headroom };
  return { ...appearance, headroom };
}

export function readAppearance(): Appearance {
  if (typeof window === "undefined") return DEFAULT_APPEARANCE;
  try {
    const mode = window.localStorage.getItem(MODE_STORAGE_KEY);
    const ultra = window.localStorage.getItem(ULTRA_STORAGE_KEY);
    const headroom = window.localStorage.getItem(HEADROOM_STORAGE_KEY);
    return settle({
      mode: isMode(mode) ? mode : DEFAULT_APPEARANCE.mode,
      ultra: isUltra(ultra) ? ultra : DEFAULT_APPEARANCE.ultra,
      headroom: clampHeadroom(headroom),
    });
  } catch {
    return DEFAULT_APPEARANCE;
  }
}

export function applyAppearance(appearance: Appearance): void {
  const root = document.documentElement;
  root.dataset.mode = appearance.mode;
  root.dataset.ultra = appearance.ultra;
}

export function writeAppearance(appearance: Appearance): Appearance {
  const next = settle(appearance);
  applyAppearance(next);
  try {
    window.localStorage.setItem(MODE_STORAGE_KEY, next.mode);
    window.localStorage.setItem(ULTRA_STORAGE_KEY, next.ultra);
    window.localStorage.setItem(HEADROOM_STORAGE_KEY, String(next.headroom));
  } catch {
    // Quota or private mode. The live DOM attributes still hold this session.
  }
  return next;
}
