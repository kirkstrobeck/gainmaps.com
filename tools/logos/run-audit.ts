#!/usr/bin/env npx tsx
// Gainmaps by Kirk Strobeck – https://gainmaps.com

/**
 * Audit every seed without altering approved logo sources. Shipped slugs are
 * measured from their checked-in logo.svg, so their result is independent of
 * resolver or network drift. Only unshipped candidates are fetched and passed
 * through the normal strip-and-normalize path before scoring.
 */
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { join } from "node:path";

import {
  BRIGHT_LUM, inkMetric, LUMINANCE_FLOOR, rawColorMetric, SATURATION_MIN,
  SCORE_MIN, shippedLogoMetric,
} from "./ink-metric.ts";
import type { InkPixelStats, ShippedInkStats } from "./pixel-stats.ts";
import {
  downloadSvgDetailed, errorMessage, FETCH_CONCURRENCY, mapChunked,
} from "./logo-pipeline.ts";
import { fetchSvglIndex, resolveCommonsFiles, resolveSeed } from "./logo-resolve.ts";
import { normalizeLogoSvg } from "./logo-svg-normalize.ts";
import { LOGO_SEEDS, type LogoSeed } from "./sources.ts";

const LOG_DIR = "sandbox-shots-tmp";
const SOURCE_DIR = join(LOG_DIR, "audit-sources");
const PUBLIC = "apps/web/public/logos";
const BASELINE_REVISION = process.env.LOGO_AUDIT_BASELINE;
// Danone has a legacy local tile but no resolver-reachable SVG; audit it by
// the forward rule so its FETCH-FAIL outcome removes that stale directory.
const FORWARD_ONLY = new Set(["danone"]);

type Decision = "KEEP" | "DROP" | "FETCH-FAIL" | "ERROR";
type Row = {
  readonly seed: LogoSeed;
  readonly input: "shipped" | "fetched";
  readonly source: string;
  readonly fileName: string;
  readonly raw?: InkPixelStats;
  readonly metric?: ShippedInkStats;
  readonly normalizedSha256?: string;
  readonly normalizedPath?: string;
  readonly sourcePath?: string;
  readonly sourceSha256?: string;
  readonly decision: Decision;
  readonly reason: string;
};

function fixed(value: number | undefined): string {
  return value === undefined ? "-" : value.toFixed(4);
}

function hash(bytes: Buffer): string {
  return createHash("sha256").update(bytes).digest("hex");
}

function decisionFor(metric: ShippedInkStats): Decision {
  return metric.score >= SCORE_MIN ? "KEEP" : "DROP";
}

function formatRow(row: Row): string {
  const metric = row.metric;
  const raw = row.raw;
  return [
    row.seed.slug, row.input, row.source, row.fileName, metric?.inkPixels ?? "-", fixed(metric?.meanAlpha),
    fixed(metric?.solidFraction), fixed(metric?.score), raw?.inkPixels ?? "-", fixed(raw?.meanLum),
    fixed(raw?.maxLum), fixed(raw?.brightFraction), fixed(raw?.saturatedFraction), fixed(raw?.vividFraction),
    raw?.dominant.hex ?? "-", row.decision, row.reason,
  ].join("\t");
}

async function auditShipped(seed: LogoSeed, svg: Buffer): Promise<Row> {
  const metric = await shippedLogoMetric(svg).catch((error: unknown) => errorMessage(error));
  if (typeof metric === "string") {
    return { seed, input: "shipped", source: "shipped", fileName: "logo.svg", decision: "ERROR", reason: metric };
  }
  const decision = decisionFor(metric);
  return {
    seed, input: "shipped", source: "shipped", fileName: "logo.svg", metric, decision, normalizedSha256: hash(svg),
    reason: `score ${metric.score.toFixed(4)} ${decision === "KEEP" ? ">=" : "<"} ${SCORE_MIN}; checked-in logo.svg`,
  };
}

function baselineLogo(seed: LogoSeed): Buffer | null {
  if (!BASELINE_REVISION) return null;
  const path = `${PUBLIC}/${seed.slug}/logo.svg`;
  try {
    return Buffer.from(execFileSync("git", ["show", `${BASELINE_REVISION}:${path}`], { encoding: "buffer", stdio: ["ignore", "pipe", "ignore"] }));
  } catch {
    return null;
  }
}

