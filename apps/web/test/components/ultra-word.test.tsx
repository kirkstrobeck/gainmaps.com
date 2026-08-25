import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { UltraWord } from "@/components/ultra-word";

describe("UltraWord", () => {
  it("renders the word text", () => {
    render(<UltraWord word="Gain" typeClassName="font-bold" intensity={1.5} />);
    expect(screen.getAllByText("Gain").length).toBeGreaterThan(0);
  });

  it("renders the word in an SVG text element for the mask", () => {
    const { container } = render(
      <UltraWord word="maps" typeClassName="font-bold" intensity={1.5} />,
    );
    const textElements = container.querySelectorAll("text");
    const found = Array.from(textElements).some((el) => el.textContent === "maps");
    expect(found).toBe(true);
  });

  it("renders an ultra-word span", () => {
    const { container } = render(
      <UltraWord word="Test" typeClassName="font-bold" intensity={1} />,
    );
    expect(container.querySelector(".ultra-word")).not.toBeNull();
  });
});
