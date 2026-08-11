// Ultra mode by Kirk Strobeck – https://UltraDarkMode.com

/*
  The whole appearance state: a colour mode and an Ultra switch, both stamped
  on <html> as data attributes so CSS is the only consumer. There is no System
  option — light and dark are the two states, and dark is the default.

  Ultra is a dark-mode feature today. Light-mode Ultra is deferred, so every
  writer here routes through `settle`, which is the single place that says a
  light page cannot be Ultra.
*/

export type Mode = "dark" | "light";
export type Ultra = "on" | "off";

export type Appearance = {
  mode: Mode;
  ultra: Ultra;
};

export const MODE_STORAGE_KEY = "udm-mode";
export const ULTRA_STORAGE_KEY = "udm-ultra";

export const DEFAULT_APPEARANCE: Appearance = { mode: "dark", ultra: "off" };

export function isMode(value: unknown): value is Mode {
  return value === "dark" || value === "light";
}

export function isUltra(value: unknown): value is Ultra {
  return value === "on" || value === "off";
}

/** Light mode has no Ultra yet, so a light page is always Ultra off. */
export function settle(appearance: Appearance): Appearance {
  if (appearance.mode === "light") return { mode: "light", ultra: "off" };
  return appearance;
}

export function readAppearance(): Appearance {
  if (typeof window === "undefined") return DEFAULT_APPEARANCE;
  try {
    const mode = window.localStorage.getItem(MODE_STORAGE_KEY);
    const ultra = window.localStorage.getItem(ULTRA_STORAGE_KEY);
    return settle({
      mode: isMode(mode) ? mode : DEFAULT_APPEARANCE.mode,
      ultra: isUltra(ultra) ? ultra : DEFAULT_APPEARANCE.ultra,
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
  } catch {
    // Quota or private mode. The live DOM attributes still hold this session.
  }
  return next;
}