async function auditFetched(
  seed: LogoSeed,
  svgl: Awaited<ReturnType<typeof fetchSvglIndex>>,
  commons: ReadonlyMap<string, string>,
): Promise<Row> {
  const resolved = resolveSeed(seed, svgl, commons);
  if (resolved.url === null) {
    return {
      seed, input: "fetched", source: "resolver", fileName: "-", decision: "FETCH-FAIL",
      reason: "no SVG URL from direct URL, svgl, explicit Commons file, or Wikidata P154",
    };
  }
  const fetched = await downloadSvgDetailed(resolved.url).catch((error: unknown) => errorMessage(error));
  if (typeof fetched === "string") {
    return { seed, input: "fetched", source: resolved.source, fileName: resolved.fileName, decision: "FETCH-FAIL", reason: fetched };
  }
  const raw = await rawColorMetric(fetched.bytes).catch(() => undefined);
  const metric = await inkMetric(seed, fetched.bytes).catch((error: unknown) => errorMessage(error));
  const fetchedAs = `HTTP ${fetched.status}; content-type=${fetched.contentType}; bytes=${fetched.bytes.length}; url=${fetched.url}`;
  if (typeof metric === "string") {
    return { seed, input: "fetched", source: resolved.source, fileName: resolved.fileName, raw, decision: "ERROR", reason: `${metric}; ${fetchedAs}` };
  }
  const decision = decisionFor(metric);
  const normalized = normalizeLogoSvg(seed, fetched.bytes);
  const normalizedPath = join(SOURCE_DIR, `${seed.slug}.svg`);
  const sourcePath = join(SOURCE_DIR, `${seed.slug}.source.svg`);
  await writeFile(sourcePath, fetched.bytes);
  await writeFile(normalizedPath, normalized);
  return {
    seed, input: "fetched", source: resolved.source, fileName: resolved.fileName, raw, metric, decision,
    normalizedSha256: hash(normalized), normalizedPath, sourcePath, sourceSha256: hash(fetched.bytes),
    reason: `score ${metric.score.toFixed(4)} ${decision === "KEEP" ? ">=" : "<"} ${SCORE_MIN}; strip+normalize fetched source; ${fetchedAs}`,
  };
}

function resolverFailure(seed: LogoSeed, error: unknown): Row {
  return {
    seed, input: "fetched", source: "resolver", fileName: "-", decision: "FETCH-FAIL",
    reason: `resolver setup failed: ${errorMessage(error)}`,
  };
}

async function main(): Promise<void> {
  await mkdir(LOG_DIR, { recursive: true });
  await mkdir(SOURCE_DIR, { recursive: true });
  const baseline = new Map(LOGO_SEEDS.map((seed) => [seed.slug, baselineLogo(seed)]));
  const shipped = LOGO_SEEDS.filter((seed) => !FORWARD_ONLY.has(seed.slug) && (BASELINE_REVISION ? baseline.get(seed.slug) !== null : existsSync(join(PUBLIC, seed.slug, "logo.svg"))));
  const candidates = LOGO_SEEDS.filter((seed) => !shipped.includes(seed));
  // Do this first: an unavailable resolver must never hide a shipped-tile result.
  const shippedRows = await mapChunked(shipped, FETCH_CONCURRENCY, (seed) => BASELINE_REVISION ? auditShipped(seed, baseline.get(seed.slug)!) : readFile(join(PUBLIC, seed.slug, "logo.svg")).then((svg) => auditShipped(seed, svg)));
  const fetchedRows = await Promise.all([
    fetchSvglIndex(),
    resolveCommonsFiles(candidates),
  ]).then(async ([svgl, commons]) =>
    mapChunked(candidates, FETCH_CONCURRENCY, (seed) => auditFetched(seed, svgl, commons)),
  ).catch((error: unknown) => candidates.map((seed) => resolverFailure(seed, error)));
  const rows = [...shippedRows, ...fetchedRows]
    .sort((left, right) => left.seed.rank - right.seed.rank || left.seed.slug.localeCompare(right.seed.slug));
  const header = [
    "# schema=logo-audit-v3",
    `# baseline=${BASELINE_REVISION ?? "current worktree"}; shipped rows use logo.svg; fetched rows use strip+normalize(source)`,
    `# vivid(pixel)=linearLum>=${BRIGHT_LUM} OR (HSL-saturation>=${SATURATION_MIN} AND linearLum>=${LUMINANCE_FLOOR})`,
    "# score=sum(alpha/255*vivid)/count(alpha>0); zero ink is ERROR",
    `# threshold=${SCORE_MIN}; required gate is feasible and drives derivation`,
    "slug\tinput\tsource\tresolvedFile\tinkPx@128\tmeanAlpha\tsolidFraction\tscore\trawInkPx\trawMeanLum\trawMaxLum\trawBrightFraction\trawSaturatedFraction\trawVividFraction\trawDominant\tdecision\treason",
  ];
  const log = [...header, ...rows.map(formatRow)].join("\n") + "\n";
  await writeFile(join(LOG_DIR, "excluded-logos.log"), log);
  await writeFile(join(LOG_DIR, "ink-audit.json"), JSON.stringify({ schema: "logo-audit-v3", threshold: SCORE_MIN, baseline: BASELINE_REVISION ?? "current worktree", rows }, null, 2) + "\n");
  console.log(log);
}

await main();
