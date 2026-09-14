import { describe, expect, it } from "vitest";

import { hasAspectParity } from "~tools/logos/logo-source-parity.ts";
import { resolveSeed } from "~tools/logos/logo-resolve.ts";
import { LOGO_SEEDS } from "~tools/logos/sources.ts";

describe("shipped logo source parity", () => {
  it("rejects Toyota's wide wordmark before it can replace the stacked shipped mark", () => {
    const shipped = '<svg viewBox="0 0 251.4 162.1"/>';
    const refetchedWordmark = '<svg viewBox="0 0 251.35 41.55"/>';
    expect(hasAspectParity(shipped, refetchedWordmark)).toBe(false);
  });

  it("pins Toyota to its matching Commons source even when SVGL offers a candidate", () => {
    const toyota = LOGO_SEEDS.find((seed) => seed.slug === "toyota")!;
    const resolved = resolveSeed(
      toyota,
      new Map([["Toyota", { title: "Toyota", route: "https://svgl.app/library/toyota.svg" }]]),
      new Map([[toyota.wikipedia, "a-different-p154.svg"]]),
    );
    expect(resolved).toMatchObject({ source: "commons", fileName: "Toyota Symbol.svg" });
  });
});
