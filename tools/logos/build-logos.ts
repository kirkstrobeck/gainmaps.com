#!/usr/bin/env npx tsx
// Gainmaps by Kirk Strobeck – https://gainmaps.com

/**
 * Build the assets behind /logos.
 *
 * For every seed in ./sources.ts:
 *   1. resolve a premium full-color brand SVG — api.svgl.app first, then the
 *      Wikimedia file behind the brand's Wikidata P154 claim,
 *   2. save it to apps/web/public/logos/<slug>/logo.svg,
 *   3. rasterize it with sharp onto a transparent 1024x1024 canvas, contain-fit
 *      and centred, so the mark keeps the holes the vector drew,
 *   4. encode that with encodeLogoVariants (boost 1.0, checkerboard matte)
 *      to apps/web/public/logos/<slug>/logo-gainmap-*.jpg — JPEG has no alpha,
 *      so what was transparent becomes a soft gray checker rather than a white
 *      plate the mark never had,
 *   5. rewrite apps/web/lib/logos/companies.ts with the seeds that succeeded.
 *
 * Brands without a premium SVG anywhere are skipped and reported; the generated
 * list only ever contains entries whose two files are on disk.
 *
 * The resolve/download/rasterize path lives in ./logo-pipeline.ts, shared with
 * ./backfill-logo-assets.ts (a targeted, non-destructive per-slug rerun of the
 * same path that does NOT rewrite companies.ts).
 *
 * Run from the repo root:  npx tsx tools/logos/build-logos.ts
 */
import { mkdir, readdir, rm, rmdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { encodeLogoVariants } from "./encode-logo-variants.ts";
import { inkMetric, shouldKeep } from "./ink-metric.ts";
import { BOOST, CANVAS, downloadSvg, errorMessage, FETCH_CONCURRENCY, mapChunked, rasterize } from "./logo-pipeline.ts";
import { fetchSvglIndex, resolveCommonsFiles, resolveSeed, type Resolved } from "./logo-resolve.ts";
import { normalizeLogoSvg, stripBackgroundPlate } from "./logo-svg-normalize.ts";
import { renderCompaniesModule } from "./render-companies-module.ts";
import { LOGO_SEEDS, type LogoSeed } from "./sources.ts";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "../..");
const publicRoot = join(repo, "apps/web/public/logos");
const listPath = join(repo, "apps/web/lib/logos/companies.ts");

type Outcome =
  | { readonly ok: true; readonly seed: LogoSeed; readonly source: Resolved["source"]; readonly note: string }
  | { readonly ok: false; readonly seed: LogoSeed; readonly reason: string };

