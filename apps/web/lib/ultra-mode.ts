export type UltraMode = "on" | "off";

export const ULTRA_MODE_STORAGE_KEY = "hdr-lab-ultra-mode";
/** Prefer reading this first so older sessions keep their Off/On choice. */
const LEGACY_GAIN_MAP_MODE_STORAGE_KEY = "hdr-lab-gainmap-mode";
export const ULTRA_MODE_EVENT = "hdr-lab-ultra-mode";
export const DEFAULT_ULTRA_MODE: UltraMode = "on";

export function isUltraMode(value: string | null | undefined): value is UltraMode {
  return value === "on" || value === "off";
}

export function readUltraMode(): UltraMode {
  if (typeof window === "undefined") return DEFAULT_ULTRA_MODE;
  try {
    const stored = window.localStorage.getItem(ULTRA_MODE_STORAGE_KEY);
    if (isUltraMode(stored)) return stored;
    const legacy = window.localStorage.getItem(LEGACY_GAIN_MAP_MODE_STORAGE_KEY);
    if (isUltraMode(legacy)) return legacy;
  } catch {
    return DEFAULT_ULTRA_MODE;
  }
  return DEFAULT_ULTRA_MODE;
}

export function applyUltraMode(mode: UltraMode): void {
  document.documentElement.dataset.ultra = mode;
}

export function writeUltraMode(mode: UltraMode): void {
  applyUltraMode(mode);
  try {
    window.localStorage.setItem(ULTRA_MODE_STORAGE_KEY, mode);
  } catch {
    // Ignore quota / private-mode failures; the live DOM attribute still applies.
  }
  window.dispatchEvent(new CustomEvent(ULTRA_MODE_EVENT, { detail: mode }));
}
