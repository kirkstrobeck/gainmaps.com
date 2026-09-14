#!/usr/bin/env npx tsx
// Gainmaps by Kirk Strobeck – https://gainmaps.com

/** Derive the public logo set from the fresh audit without rebuilding keeps. */
import { existsSync } from "node:fs";
import { copyFile, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { join } from "node:path";

import sharp from "sharp";

import { encodeLogoVariants, LOGO_WIDTHS } from "./encode-logo-variants.ts";
import { SCORE_MIN } from "./ink-metric.ts";
import { BOOST, CANVAS, rasterize } from "./logo-pipeline.ts";
import { renderCompaniesModule } from "./render-companies-module.ts";
import { LOGO_SEEDS, type LogoSeed } from "./sources.ts";

const ROOT = "apps/web/public/logos";
const AUDIT = "sandbox-shots-tmp/ink-audit.json";
const BASELINE = "sandbox-shots-tmp/baseline-shipped-slugs.txt";
const REGISTRY = "apps/web/lib/logos/companies.ts";
const FILES = ["logo.svg", "logo.source.svg", "logo-gainmap.jpg", "logo-sdr.jpg", ...LOGO_WIDTHS.flatMap((w) => [
  `logo-gainmap-${w}.jpg`, `logo-sdr-${w}.jpg`,
])];

type Decision = "KEEP" | "DROP" | "FETCH-FAIL" | "ERROR";
type AuditRow = { readonly seed: LogoSeed; readonly input: "shipped" | "fetched"; readonly decision: Decision; readonly normalizedPath?: string; readonly normalizedSha256?: string; readonly sourcePath?: string; readonly sourceSha256?: string };
type Audit = { readonly schema: string; readonly threshold: number; readonly rows: readonly AuditRow[] };

function hash(bytes: Buffer): string {
  return createHash("sha256").update(bytes).digest("hex");
}

function slugsOnDisk(): Promise<string[]> {
  return readdir(ROOT, { withFileTypes: true }).then((entries) => entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort());
}

function incomplete(slug: string): boolean {
  return FILES.some((file) => !existsSync(join(ROOT, slug, file)));
}

async function writeSdr(directory: string): Promise<void> {
  for (const width of LOGO_WIDTHS) {
    const gainmap = join(directory, `logo-gainmap-${width}.jpg`);
    const sdr = join(directory, `logo-sdr-${width}.jpg`);
    await sharp(gainmap).jpeg({ quality: width < 512 ? 80 : 90 }).toFile(sdr);
    if (width === 1024) await copyFile(sdr, join(directory, "logo-sdr.jpg"));
  }
}

async function encodeExisting(seed: LogoSeed): Promise<void> {
  const directory = join(ROOT, seed.slug);
  const raster = await rasterize(await readFile(join(directory, "logo.svg")));
  await encodeLogoVariants(raster, CANVAS, directory, BOOST);
  await writeSdr(directory);
}

async function addFetched(row: AuditRow): Promise<void> {
  if (!row.normalizedPath || !row.normalizedSha256 || !row.sourcePath || !row.sourceSha256) throw new Error(`${row.seed.slug}: audit lacks exact inputs`);
  const normalized = await readFile(row.normalizedPath);
  const source = await readFile(row.sourcePath);
  if (hash(normalized) !== row.normalizedSha256) throw new Error(`${row.seed.slug}: audited input hash changed`);
  if (hash(source) !== row.sourceSha256) throw new Error(`${row.seed.slug}: audited source hash changed`);
  const seed = row.seed;
  const directory = join(ROOT, seed.slug);
  await mkdir(directory, { recursive: true });
  await writeFile(join(directory, "logo.source.svg"), source);
  await writeFile(join(directory, "logo.svg"), normalized);
  await encodeLogoVariants(await rasterize(normalized), CANVAS, directory, BOOST);
  await writeSdr(directory);
}

async function main(): Promise<void> {
  const audit = JSON.parse(await readFile(AUDIT, "utf8")) as Audit;
  if (audit.schema !== "logo-audit-v3" || audit.threshold !== SCORE_MIN) throw new Error("audit is stale or uses a different SCORE_MIN");
  const rows = audit.rows.filter((row) => row.decision === "KEEP");
  const keep = rows.map((row) => row.seed).sort((left, right) => left.rank - right.rank || left.slug.localeCompare(right.slug));
  const before = await slugsOnDisk();
  const baseline = await readFile(BASELINE, "utf8").then((text) => text.trim().split("\n").filter(Boolean)).catch(() => before);
  const allowed = new Set(keep.map((seed) => seed.slug));
  for (const slug of before) {
    if (!allowed.has(slug)) await rm(join(ROOT, slug), { recursive: true, force: true });
  }
  for (const row of rows.filter((row) => row.input === "fetched")) {
    const path = join(ROOT, row.seed.slug, "logo.svg");
    const current = existsSync(path) ? await readFile(path) : null;
    if (!current || !row.normalizedSha256 || hash(current) !== row.normalizedSha256) await addFetched(row);
  }
  for (const row of rows.filter((row) => row.input === "shipped")) {
    const current = await readFile(join(ROOT, row.seed.slug, "logo.svg"));
    if (!row.normalizedSha256 || hash(current) !== row.normalizedSha256) throw new Error(`${row.seed.slug}: shipped logo.svg changed since audit`);
  }
  for (const seed of keep.filter((candidate) => before.includes(candidate.slug) && incomplete(candidate.slug))) await encodeExisting(seed);
  for (const seed of keep) {
    if (incomplete(seed.slug)) throw new Error(`${seed.slug}: derivation did not produce the full asset set`);
  }
  await writeFile(REGISTRY, renderCompaniesModule(keep));
  const after = await slugsOnDisk();
  const removed = baseline.filter((slug) => !after.includes(slug));
  const added = after.filter((slug) => !baseline.includes(slug));
  console.log(`FINAL KEEP ${after.length}`);
  console.log(`DROP ${audit.rows.filter((row) => row.decision !== "KEEP").map((row) => row.seed.slug).join(", ")}`);
  console.log(`REMOVED_FROM_51 ${removed.join(", ")}`);
  console.log(`ADDED ${added.join(", ")}`);
}

await main();
