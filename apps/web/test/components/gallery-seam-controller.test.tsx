/* eslint-disable @next/next/no-img-element -- tests need raw deferred img attributes */
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GallerySeamController } from "@/components/gallery-seam-controller";

function Fixture() {
  return (
    <div data-gallery-seam style={{ "--seam-x": "50%" } as React.CSSProperties}>
      <button role="slider" aria-label="Comparison position" aria-valuenow="50" />
      <button data-seam-snap="100" aria-label="SDR: Show Standard" aria-pressed="false" />
      <button data-seam-snap="0" aria-label="Ultra: Show Ultra" aria-pressed="false" />
      <GallerySeamController />
    </div>
  );
}

describe("GallerySeamController", () => {
  let observerCallback: IntersectionObserverCallback;
  const observe = vi.fn();
  const unobserve = vi.fn();
  const disconnect = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("IntersectionObserver", class {
      constructor(callback: IntersectionObserverCallback) { observerCallback = callback; }
      observe = observe;
      unobserve = unobserve;
      disconnect = disconnect;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("snaps and supports keyboard adjustment through one delegated controller", () => {
    vi.spyOn(window, "setTimeout").mockImplementation((callback: TimerHandler) => {
      if (typeof callback === "function") callback();
      return 1;
    });
    const { container } = render(<Fixture />);
    const sdr = screen.getByRole("button", { name: "SDR: Show Standard" });
    fireEvent.click(sdr);
    expect(container.firstElementChild).toHaveStyle({ "--seam-x": "100.00%" });
    expect(sdr).toHaveAttribute("aria-pressed", "true");

    const slider = screen.getByRole("slider");
    fireEvent.keyDown(slider, { key: "ArrowLeft" });
    expect(slider).toHaveAttribute("aria-valuenow", "98");
    expect(sdr).toHaveAttribute("aria-pressed", "false");
    fireEvent.keyDown(slider, { key: "ArrowDown" });
    fireEvent.keyDown(slider, { key: "ArrowRight" });
    fireEvent.keyDown(slider, { key: "ArrowUp" });
    fireEvent.keyDown(slider, { key: "Enter" });
  });

  it("tracks pointer movement and stops after release", () => {
    const { container } = render(<Fixture />);
    const inst = container.firstElementChild as HTMLElement;
    vi.spyOn(inst, "getBoundingClientRect").mockReturnValue({ left: 10, width: 100 } as DOMRect);
    fireEvent.pointerDown(inst, { pointerId: 2, clientX: 35 });
    fireEvent.pointerMove(inst, { pointerId: 2, clientX: 60 });
    expect(inst).toHaveStyle({ "--seam-x": "50.00%" });
    fireEvent.pointerUp(inst, { pointerId: 2 });
    fireEvent.pointerMove(inst, { pointerId: 2, clientX: 90 });
    expect(inst).toHaveStyle({ "--seam-x": "50.00%" });
    fireEvent.pointerDown(screen.getByRole("button", { name: "SDR: Show Standard" }), { pointerId: 3 });
    fireEvent.pointerMove(inst, { pointerId: 9, clientX: 90 });
    fireEvent.pointerCancel(inst, { pointerId: 9 });
  });

  it("loads deferred images near the viewport and disconnects", () => {
    const { unmount } = render(<><img alt="deferred" data-seam-src="/a.jpg" data-seam-srcset="/a.jpg 1x" /><GallerySeamController /></>);
    const image = screen.getByRole("img");
    expect(observe).toHaveBeenCalledWith(image);
    observerCallback([{ target: image, isIntersecting: false } as IntersectionObserverEntry], {} as IntersectionObserver);
    expect(image).not.toHaveAttribute("src");
    observerCallback([{ target: image, isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver);
    expect(image).toHaveAttribute("src", "/a.jpg");
    expect(unobserve).toHaveBeenCalledWith(image);
    unmount();
    expect(disconnect).toHaveBeenCalled();
  });

  it("loads deferred images immediately without IntersectionObserver", () => {
    vi.stubGlobal("IntersectionObserver", undefined);
    render(<><img alt="fallback" data-seam-src="/fallback.jpg" /><GallerySeamController /></>);
    expect(screen.getByRole("img")).toHaveAttribute("src", "/fallback.jpg");
  });

  it("ignores unrelated pointer, click, and keyboard events", () => {
    render(<><button type="button">outside</button><button data-seam-snap="0">orphan snap</button><button role="slider">orphan slider</button><div data-gallery-seam data-testid="no-slider" /><GallerySeamController /></>);
    const outside = screen.getByRole("button", { name: "outside" });
    fireEvent.pointerDown(outside, { pointerId: 1, clientX: 1 });
    fireEvent.pointerMove(outside, { pointerId: 1, clientX: 2 });
    fireEvent.pointerUp(outside, { pointerId: 1 });
    fireEvent.click(outside);
    fireEvent.keyDown(outside, { key: "Enter" });
    fireEvent.click(screen.getByRole("button", { name: "orphan snap" }));
    fireEvent.keyDown(screen.getByRole("slider"), { key: "ArrowRight" });
    fireEvent.pointerDown(screen.getByTestId("no-slider"), { pointerId: 4, clientX: 5 });
    fireEvent.pointerUp(screen.getByTestId("no-slider"), { pointerId: 4 });
    document.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true }));
  });
});
