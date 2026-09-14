#!/usr/bin/env npx tsx
// Gainmaps by Kirk Strobeck – https://gainmaps.com
import { readFile, writeFile } from "node:fs/promises";

import { resizeRgbaSquare } from "./encode-logo-variants.ts";
import { CANVAS, rasterizeUnchecked } from "./logo-pipeline.ts";
import { normalizeLogoSvg } from "./logo-svg-normalize.ts";
import { LOGO_SEEDS } from "./sources.ts";

const slugs = ["toyota", "coca-cola", "cisco", "oracle", "spotify", "ikea", "visa"];

function alphaCounts(pixels: Uint8Array): readonly [number, number] {
  let any = 0;
  let guard = 0;
  for (let offset = 3; offset < pixels.length; offset += 4) {
    if (pixels[offset]! > 0) any += 1;
    if (pixels[offset]! > 8) guard += 1;
  }
  return [any, guard];
}

const rows: string[] = ["slug\tdrawablesBefore\tdrawablesAfter\talphaGt0@1024\talphaGt8@1024\talphaGt0@128\talphaGt8@128"];
for (const slug of slugs) {
  const seed = LOGO_SEEDS.find((entry) => entry.slug === slug)!;
  const source = await readFile(`sandbox-shots-tmp/raw-logo-sources/${slug}.svg`);
  const normalized = normalizeLogoSvg(seed, source);
  const drawable = /<(?:path|rect|circle|ellipse|polygon|polyline|line|text|image|use)\b/gi;
  const before = source.toString("utf8").match(drawable)?.length ?? 0;
  const after = normalized.toString("utf8").match(drawable)?.length ?? 0;
  const full = await rasterizeUnchecked(normalized);
  const tile = await resizeRgbaSquare(full, CANVAS, 128);
  rows.push([slug, before, after, ...alphaCounts(full), ...alphaCounts(tile)].join("\t"));
}
const report = `${rows.join("\n")}\n`;
await writeFile("sandbox-shots-tmp/normalized-ink-diagnostic.log", report);
console.log(report);
