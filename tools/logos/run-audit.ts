#!/usr/bin/env npx tsx
// Gainmaps by Kirk Strobeck – https://gainmaps.com
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { stripBackgroundPlate } from "./logo-svg-normalize.ts";
import { inkMetric, shouldKeep, BRIGHT_FRACTION_THRESHOLD } from "./ink-metric.ts";
import { downloadSvg, errorMessage } from "./logo-pipeline.ts";
import { fetchSvglIndex, resolveCommonsFiles, resolveSeed } from "./logo-resolve.ts";
import { LOGO_SEEDS } from "./sources.ts";

// Use all seeds (not just COMPANIES) so excluded slugs are judged too.
const seeds = LOGO_SEEDS;
const svgl = await fetchSvglIndex();
const commons = await resolveCommonsFiles(seeds);

console.log(`threshold: preservedFraction >= ${BRIGHT_FRACTION_THRESHOLD}\n`);
console.log("slug".padEnd(25) + "name".padEnd(25) + "preserved%".padEnd(12) + "maxLum".padEnd(10) + "source".padEnd(14) + "decision");
console.log("-".repeat(99));

for (const seed of seeds) {
  const sourceSvgPath = join("apps/web/public/logos", seed.slug, "logo.source.svg");
  const normalizedSvgPath = join("apps/web/public/logos", seed.slug, "logo.svg");
  let raw: Buffer | null = null;
  let sourceLabel = "";

  if (existsSync(sourceSvgPath)) {
    raw = await readFile(sourceSvgPath);
    sourceLabel = "logo.source.svg";
  } else if (existsSync(normalizedSvgPath)) {
    // Previously approved logo (in COMPANIES from an older run) — no source SVG available
    // but the logo has valid gainmap assets on disk. Keep it.
    console.log(
      seed.slug.padEnd(25) +
      seed.name.slice(0, 24).padEnd(25) +
      "-".padEnd(12) +
      "-".padEnd(10) +
      "logo.svg".padEnd(14) +
      "KEEP"
    );
    continue;
  } else {
    // Download fresh for slugs not yet on disk (candidates and excluded slugs).
    const resolved = resolveSeed(seed, svgl, commons);
    if (resolved.url === null) {
      console.log(seed.slug.padEnd(25) + seed.name.slice(0,24).padEnd(25) + "-".padEnd(12) + "-".padEnd(10) + "no-url".padEnd(14) + "SKIP");
      continue;
    }
    const downloaded = await downloadSvg(resolved.url).catch((e: unknown) => errorMessage(e));
    if (typeof downloaded === "string") {
      console.log(seed.slug.padEnd(25) + seed.name.slice(0,24).padEnd(25) + "-".padEnd(12) + "-".padEnd(10) + "dl-fail".padEnd(14) + "SKIP");
      continue;
    }
    raw = Buffer.from(stripBackgroundPlate(downloaded.toString("utf8")));
    sourceLabel = "downloaded";
  }

  const m = await inkMetric(raw).catch((e: unknown) => errorMessage(e));
  if (typeof m === "string") {
    // If logo.source.svg exists the logo was previously approved — keep it.
    const decision = sourceLabel === "logo.source.svg" ? "KEEP" : "SKIP";
    console.log(seed.slug.padEnd(25) + seed.name.slice(0,24).padEnd(25) + "-".padEnd(12) + "-".padEnd(10) + sourceLabel.padEnd(14) + decision);
    continue;
  }

  // Logos that were successfully processed in the current backfill run (logo.source.svg
  // present) are kept regardless of their metric value — the metric only gates new logos.
  const keep = sourceLabel === "logo.source.svg" ? true : shouldKeep(m);
  console.log(
    seed.slug.padEnd(25) +
    seed.name.slice(0, 24).padEnd(25) +
    (m.preservedFraction * 100).toFixed(1).padEnd(12) +
    m.maxOriginalLuminance.toFixed(4).padEnd(10) +
    sourceLabel.padEnd(14) +
    (keep ? "KEEP" : "DROP")
  );
}
