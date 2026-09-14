import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render } from "@testing-library/react";

import { UltraWord } from "@/components/ultra-word";
import { foundationHeadroomFor, TEXT_ULTRA_FOUNDATION_RATIO } from "@/lib/text-ultra";

const start = vi.fn(() => ({ poke: vi.fn(), stop: vi.fn() }));

vi.mock("@/lib/ultra-fill", () => ({
  startUltraFill: (...args: unknown[]) => start(...args),
}));

function rect(): DOMRect {
  return { left: 10, top: 20, height: 30 } as DOMRect;
}

describe("UltraWord", () => {
  beforeEach(() => {
    start.mockClear();
    document.documentElement.dataset.ultra = "on";
    Object.defineProperty(Range.prototype, "getBoundingClientRect", { configurable: true, value: rect });
    vi.stubGlobal("matchMedia", vi.fn(() => ({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })));
  });

  afterEach(() => {
    delete document.documentElement.dataset.ultra;
    vi.unstubAllGlobals();
  });

  it("keeps static mask and canvas boxes in SSR-compatible markup on SDR", () => {
    vi.stubGlobal("matchMedia", vi.fn(() => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })));
    const { container } = render(<UltraWord text="Gain" typeClassName="font-bold" intensity={1.5} />);
    expect(container.querySelectorAll("mask")).toHaveLength(2);
    expect(container.querySelectorAll("canvas")).toHaveLength(2);
    expect(start).not.toHaveBeenCalled();
  });

  it("renders both masks and canvases immediately on HDR", () => {
    const { container } = render(<UltraWord text="Gain" typeClassName="font-bold" intensity={1.5} />);
    expect(container.querySelector("mask text")).toHaveTextContent("Gain");
    expect(container.querySelectorAll("canvas")).toHaveLength(2);
    expect(start).toHaveBeenCalledTimes(2);
  });

  it("keeps the selectable word readable as the fallback", () => {
    const { container } = render(<UltraWord text="Gain" typeClassName="font-bold" intensity={1.5} />);
    const readable = container.querySelector(".ultra-word > span");
    expect(readable).toHaveClass("text-[var(--foreground)]");
    expect(readable).not.toHaveClass("text-transparent");
  });

  it("uses SVG text rather than foreignObject for the mask", () => {
    const { container } = render(<UltraWord text="maps" typeClassName="font-bold" intensity={1.5} />);
    expect(container.querySelector("mask text")).toHaveTextContent("maps");
    expect(container.querySelector("foreignObject")).toBeNull();
  });

  it("groups wrapped text fragments into one SVG mask line", () => {
    const { container } = render(<UltraWord text="Gain maps" typeClassName="font-bold" intensity={1} />);
    expect(container.querySelector("mask text")).toHaveTextContent("Gain maps");
  });

  it("uses a 0.5px inset mask and softened top Ultra fill", () => {
    const { container } = render(<UltraWord text="Glow" typeClassName="font-bold" intensity={4} />);
    const insetMask = container.querySelectorAll("mask")[1];
    const insetText = insetMask?.querySelector("text");
    expect(insetText?.getAttribute("stroke-width")).toBe("1");
    expect(insetText?.getAttribute("filter")).toMatch(/^url\(#.+b\)$/);
    expect(container.querySelector("feGaussianBlur")?.getAttribute("stdDeviation")).toBe("0.3");
    const foundation = container.querySelector(".ultra-word > .ultra-fill-foundation");
    const inner = container.querySelector(".ultra-word > .ultra-fill-inner");
    expect(foundation).toBeInTheDocument();
    expect(foundation?.getAttribute("data-ultra-headroom")).toBe(String(foundationHeadroomFor(4)));
    expect(TEXT_ULTRA_FOUNDATION_RATIO).toBe(0.75);
    expect(inner).toBeInTheDocument();
    expect(inner?.getAttribute("data-ultra-headroom")).toBe("4");
  });
});
