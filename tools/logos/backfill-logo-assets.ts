#!/usr/bin/env npx tsx
// Gainmaps by Kirk Strobeck – https://gainmaps.com

/**
 * Backfill missing/stale logo assets for specific brands, without touching
 * apps/web/lib/logos/companies.ts and without touching any logo directory
 * other than the ones targeted.
 *
 * Unlike build-logos.ts (which rebuilds the whole tree and regenerates
 * companies.ts from whatever resolves that day), this script is a narrow,
 * re-runnable repair tool: give it slugs, or nothing to auto-detect
 * incomplete directories, and it resolves + rasterizes + encodes only those.
 *
 * Run from the repo root:
 *   npx tsx tools/logos/backfill-logo-assets.ts [slug...]
 *   npx tsx tools/logos/backfill-logo-assets.ts            # auto-detect incomplete dirs
 */
import { copyFileSync, existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

import { COMPANIES } from "../../apps/web/lib/logos/companies.ts";
import { encodeLogoVariants, LOGO_WIDTHS } from "./encode-logo-variants.ts";
import { GATE_FEASIBLE, inkMetric, shouldKeep } from "./ink-metric.ts";
import { CANVAS, BOOST, downloadSvg, errorMessage, rasterize } from "./logo-pipeline.ts";
import { fetchSvglIndex, resolveCommonsFiles, resolveSeed, type SvglEntry } from "./logo-resolve.ts";
import { normalizeLogoSvg } from "./logo-svg-normalize.ts";
import { LOGO_SEEDS } from "./sources.ts";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "../..");
const publicRoot = join(repo, "apps/web/public/logos");

const SDR_QUALITY: Record<number, number> = { 128: 75, 256: 80, 512: 90, 1024: 90 };

const REQUIRED_FILES = [
  "logo.svg",
  ...LOGO_WIDTHS.map((w) => `logo-gainmap-${w}.jpg`),
  "logo-gainmap.jpg",
  ...LOGO_WIDTHS.map((w) => `logo-sdr-${w}.jpg`),
  "logo-sdr.jpg",
];

function isIncomplete(slug: string): boolean {
  const dir = join(publicRoot, slug);
  return REQUIRED_FILES.some((file) => !existsSync(join(dir, file)));
}

function targetSlugs(): readonly string[] {
  const argv = process.argv.slice(2);
  if (argv.length > 0) return argv;
  return COMPANIES.map((c) => c.slug).filter(isIncomplete);
}

/** Path to a slug's existing on-disk logo.svg, or null when there isn't one. */
function existingSvgPath(slug: string): string | null {
  const path = join(publicRoot, slug, "logo.svg");
  return existsSync(path) ? path : null;
}

