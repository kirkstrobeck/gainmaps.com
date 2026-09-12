import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SeamInstrument } from "@/components/seam-instrument";

function renderInstrument(width: number | string = 400, height: number | string = 300) {
  return render(
    <SeamInstrument
      width={width}
      height={height}
      className="aspect-square"
      sdr={<span data-testid="sdr-content">SDR</span>}
      ultra={<span data-testid="ultra-content">Ultra</span>}
    />,
  );
}

describe("SeamInstrument", () => {
  it("renders sdr and ultra content in separate, identically sized layers", () => {
    const { container } = renderInstrument();
    const root = container.querySelector(".inst") as HTMLElement;
    // A single width/height is applied to the shared container — both layers are
    // unstyled siblings of it, so they occupy identical dimensions and the seam
    // between them lines up pixel-for-pixel.
    expect(root.style.width).toBe("400px");
    expect(root.style.height).toBe("300px");
    const layers = container.querySelectorAll(".inst-layer");
    expect(layers).toHaveLength(2);
    expect(layers[1]).toHaveClass("inst-sdr");
    expect(layers[0].querySelector('[data-testid="ultra-content"]')).not.toBeNull();
    expect(layers[1].querySelector('[data-testid="sdr-content"]')).not.toBeNull();
  });

  it("applies extra sdr/ultra layer class names when provided", () => {
    const { container } = render(
      <SeamInstrument
        sdrLayerClassName="extra-sdr"
        ultraLayerClassName="extra-ultra"
        sdr={<span>sdr</span>}
        ultra={<span>ultra</span>}
      />,
    );
    const layers = container.querySelectorAll(".inst-layer");
    expect(layers[0]).toHaveClass("extra-ultra");
    expect(layers[1]).toHaveClass("extra-sdr");
  });

  it("starts the handle centered at 50%", () => {
    renderInstrument();
    expect(screen.getByRole("slider")).toHaveAttribute("aria-valuenow", "50");
  });

  it("dragging from any point in the instrument moves the seam", () => {
    const { container } = renderInstrument();
    const root = container.querySelector(".inst") as HTMLElement;
    Object.defineProperty(root, "getBoundingClientRect", {
      value: () => ({ left: 0, width: 400, top: 0, height: 300, right: 400, bottom: 300 }),
      configurable: true,
    });
    root.setPointerCapture = () => {};
    fireEvent.pointerDown(root, { clientX: 40, clientY: 30, pointerId: 1 });
    expect(parseFloat(root.style.getPropertyValue("--seam-x"))).toBeCloseTo(10, 0);

    fireEvent.pointerMove(root, { clientX: 360, clientY: 30, pointerId: 1 });
    expect(parseFloat(root.style.getPropertyValue("--seam-x"))).toBeCloseTo(90, 0);

    fireEvent.pointerUp(root);
    // After pointer up, further moves without a new pointerdown are ignored.
    fireEvent.pointerMove(root, { clientX: 0, clientY: 30, pointerId: 1 });
    expect(parseFloat(root.style.getPropertyValue("--seam-x"))).toBeCloseTo(90, 0);
  });

  it("pointer cancel stops dragging same as pointer up", () => {
    const { container } = renderInstrument();
    const root = container.querySelector(".inst") as HTMLElement;
    Object.defineProperty(root, "getBoundingClientRect", {
      value: () => ({ left: 0, width: 400, top: 0, height: 300, right: 400, bottom: 300 }),
      configurable: true,
    });
    root.setPointerCapture = () => {};
    fireEvent.pointerDown(root, { clientX: 40, clientY: 30, pointerId: 1 });
    fireEvent.pointerCancel(root);
    fireEvent.pointerMove(root, { clientX: 400, clientY: 30, pointerId: 1 });
    expect(parseFloat(root.style.getPropertyValue("--seam-x"))).toBeCloseTo(10, 0);
  });

  it("arrow right/up keys increase position, arrow left/down decrease, clamped to [0, 100]", () => {
    renderInstrument();
    const slider = screen.getByRole("slider");
    fireEvent.keyDown(slider, { key: "ArrowRight" });
    expect(slider).toHaveAttribute("aria-valuenow", "52");
    fireEvent.keyDown(slider, { key: "ArrowUp" });
    expect(slider).toHaveAttribute("aria-valuenow", "54");
    fireEvent.keyDown(slider, { key: "ArrowLeft" });
    expect(slider).toHaveAttribute("aria-valuenow", "52");
    fireEvent.keyDown(slider, { key: "ArrowDown" });
    expect(slider).toHaveAttribute("aria-valuenow", "50");
    // Unrecognized keys are ignored.
    fireEvent.keyDown(slider, { key: "Enter" });
    expect(slider).toHaveAttribute("aria-valuenow", "50");
  });

  it("corner buttons snap the seam fully to one side and back to the middle", () => {
    renderInstrument();
    fireEvent.click(screen.getByRole("button", { name: "Show Standard" }));
    expect(screen.getByRole("slider")).toHaveAttribute("aria-valuenow", "100");
    expect(screen.getByRole("button", { name: "Show Standard" })).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(screen.getByRole("button", { name: "Show Ultra" }));
    expect(screen.getByRole("slider")).toHaveAttribute("aria-valuenow", "0");
    expect(screen.getByRole("button", { name: "Show Ultra" })).toHaveAttribute("aria-pressed", "true");

    // Dragging again clears the snapped seamSide.
    const root = document.querySelector(".inst") as HTMLElement;
    Object.defineProperty(root, "getBoundingClientRect", {
      value: () => ({ left: 0, width: 400, top: 0, height: 300, right: 400, bottom: 300 }),
      configurable: true,
    });
    root.setPointerCapture = () => {};
    fireEvent.pointerDown(root, { clientX: 200, clientY: 30, pointerId: 1 });
    expect(screen.getByRole("button", { name: "Show Ultra" })).toHaveAttribute("aria-pressed", "false");
  });

  it("removes the animating class once the snap transition finishes", () => {
    vi.useFakeTimers();
    try {
      renderInstrument();
      const root = document.querySelector(".inst") as HTMLElement;
      fireEvent.click(screen.getByRole("button", { name: "Show Standard" }));
      expect(root).toHaveClass("inst--animating");
      vi.advanceTimersByTime(350);
      expect(root).not.toHaveClass("inst--animating");
    } finally {
      vi.useRealTimers();
    }
  });
});