async function main(): Promise<void> {
  const svgl = await fetchSvglIndex();
  console.log(`svgl index: ${svgl.size} entries`);

  const commons = await resolveCommonsFiles(LOGO_SEEDS);
  const resolved = LOGO_SEEDS.map((seed) => resolveSeed(seed, svgl, commons));

  const unresolved = resolved.filter((entry): entry is { seed: LogoSeed; url: null } => entry.url === null);
  const ready = resolved.filter((entry): entry is Resolved => entry.url !== null);
  console.log(`resolved ${ready.length}/${LOGO_SEEDS.length} logo URLs`);

  await removeTreeSerially(publicRoot);
  await mkdir(publicRoot, { recursive: true });
  for (const entry of ready) await mkdir(join(publicRoot, entry.seed.slug), { recursive: true });

  const built = await mapChunked(ready, FETCH_CONCURRENCY, buildOne);

  const outcomes: readonly Outcome[] = [
    ...built,
    ...unresolved.map((entry) => ({ ok: false as const, seed: entry.seed, reason: "no premium SVG found" })),
  ];

  const successes = outcomes
    .filter((outcome): outcome is Extract<Outcome, { ok: true }> => outcome.ok)
    .sort((a, b) => a.seed.rank - b.seed.rank);
  const skips = outcomes
    .filter((outcome): outcome is Extract<Outcome, { ok: false }> => !outcome.ok)
    .sort((a, b) => a.seed.rank - b.seed.rank);

  // A seed that failed after its directory was carved out leaves an empty or
  // half-written one behind; the generated list must only name slugs with both
  // files on disk, so sweep the rest away.
  const kept = new Set(successes.map((outcome) => outcome.seed.slug));
  for (const entry of ready) {
    if (!kept.has(entry.seed.slug)) await removeTreeSerially(join(publicRoot, entry.seed.slug));
  }

  await mkdir(dirname(listPath), { recursive: true });
  await writeFile(listPath, renderCompaniesModule(successes.map((outcome) => outcome.seed)), "utf8");

  console.log("");
  successes.forEach((outcome) => {
    console.log(`  ok    ${rankLabel(outcome.seed)} ${outcome.seed.slug.padEnd(22)} ${outcome.source.padEnd(8)} ${outcome.note}`);
  });
  skips.forEach((outcome) => {
    console.log(`  skip  ${rankLabel(outcome.seed)} ${outcome.seed.slug.padEnd(22)} ${outcome.reason}`);
  });
  console.log("");
  console.log(`built ${successes.length} brands, skipped ${skips.length}`);
  console.log(`wrote ${listPath}`);
}

/**
 * Depth-first delete, one syscall at a time.
 *
 * This repo is normally worked on over a bind mount, and that filesystem
 * returns a spurious EACCES when several directory creates or removes land at
 * once — `fs.rm({ recursive: true })` parallelises internally, so it trips over
 * itself on a tree this size. Plain file writes are unaffected, which is why
 * only the directory work is serialised and the fetching still runs wide.
 */
async function removeTreeSerially(target: string): Promise<void> {
  const entries = await readdir(target, { withFileTypes: true }).catch(() => []);
  for (const entry of entries) {
    const child = join(target, entry.name);
    if (entry.isDirectory()) await removeTreeSerially(child);
    else await rm(child, { force: true });
  }
  await rmdir(target).catch(() => undefined);
}

async function buildOne(entry: Resolved): Promise<Outcome> {
  const svg = await downloadSvg(entry.url).catch((error: unknown) => errorMessage(error));
  if (typeof svg === "string") return { ok: false, seed: entry.seed, reason: svg };

  // Measure AFTER plate stripping so a large dark background plate does not
  // suppress the preservedFraction of an otherwise colorful logo (e.g. McDonald's).
  const svgForMetric = Buffer.from(stripBackgroundPlate(svg.toString("utf8")));
  const metric = await inkMetric(svgForMetric);
  if (!shouldKeep(metric)) {
    return { ok: false, seed: entry.seed, reason: `ink metric too low (preservedFraction=${metric.preservedFraction.toFixed(3)}) — not a good Ultra HDR example` };
  }

  // The directory already exists: main carves the whole tree out up front, so
  // nothing here touches directory metadata. See removeTreeSerially.
  const directory = join(publicRoot, entry.seed.slug);
  // Save the raw (pre-normalization, post-stripBackgroundPlate) SVG for the audit.
  await writeFile(join(directory, "logo.source.svg"), svgForMetric);
  const normalizedSvg = normalizeLogoSvg(entry.seed, svg);
  await writeFile(join(directory, "logo.svg"), normalizedSvg);

  const raster = await rasterize(normalizedSvg).catch((error: unknown) => errorMessage(error));
  if (typeof raster === "string") {
    return { ok: false, seed: entry.seed, reason: `rasterize failed — ${raster}` };
  }

  await encodeLogoVariants(raster, CANVAS, directory, BOOST);
  return { ok: true, seed: entry.seed, source: entry.source, note: `${CANVAS}×${CANVAS}` };
}

function rankLabel(seed: LogoSeed): string {
  return `#${seed.rank}`.padEnd(5);
}

await main();