async function backfillOne(
  slug: string,
  svgl: ReadonlyMap<string, SvglEntry>,
  commons: ReadonlyMap<string, string>,
): Promise<void> {
  const seed = LOGO_SEEDS.find((s) => s.slug === slug);
  if (!seed) {
    console.log(`  skip  ${slug.padEnd(16)} no seed in tools/logos/sources.ts`);
    return;
  }

  const resolved = resolveSeed(seed, svgl, commons);
  // A few brands (Danone chief among them) publish no vector anywhere this
  // pipeline can reach — Commons and en.wikipedia host raster art only. The
  // repo already tracks a real vector for those brands; re-encoding it is a
  // legitimate recovery, upscaling or inventing pixels from a raster is not.
  const localSvgPath = resolved.url === null ? existingSvgPath(slug) : null;
  if (resolved.url === null && !localSvgPath) {
    console.log(`  fail  ${slug.padEnd(16)} no premium SVG found (svgl/commons) and no existing local logo.svg to reuse`);
    return;
  }
  if (localSvgPath) {
    console.log(`  warn  ${slug.padEnd(16)} unresolved upstream — reusing existing apps/web/public/logos/${slug}/logo.svg`);
  }

  const svg = localSvgPath
    ? await readFile(localSvgPath)
    : await downloadSvg(resolved.url!).catch((error: unknown) => errorMessage(error));
  if (typeof svg === "string") {
    console.log(`  fail  ${slug.padEnd(16)} download failed — ${svg}`);
    return;
  }

  const metric = await inkMetric(seed, svg).catch((error: unknown) => errorMessage(error));

  // Logos already on disk (in COMPANIES) are re-encoded unconditionally — they were
  // previously approved and we only need to refresh their stale gainmap assets.
  // The metric still gates NEW logos being added for the first time.
  const alreadyOnDisk = existsSync(join(publicRoot, slug, "logo.svg"));
  if (!alreadyOnDisk) {
    if (typeof metric === "string") {
      console.log(`  fail  ${slug.padEnd(16)} inkMetric failed — ${metric}`);
      return;
    }
    if (!shouldKeep(metric)) {
      console.log(`  skip  ${slug.padEnd(16)} ink metric too low (${(metric.score * 100).toFixed(1)}% score) — excluded`);
      return;
    }
  }
  if (alreadyOnDisk && typeof metric === "string") {
    console.log(`  warn  ${slug.padEnd(16)} inkMetric failed (${metric}) — re-encoding from existing logo.svg`);
  }

  const directory = join(publicRoot, slug);
  await mkdir(directory, { recursive: true });

  await writeFile(join(directory, "logo.source.svg"), svg);

  // Read the existing logo.svg BEFORE potentially overwriting it, so the fallback can
  // use the pre-existing content when the freshly normalized SVG renders blank.
  const existingLogoPath = join(directory, "logo.svg");
  const existingLogoContent = existsSync(existingLogoPath)
    ? await readFile(existingLogoPath)
    : null;

  const normalized = normalizeLogoSvg(seed, svg);
  await writeFile(existingLogoPath, normalized);

  // If the freshly normalized SVG renders blank (e.g., stripBackgroundPlate stripped the
  // entire logo content because it spans the full viewBox), fall back to the pre-existing
  // logo.svg so we can still re-encode the gainmap variants with correct dimensions.
  let raster = await rasterize(normalized).catch((error: unknown) => errorMessage(error));
  if (typeof raster === "string") {
    if (!existingLogoContent) {
      console.log(`  fail  ${slug.padEnd(16)} rasterize failed — ${raster}`);
      return;
    }
    console.log(`  warn  ${slug.padEnd(16)} normalized blank — re-encoding from existing logo.svg`);
    raster = await rasterize(existingLogoContent).catch((error: unknown) => errorMessage(error));
    if (typeof raster === "string") {
      console.log(`  fail  ${slug.padEnd(16)} rasterize failed even with existing logo.svg — ${raster}`);
      return;
    }
    // Restore the working existing logo.svg so it isn't replaced with the blank version.
    await writeFile(existingLogoPath, existingLogoContent);
  }

  await encodeLogoVariants(raster, CANVAS, directory, BOOST);
  await writeSdrVariants(directory);

  const sourceLabel = resolved.url === null ? "existing local logo.svg" : resolved.source;
  console.log(`  ok    ${slug.padEnd(16)} resolved via ${sourceLabel}`);
}

/** Re-encodes each freshly-written logo-gainmap-{w}.jpg as a plain JPEG — drops the
 * embedded gain map, yielding the SDR base rendition — plus a logo-sdr.jpg alias
 * of the 1024 variant, mirroring how logo-gainmap.jpg aliases logo-gainmap-1024.jpg. */
async function writeSdrVariants(directory: string): Promise<void> {
  for (const w of LOGO_WIDTHS) {
    const src = join(directory, `logo-gainmap-${w}.jpg`);
    const dest = join(directory, `logo-sdr-${w}.jpg`);
    if (!existsSync(src)) continue;
    await sharp(src).jpeg({ quality: SDR_QUALITY[w] }).toFile(dest);
    if (w === 1024) copyFileSync(dest, join(directory, "logo-sdr.jpg"));
  }
}

async function main(): Promise<void> {
  if (!GATE_FEASIBLE) throw new Error("logo gate is infeasible; refusing to derive assets");
  const slugs = targetSlugs();
  if (slugs.length === 0) {
    console.log("nothing to backfill — every COMPANIES directory has the full file set");
    return;
  }
  console.log(`backfilling ${slugs.length} slug(s): ${slugs.join(", ")}`);

  const seeds = LOGO_SEEDS.filter((s) => slugs.includes(s.slug));
  const svgl = await fetchSvglIndex();
  const commons = await resolveCommonsFiles(seeds);

  for (const slug of slugs) await backfillOne(slug, svgl, commons);

  console.log("done");
}

await main();
