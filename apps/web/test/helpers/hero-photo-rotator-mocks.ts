import { vi } from "vitest";

// Shared mocks for the HeroPhotoRotator test suite, split across two test
// files (hero-photo-rotator.test.tsx and hero-photo-rotator-edge-cases.test.tsx)
// to keep each file under the repo's 200-line limit.

export type ObserverCallback = (entries: IntersectionObserverEntry[]) => void;

export const observerCallbackRef: { callback: ObserverCallback | null } = { callback: null };
export const imageCountRef: { count: number } = { count: 0 };

export class MockIntersectionObserver {
  constructor(callback: ObserverCallback) {
    observerCallbackRef.callback = callback;
  }
  observe = vi.fn();
  disconnect = vi.fn();
}

export class MockImage {
  complete = false;
  decoding = "auto";
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  sizes = "";
  src = "";
  srcset = "";
  decode = vi.fn(() => Promise.resolve());
  constructor() {
    imageCountRef.count += 1;
  }
}

export function stubMotion(matches: boolean): void {
  vi.stubGlobal("matchMedia", vi.fn(() => ({
    matches,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
  })));
}
