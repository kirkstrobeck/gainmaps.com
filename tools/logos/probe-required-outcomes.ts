#!/usr/bin/env npx tsx
import { inkMetric, shouldKeep } from "./ink-metric.ts";
import { mkdir, writeFile } from "node:fs/promises";
import { downloadSvg, errorMessage } from "./logo-pipeline.ts";
import { fetchSvglIndex, resolveCommonsFiles, resolveSeed } from "./logo-resolve.ts";
import { LOGO_SEEDS } from "./sources.ts";

const wanted = new Set([
  "coca-cola", "cisco", "oracle", "tesla", "visa", "google", "mcdonalds",
  "netflix", "ikea", "spotify", "toyota", "microsoft", "youtube",
]);
const seeds = LOGO_SEEDS.filter((seed) => wanted.has(seed.slug));
await mkdir("sandbox-shots-tmp/required-raw", { recursive: true });
const svgl = await fetchSvglIndex();
const commons = await resolveCommonsFiles(seeds);
for (const seed of seeds) {
  const resolved = resolveSeed(seed, svgl, commons);
  if (resolved.url === null) {
    console.log(`${seed.slug}\tFETCH-FAIL\tno SVG URL`);
    continue;
  }
  const source = await downloadSvg(resolved.url).catch((error: unknown) => errorMessage(error));
  if (typeof source === "string") {
    console.log(`${seed.slug}\tFETCH-FAIL\t${source}`);
    continue;
  }
  await writeFile(`sandbox-shots-tmp/required-raw/${seed.slug}.svg`, source);
  const metric = await inkMetric(seed, source).catch((error: unknown) => errorMessage(error));
  if (typeof metric === "string") {
    console.log(`${seed.slug}\t-\t-\t-\t-\t${resolved.source}\t${resolved.fileName}\tERROR: ${metric}`);
    continue;
  }
  console.log([
    seed.slug, metric.score.toFixed(6), metric.meanAlpha.toFixed(6),
    metric.solidFraction.toFixed(6), metric.inkPixels, resolved.source,
    resolved.fileName, shouldKeep(metric) ? "KEEP" : "DROP",
  ].join("\t"));
}
