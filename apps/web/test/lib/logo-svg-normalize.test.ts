import { describe, it, expect } from "vitest";
import { stripBackgroundPlate } from "~tools/logos/logo-svg-normalize.ts";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const REPO_ROOT = join(process.cwd(), "../..");

describe("stripBackgroundPlate", () => {
  it("removes the McDonald's background plate (path18) from the SVG", () => {
    const svg = readFileSync(join(REPO_ROOT, "apps/web/public/logos/mcdonalds/logo.svg"), "utf8");
    const stripped = stripBackgroundPlate(svg);
    // path18 (the full-canvas white plate) should be gone
    expect(stripped).not.toContain('id="path18"');
    // The golden arches path (path20) should still be there
    expect(stripped).toContain('id="path20"');
  });

  it("does not strip a small rect background", () => {
    const svg = '<svg viewBox="0 0 100 100" width="100" height="100"><rect x="20" y="20" width="30" height="30" fill="red"/><text>foo</text></svg>';
    const stripped = stripBackgroundPlate(svg);
    expect(stripped).toContain("<rect");
  });

  it("strips a full-canvas rect", () => {
    const svg = '<svg viewBox="0 0 100 100" width="100" height="100"><rect x="0" y="0" width="100" height="100" fill="white"/><circle cx="50" cy="50" r="30" fill="blue"/></svg>';
    const stripped = stripBackgroundPlate(svg);
    expect(stripped).not.toContain("<rect");
    expect(stripped).toContain("<circle");
  });

  it("does not strip a path that covers less than 78% of the canvas", () => {
    // Small rounded-rect that covers ~50% of 100x100 viewBox
    const svg = '<svg viewBox="0 0 100 100"><path d="M 20,20 L 80,20 L 80,70 L 20,70 Z"/><path d="M 45,45 L 55,45 L 55,55 L 45,55 Z" id="inner"/></svg>';
    const stripped = stripBackgroundPlate(svg);
    expect(stripped).toContain("id=\"inner\"");
  });
});
