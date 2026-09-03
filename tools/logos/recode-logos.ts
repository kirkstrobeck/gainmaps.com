#!/usr/bin/env npx tsx
// Re-encode existing logo SVGs to 16:9 gain map JPEGs without re-fetching.
// Reads logo.svg from each slug directory and regenerates logo-gainmap-*.jpg.
// Run from the repo root: npx tsx tools/logos/recode-logos.ts

import { readdir, readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

import { encodeLogoVariants } from "./encode-logo-variants.ts";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "../..");
const publicRoot = join(repo, "apps/web/public/logos");

const CANVAS_W = 512;
const CANVAS_H = Math.round(CANVAS_W * 9 / 16); // 288
const LOGO_BOX_W = Math.round(CANVAS_W * 0.88); // 450
const LOGO_BOX_H = Math.round(CANVAS_H * 0.88); // 253
const BOOST = 0.5;

async function rasterize(svg: Buffer): Promise<Uint8Array> {
  const probe = await sharp(svg).metadata();
  const longest = Math.max(probe.width ?? LOGO_BOX_W, probe.height ?? LOGO_BOX_H);
  const boxLongest = Math.max(LOGO_BOX_W, LOGO_BOX_H);
  const density = Math.min(2400, Math.max(72, Math.round((72 * boxLongest) / Math.max(longest, 1))));

  const logo = await sharp(svg, { density })
    .resize({ width: LOGO_BOX_W, height: LOGO_BOX_H, fit: "inside", withoutEnlargement: false })
    .png()
    .toBuffer();

  const { data } = await sharp({
    create: {
      width: CANVAS_W,
      height: CANVAS_H,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: logo, gravity: "centre" }])
    .raw()
    .toBuffer({ resolveWithObject: true });

  return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
}

async function main(): Promise<void> {
  const slugs = (await readdir(publicRoot, { withFileTypes: true }))
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();

  console.log(`Recoding ${slugs.length} logos to ${CANVAS_W}×${CANVAS_H} with ${LOGO_BOX_W}×${LOGO_BOX_H} logo box...`);

  let done = 0;
  let failed = 0;
  for (const slug of slugs) {
    const svgPath = join(publicRoot, slug, "logo.svg");
    const svg = await readFile(svgPath).catch(() => null);
    if (!svg) {
      console.error(`  skip ${slug} — no logo.svg`);
      failed++;
      continue;
    }

    const pixels = await rasterize(svg).catch((err: unknown) => {
      console.error(`  fail ${slug} — ${err instanceof Error ? err.message : String(err)}`);
      return null;
    });
    if (!pixels) { failed++; continue; }

    await encodeLogoVariants(pixels, CANVAS_W, CANVAS_H, join(publicRoot, slug), BOOST);
    done++;
    console.log(`  [${done}/${slugs.length}] ${slug}`);
  }

  console.log(`\nDone: ${done} recoded, ${failed} failed`);
}

await main();
