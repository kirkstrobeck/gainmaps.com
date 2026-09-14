import { describe, it, expect } from "vitest";
import { stripBackgroundPlate } from "~tools/logos/logo-svg-normalize.ts";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const REPO_ROOT = join(process.cwd(), "../..");

describe("stripBackgroundPlate", () => {
  it("removes the McDonald's background plate (path18) from the SVG", () => {
    const svg = readFileSync(join(REPO_ROOT, "apps/web/public/logos/mcdonalds/logo.source.svg"), "utf8");
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

  it("strips a first full-canvas rect when painted content follows", () => {
    const svg = '<svg viewBox="0 0 100 100" width="100" height="100"><rect x="0" y="0" width="100" height="100" fill="white"/><circle cx="50" cy="50" r="30" fill="blue"/></svg>';
    const stripped = stripBackgroundPlate(svg);
    expect(stripped).not.toContain("<rect");
    expect(stripped).toContain("<circle");
  });

  it("keeps a Toyota-style multi-subpath full-span path", () => {
    const svg = readFileSync(join(REPO_ROOT, "apps/web/public/logos/toyota/logo.source.svg"), "utf8");
    expect(stripBackgroundPlate(svg)).toBe(svg);
    const isolated = '<svg viewBox="0 0 100 100"><path d="M0 0L100 0L100 100L0 100z M20 20L80 20L80 80z"/><circle cx="50" cy="50" r="10"/></svg>';
    expect(stripBackgroundPlate(isolated)).toBe(isolated);
  });

  it("keeps a one-subpath path with more than 12 drawing commands", () => {
    const svg = '<svg viewBox="0 0 100 100"><path d="M0 0L10 0L20 0L30 0L40 0L50 0L60 0L70 0L80 0L90 0L100 0L100 100L0 100z"/><circle cx="50" cy="50" r="10"/></svg>';
    expect(stripBackgroundPlate(svg)).toBe(svg);
  });

  it("removes the complete paired plate element", () => {
    const svg = '<svg viewBox="0 0 100 100"><rect width="100" height="100">plate text</rect><circle cx="50" cy="50" r="10"/></svg>';
    expect(stripBackgroundPlate(svg)).toBe('<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="10"/></svg>');
  });

  it("keeps a full-canvas rect when no painted drawable follows", () => {
    const svg = '<svg viewBox="0 0 100 100"><rect width="100" height="100" fill="red"/></svg>';
    expect(stripBackgroundPlate(svg)).toBe(svg);
  });

  it("ignores plates in defs, clipPath, and mask", () => {
    const svg = '<svg viewBox="0 0 100 100"><defs><rect width="100" height="100"/></defs><clipPath><rect width="100" height="100"/></clipPath><mask><path d="M0 0L100 0L100 100L0 100z"/></mask><path id="logo" d="M10 10L90 10L90 90z"/></svg>';
    expect(stripBackgroundPlate(svg)).toBe(svg);
  });

  it("does not skip an earlier painted drawable to strip a later plate", () => {
    const svg = '<svg viewBox="0 0 100 100"><circle cx="10" cy="10" r="2"/><rect width="100" height="100"/><path d="M20 20L80 20L80 80z"/></svg>';
    expect(stripBackgroundPlate(svg)).toBe(svg);
  });

  it("skips hidden and unpainted elements when finding the first painted drawable", () => {
    const svg = '<svg viewBox="0 0 100 100"><circle display="none"/><circle fill="none"/><g fill-opacity="0"><circle/></g><rect width="100" height="100"/><path d="M20 20L80 20L80 80z"/></svg>';
    expect(stripBackgroundPlate(svg)).not.toContain("<rect");
  });

  it("does not strip a path that covers less than 78% of the canvas", () => {
    // Small rounded-rect that covers ~50% of 100x100 viewBox
    const svg = '<svg viewBox="0 0 100 100"><path d="M 20,20 L 80,20 L 80,70 L 20,70 Z"/><path d="M 45,45 L 55,45 L 55,55 L 45,55 Z" id="inner"/></svg>';
    expect(stripBackgroundPlate(svg)).toBe(svg);
  });
});
