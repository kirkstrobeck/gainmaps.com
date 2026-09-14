#!/usr/bin/env npx tsx
// Gainmaps by Kirk Strobeck – https://gainmaps.com
import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

import {
  BRIGHT_LUM, inkMetric, LUMINANCE_FLOOR, rawColorMetric, SATURATION_MIN,
  SCORE_MIN, type InkMetricResult,
} from "./ink-metric.ts";
import type { InkPixelStats } from "./pixel-stats.ts";
import {
  downloadSvgDetailed, errorMessage, FETCH_CONCURRENCY, mapChunked,
} from "./logo-pipeline.ts";
import { fetchSvglIndex, resolveCommonsFiles, resolveSeed, type Resolved } from "./logo-resolve.ts";
import { LOGO_SEEDS, type LogoSeed } from "./sources.ts";

const LOG_DIR = "/workspace/sandbox-shots-tmp";
const RAW_CACHE = join(LOG_DIR, "raw-logo-sources");
const PUBLIC = "/workspace/apps/web/public/logos";

type Row = {
  readonly seed: LogoSeed;
  readonly source: string;
  readonly fileName: string;
  readonly raw?: InkPixelStats;
  readonly metric?: InkMetricResult;
  readonly decision: "KEEP" | "DROP" | "FETCH-FAIL" | "ERROR";
  readonly reason: string;
};

function fixed(value: number | undefined): string {
  if (value === undefined) return "-";
  return value.toFixed(4);
}

function formatRow(row: Row): string {
  const metric = row.metric;
  const raw = metric?.raw ?? row.raw;
  return [
    row.seed.slug, metric?.inkPixels ?? "-", fixed(metric?.meanAlpha), fixed(metric?.solidFraction),
    fixed(metric?.score), raw?.inkPixels ?? "-", fixed(raw?.meanLum), fixed(raw?.maxLum),
    fixed(raw?.brightFraction), fixed(raw?.saturatedFraction), fixed(raw?.vividFraction),
    raw?.dominant.hex ?? "-", row.source,
    row.fileName, row.decision, row.reason,
  ].join("\t");
}

async function auditResolved(entry: Resolved): Promise<Row> {
  const fetched = await downloadSvgDetailed(entry.url).catch((error: unknown) => errorMessage(error));
  if (typeof fetched === "string") {
    return { seed: entry.seed, source: entry.source, fileName: entry.fileName, decision: "FETCH-FAIL", reason: fetched };
  }
  await writeFile(join(RAW_CACHE, `${entry.seed.slug}.svg`), fetched.bytes);
  const publicDir = join(PUBLIC, entry.seed.slug);
  if (existsSync(publicDir)) await writeFile(join(publicDir, "logo.source.svg"), fetched.bytes);
  const raw = await rawColorMetric(fetched.bytes).catch(() => undefined);
  const metric = await inkMetric(entry.seed, fetched.bytes).catch((error: unknown) => errorMessage(error));
  const fetchedAs = `HTTP ${fetched.status}; content-type=${fetched.contentType}; bytes=${fetched.bytes.length}; url=${fetched.url}`;
  if (typeof metric === "string") {
    return { seed: entry.seed, source: entry.source, fileName: entry.fileName, raw, decision: "ERROR", reason: `${metric}; ${fetchedAs}` };
  }
  const decision = metric.score >= SCORE_MIN ? "KEEP" : "DROP";
  const comparison = decision === "KEEP" ? ">=" : "<";
  const reason = `score ${metric.score.toFixed(4)} ${comparison} ${SCORE_MIN}; ${fetchedAs}`;
  return { seed: entry.seed, source: entry.source, fileName: entry.fileName, metric, decision, reason };
}

await mkdir(RAW_CACHE, { recursive: true });
const svgl = await fetchSvglIndex();
const commons = await resolveCommonsFiles(LOGO_SEEDS);
const resolved = LOGO_SEEDS.map((seed) => resolveSeed(seed, svgl, commons));
const ready = resolved.filter((entry): entry is Resolved => entry.url !== null);
const rows = await mapChunked(ready, FETCH_CONCURRENCY, auditResolved);
const failures = resolved
  .filter((entry): entry is { seed: LogoSeed; url: null } => entry.url === null)
  .map<Row>((entry) => ({
    seed: entry.seed,
    source: "resolver",
    fileName: "-",
    decision: "FETCH-FAIL",
    reason: "no SVG URL from direct, svgl, Commons override, or Wikipedia/Wikidata P154",
  }));
const ordered = [...rows, ...failures]
  .sort((a, b) => LOGO_SEEDS.indexOf(a.seed) - LOGO_SEEDS.indexOf(b.seed));
const header = [
  "Shipped 128px tile metric; raw source-colour stats are retained after the score columns.",
  `vivid(pixel) = linearLum >= ${BRIGHT_LUM} OR (HSL-saturation >= ${SATURATION_MIN} AND linearLum >= ${LUMINANCE_FLOOR})`,
  `PROVISIONAL decisions use best measurable cut ${SCORE_MIN}; derivation is disabled because the required gate is infeasible.`,
  "score = sum(alpha/255 * vivid) / count(alpha > 0); zero ink is ERROR.",
  "slug\tinkPx@128\tmeanAlpha\tsolidFraction\tscore\trawInkPx\trawMeanLum\trawMaxLum\trawBrightFraction\trawSaturatedFraction\trawVividFraction\trawDominant\tsource\tresolvedFile\tdecision\treason",
];
const log = [...header, ...ordered.map(formatRow)].join("\n") + "\n";
await writeFile(join(LOG_DIR, "excluded-logos.log"), log);
await writeFile(join(LOG_DIR, "ink-audit.json"), JSON.stringify(ordered, null, 2) + "\n");
console.log(log);
