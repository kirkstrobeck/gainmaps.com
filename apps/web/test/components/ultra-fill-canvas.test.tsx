import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, render } from "@testing-library/react";
import { UltraFillCanvas } from "@/components/ultra-fill-canvas";
import { SITE_APPEARANCE_EVENT } from "@/lib/site-appearance";

const start = vi.fn(() => ({ poke: vi.fn(), stop: vi.fn() }));

vi.mock("@/lib/ultra-fill", () => ({
  startUltraFill: (...args: unknown[]) => start(...args),
}));

describe("UltraFillCanvas", () => {
  beforeEach(() => {
    start.mockClear();
    document.documentElement.dataset.ultra = "on";
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

  it("waits until the display reports high dynamic range", () => {
    let onChange: (() => void) | undefined;
    const media = {
      matches: false,
      addEventListener: vi.fn((_event: string, listener: () => void) => { onChange = listener; }),
      removeEventListener: vi.fn(),
    };
    vi.stubGlobal("matchMedia", vi.fn(() => media));
    render(<UltraFillCanvas intensity={2} />);
    expect(start).not.toHaveBeenCalled();
    media.matches = true;
    act(() => onChange?.());
    expect(start).toHaveBeenCalledOnce();
  });

  it("uses the readable fallback when matchMedia is unavailable", () => {
    vi.stubGlobal("matchMedia", undefined);
    render(<UltraFillCanvas intensity={2} />);
    expect(start).not.toHaveBeenCalled();
  });

  it("keeps the reserved canvas on SDR without starting GPU work", () => {
    vi.stubGlobal("matchMedia", vi.fn(() => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })));
    const { container } = render(<UltraFillCanvas intensity={2} />);
    expect(container.querySelector("canvas")).toBeInTheDocument();
    expect(start).not.toHaveBeenCalled();
  });

  it("starts a session when ultra is on and tears it down", () => {
    const { unmount } = render(<UltraFillCanvas intensity={4} className="x" />);
    expect(start).toHaveBeenCalled();
    window.dispatchEvent(new Event("resize"));
    document.dispatchEvent(new Event("visibilitychange"));
    window.dispatchEvent(new CustomEvent(SITE_APPEARANCE_EVENT, { detail: { ultra: "off" } }));
    window.dispatchEvent(new CustomEvent(SITE_APPEARANCE_EVENT, { detail: { ultra: "on" } }));
    unmount();
  });

  it("does not start when ultra is off, then starts on appearance event", () => {
    document.documentElement.dataset.ultra = "off";
    render(<UltraFillCanvas intensity={2} />);
    expect(start).not.toHaveBeenCalled();
    window.dispatchEvent(new CustomEvent(SITE_APPEARANCE_EVENT, { detail: { ultra: "on" } }));
    expect(start).toHaveBeenCalled();
  });
});
