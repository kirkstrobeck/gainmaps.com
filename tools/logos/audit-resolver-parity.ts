#!/usr/bin/env npx tsx
// Gainmaps by Kirk Strobeck – https://gainmaps.com

/**
 * Re-resolve every shipped slug with the historical resolver order and check
 * the fetched geometry against the shipped normalized logo. A candidate that
 * changes aspect ratio by more than two percent is never shipped silently:
 * the committed source is restored and the row remains explicitly unresolved.
 */
import { execFileSync, spawnSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { COMPANIES } from "../../apps/web/lib/logos/companies.ts";
import { downloadSvg, errorMessage, mapChunked } from "./logo-pipeline.ts";
import { fetchSvglIndex, resolveCommonsFiles, resolveSeed } from "./logo-resolve.ts";
import { aspectDelta, MAX_ASPECT_DELTA, svgGeometry, type SvgGeometry } from "./logo-source-parity.ts";
import { LOGO_SEEDS, type LogoSeed } from "./sources.ts";

const ROOT = "apps/web/public/logos";
const baselineArgument = process.argv.find((argument) => argument.startsWith("--baseline-dir="));
const BASELINE_DIR = baselineArgument?.slice("--baseline-dir=".length);

type Status = "MATCH" | "MISMATCH-fixed" | "UNRESOLVED";
type Row = {
  readonly slug: string;
  readonly resolver: string;
  readonly file: string;
  readonly shipped: SvgGeometry | null;
  readonly before: SvgGeometry | null;
  readonly fetched: SvgGeometry | null;
  readonly delta: number | null;
  readonly status: Status;
  readonly action: string;
};

function sourcePath(slug: string): string {
  return join(ROOT, slug, "logo.source.svg");
}

function baselinePath(slug: string): string {
  return BASELINE_DIR ? join(BASELINE_DIR, `${slug}.svg`) : sourcePath(slug);
}

function logoPath(slug: string): string {
  return join(ROOT, slug, "logo.svg");
}

function sourceIsDirty(path: string): boolean {
  return spawnSync("git", ["diff", "--quiet", "--", path]).status === 1;
}

function restoreCommittedSource(path: string): void {
  // This exact, user-requested target restores the previous ground-truth source
  // when today's resolver cannot reproduce its shipped geometry.
  execFileSync("git", ["checkout", "--", path]);
}

function seedFor(slug: string): LogoSeed {
  const seed = LOGO_SEEDS.find((candidate) => candidate.slug === slug);
  if (!seed) throw new Error(`no seed for shipped slug ${slug}`);
  return seed;
}

async function auditOneUnsafe(
  slug: string,
  svgl: ReadonlyMap<string, { readonly title: string; readonly route?: string | { readonly light?: string; readonly dark?: string } }>,
  commons: ReadonlyMap<string, string>,
): Promise<Row> {
  const source = sourcePath(slug);
  const shipped = svgGeometry(await readFile(logoPath(slug)));
  const before = await readFile(baselinePath(slug)).then(svgGeometry).catch(() => null);
  const resolved = resolveSeed(seedFor(slug), svgl, commons);
  const resolver = resolved.url === null ? "unresolved" : resolved.source;
  const file = resolved.url === null ? "-" : resolved.fileName;
  if (resolved.url === null) {
    if (!BASELINE_DIR) restoreCommittedSource(source);
    return { slug, resolver, file, shipped, before, fetched: null, delta: null, status: "UNRESOLVED", action: `${BASELINE_DIR ? "would restore" : "restored"} HEAD source: no URL` };
  }
  const fetchedSvg = await downloadSvg(resolved.url).catch((error: unknown) => errorMessage(error));
  if (typeof fetchedSvg === "string") {
    if (!BASELINE_DIR) restoreCommittedSource(source);
    return { slug, resolver, file, shipped, before, fetched: null, delta: null, status: "UNRESOLVED", action: `${BASELINE_DIR ? "would restore" : "restored"} HEAD source: ${fetchedSvg}` };
  }
  const fetched = svgGeometry(fetchedSvg);
  const candidateDelta = aspectDelta(shipped, fetched);
  if (candidateDelta > MAX_ASPECT_DELTA) {
    if (!BASELINE_DIR) restoreCommittedSource(source);
    return { slug, resolver, file, shipped, before, fetched, delta: candidateDelta, status: "UNRESOLVED", action: `${BASELINE_DIR ? "would restore" : "restored"} HEAD source: fetched geometry mismatch` };
  }
  if (before && aspectDelta(shipped, before) > MAX_ASPECT_DELTA) {
    if (!BASELINE_DIR) await writeFile(source, fetchedSvg);
    return { slug, resolver, file, shipped, before, fetched, delta: candidateDelta, status: "MISMATCH-fixed", action: `${BASELINE_DIR ? "would replace" : "replaced"} mismatched source with matching fetch` };
  }
  return { slug, resolver, file, shipped, before, fetched, delta: candidateDelta, status: "MATCH", action: sourceIsDirty(source) ? "kept matching working source" : "already matched" };
}

async function auditOne(
  slug: string,
  svgl: ReadonlyMap<string, { readonly title: string; readonly route?: string | { readonly light?: string; readonly dark?: string } }>,
  commons: ReadonlyMap<string, string>,
): Promise<Row> {
  try {
    return await auditOneUnsafe(slug, svgl, commons);
  } catch (error: unknown) {
    const source = sourcePath(slug);
    const before = await readFile(baselinePath(slug)).then(svgGeometry).catch(() => null);
    if (!BASELINE_DIR) {
      try {
        restoreCommittedSource(source);
      } catch (restoreError: unknown) {
        return {
          slug, resolver: "error", file: "-", shipped: null, before, fetched: null, delta: null, status: "UNRESOLVED",
          action: `audit error: ${errorMessage(error)}; restore error: ${errorMessage(restoreError)}`,
        };
      }
    }
    return {
      slug, resolver: "error", file: "-", shipped: null, before, fetched: null, delta: null, status: "UNRESOLVED",
      action: `audit error: ${errorMessage(error)}; ${BASELINE_DIR ? "would restore" : "restored"} HEAD source`,
    };
  }
}

function formatGeometry(geometry: SvgGeometry | null): string {
  return geometry ? `${geometry.width.toFixed(3)}:${geometry.height.toFixed(3)} (${geometry.aspect.toFixed(6)})` : "-";
}

async function main(): Promise<void> {
  const slugs = COMPANIES.map((company) => company.slug);
  const seeds = slugs.map(seedFor);
  const svgl = await fetchSvglIndex();
  const commons = await resolveCommonsFiles(seeds);
  const rows = await mapChunked(slugs, 4, (slug) => auditOne(slug, svgl, commons));
  console.log(`RESOLVER_PARITY_V1\tmode=${BASELINE_DIR ? `baseline:${BASELINE_DIR}` : "repair"}`);
  console.log("rule\tdirect URL → svgl → explicit Commons file/Wikidata P154");
  console.log("slug\tresolver\tfile\tshippedAspect\tbeforeAspect\tfetchedAspect\tdeltaPct\tstatus\taction");
  for (const row of rows) {
    console.log([
      row.slug, row.resolver, row.file, formatGeometry(row.shipped), formatGeometry(row.before), formatGeometry(row.fetched),
      row.delta === null ? "-" : (row.delta * 100).toFixed(3), row.status, row.action,
    ].join("\t"));
  }
  const counts = rows.reduce<Record<Status, number>>((total, row) => ({ ...total, [row.status]: total[row.status] + 1 }), {
    MATCH: 0, "MISMATCH-fixed": 0, UNRESOLVED: 0,
  });
  console.log(`SUMMARY\tMATCH=${counts.MATCH}\tMISMATCH-fixed=${counts["MISMATCH-fixed"]}\tUNRESOLVED=${counts.UNRESOLVED}`);
}

await main();
