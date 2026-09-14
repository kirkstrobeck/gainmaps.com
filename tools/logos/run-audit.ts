#!/usr/bin/env npx tsx
// Gainmaps by Kirk Strobeck – https://gainmaps.com
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { COMPANIES } from "../../apps/web/lib/logos/companies.ts";
import { inkMetric, shouldKeep, BRIGHT_FRACTION_THRESHOLD } from "./ink-metric.ts";

console.log(`threshold: preservedFraction >= ${BRIGHT_FRACTION_THRESHOLD}\n`);
console.log("slug".padEnd(25) + "name".padEnd(25) + "preserved%".padEnd(12) + "maxLum".padEnd(10) + "decision");
console.log("-".repeat(85));

for (const company of COMPANIES) {
  const svgPath = join("apps/web/public/logos", company.slug, "logo.svg");
  let svg: Buffer;
  try { svg = await readFile(svgPath); } catch { continue; }
  const m = await inkMetric(svg);
  const keep = shouldKeep(m);
  console.log(
    company.slug.padEnd(25) +
    company.name.slice(0, 24).padEnd(25) +
    (m.preservedFraction * 100).toFixed(1).padEnd(12) +
    m.maxOriginalLuminance.toFixed(4).padEnd(10) +
    (keep ? "KEEP" : "DROP")
  );
}
