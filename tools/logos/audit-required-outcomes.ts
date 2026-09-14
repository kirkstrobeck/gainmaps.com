#!/usr/bin/env npx tsx
// Gainmaps by Kirk Strobeck – https://gainmaps.com

/**
 * Reproduce the thirteen user-judged inputs without letting today's resolver
 * change a shipped tile. The five DROP examples are read from their requested
 * historical commits; shipped KEEP examples are read from HEAD. YouTube is no
 * longer shipped, so the forward audit rule measures a freshly resolved source
 * after the normal production transform and labels that exception explicitly.
 */
import { execFileSync } from "node:child_process";

import { inkMetric, shippedLogoMetric, type InkMetricResult } from "./ink-metric.ts";
import { downloadSvg } from "./logo-pipeline.ts";
import { fetchSvglIndex, resolveCommonsFiles, resolveSeed } from "./logo-resolve.ts";
import { LOGO_SEEDS, type LogoSeed } from "./sources.ts";
import type { ShippedInkStats } from "./pixel-stats.ts";

type Expected = "KEEP" | "DROP";
type RequiredRow = {
  readonly slug: string;
  readonly expected: Expected;
  readonly input: string;
  readonly metric: ShippedInkStats;
};

const ROOT = "apps/web/public/logos";
const DROP_AT_DBB = new Set(["coca-cola", "tesla", "visa"]);
const KEEP_AT_HEAD = new Set(["microsoft", "google", "toyota", "mcdonalds", "spotify", "ikea", "netflix"]);
const REQUIRED_ORDER = [
  "microsoft", "google", "toyota", "mcdonalds", "youtube", "spotify", "ikea", "netflix",
  "coca-cola", "tesla", "visa", "cisco", "oracle",
] as const;

function seedFor(slug: string): LogoSeed {
  const seed = LOGO_SEEDS.find((candidate) => candidate.slug === slug);
  if (!seed) throw new Error(`no seed for ${slug}`);
  return seed;
}

function gitShow(revision: string, path: string): Buffer {
  return Buffer.from(execFileSync("git", ["show", `${revision}:${path}`], { encoding: "buffer" }));
}

function lastDeletedParent(path: string): string {
  const parents = execFileSync("git", ["log", "--diff-filter=D", "--format=%P", "--", path], { encoding: "utf8" })
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const parent = parents[0];
  if (!parent) throw new Error(`no deletion commit found for ${path}`);
  return parent;
}

async function requiredInput(slug: string): Promise<RequiredRow> {
  const path = `${ROOT}/${slug}/logo.svg`;
  if (KEEP_AT_HEAD.has(slug)) {
    return { slug, expected: "KEEP", input: `HEAD:${path} (shipped direct)`, metric: await shippedLogoMetric(gitShow("HEAD", path)) };
  }
  if (DROP_AT_DBB.has(slug)) {
    return { slug, expected: "DROP", input: `dbb4248:${path} (shipped direct)`, metric: await shippedLogoMetric(gitShow("dbb4248", path)) };
  }
  if (slug === "cisco" || slug === "oracle") {
    const parent = lastDeletedParent(path);
    return {
      slug,
      expected: "DROP",
      input: `${parent}:${path} (last shipped before deletion; direct)`,
      metric: await shippedLogoMetric(gitShow(parent, path)),
    };
  }
  if (slug === "youtube") return fetchedYouTubeInput();
  throw new Error(`no required input rule for ${slug}`);
}

async function fetchedYouTubeInput(): Promise<RequiredRow> {
  const seed = seedFor("youtube");
  const svgl = await fetchSvglIndex();
  const commons = await resolveCommonsFiles([seed]);
  const resolved = resolveSeed(seed, svgl, commons);
  if (resolved.url === null) throw new Error("youtube has no resolved SVG URL");
  const metric: InkMetricResult = await inkMetric(seed, await downloadSvg(resolved.url));
  return {
    slug: "youtube",
    expected: "KEEP",
    input: `fetched ${resolved.source}:${resolved.fileName} then strip+normalize (not shipped at HEAD)`,
    metric,
  };
}

function decision(metric: ShippedInkStats, threshold: number): Expected {
  return metric.score >= threshold ? "KEEP" : "DROP";
}

type Cut = { readonly lower: RequiredRow; readonly upper: RequiredRow; readonly threshold: number; readonly width: number; readonly correct: number };

function bestCut(rows: readonly RequiredRow[]): Cut {
  const sorted = [...rows].sort((left, right) => left.metric.score - right.metric.score);
  const cuts = sorted.slice(0, -1).map((lower, index) => {
    const upper = sorted[index + 1]!;
    const width = upper.metric.score - lower.metric.score;
    const threshold = lower.metric.score + width / 2;
    const correct = rows.filter((row) => decision(row.metric, threshold) === row.expected).length;
    return { lower, upper, threshold, width, correct };
  });
  return cuts.reduce((best, candidate) =>
    candidate.correct > best.correct || (candidate.correct === best.correct && candidate.width > best.width) ? candidate : best,
  );
}

function printRows(rows: readonly RequiredRow[], threshold: number): void {
  console.log("slug\texpected\tinput\tscore\tmeanAlpha\tsolidFraction\tinkPx@128\tdecision");
  for (const row of rows) {
    console.log([
      row.slug, row.expected, row.input, row.metric.score.toFixed(6), row.metric.meanAlpha.toFixed(6),
      row.metric.solidFraction.toFixed(6), row.metric.inkPixels, decision(row.metric, threshold),
    ].join("\t"));
  }
}

async function historicalYouTubeSensitivity(): Promise<void> {
  const path = `${ROOT}/youtube/logo.svg`;
  const revision = lastDeletedParent(path);
  const metric = await shippedLogoMetric(gitShow(revision, path));
  console.log(`YOUTUBE_HISTORICAL_SENSITIVITY\t${revision}:${path}\t${metric.score.toFixed(6)}`);
}

async function main(): Promise<void> {
  const rows = await Promise.all(REQUIRED_ORDER.map(requiredInput));
  const drops = rows.filter((row) => row.expected === "DROP");
  const keeps = rows.filter((row) => row.expected === "KEEP");
  const highestDrop = drops.reduce((best, row) => row.metric.score > best.metric.score ? row : best);
  const lowestKeep = keeps.reduce((best, row) => row.metric.score < best.metric.score ? row : best);
  const feasible = highestDrop.metric.score < lowestKeep.metric.score;
  const cut = bestCut(rows);

  console.log("REQUIRED_OUTCOMES_V2");
  console.log(`RESOLVER_RULE\tdirect URL → svgl → explicit Commons file/Wikidata P154`);
  console.log(`FEASIBILITY_GAP\t${highestDrop.slug}\t${highestDrop.metric.score.toFixed(6)}\t${lowestKeep.slug}\t${lowestKeep.metric.score.toFixed(6)}\t${(lowestKeep.metric.score - highestDrop.metric.score).toFixed(6)}`);
  console.log(`BEST_CUT\t${cut.lower.slug}\t${cut.lower.metric.score.toFixed(6)}\t${cut.upper.slug}\t${cut.upper.metric.score.toFixed(6)}\t${cut.threshold.toFixed(6)}\twidth=${cut.width.toFixed(6)}\tcorrect=${cut.correct}/${rows.length}`);
  console.log(`SCORE_MIN\t${cut.threshold.toFixed(6)}\t${feasible ? "FEASIBLE" : "INFEASIBLE"}`);
  printRows(rows, cut.threshold);
  await historicalYouTubeSensitivity();
  if (!feasible) process.exitCode = 1;
}

await main();
