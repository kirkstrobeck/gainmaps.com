#!/usr/bin/env npx tsx
// Measure the ink bounding box in each rasterized logo and report margins.
// Verifies that all four sides have at least 4% padding from the frame edge.
// Run from repo root: npx tsx tools/logos/measure-margins.ts

import { readdir, readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "../..");
const publicRoot = join(repo, "apps/web/public/logos");

const CANVAS_W = 512;
const CANVAS_H = Math.round(CANVAS_W * 9 / 16); // 288
const LOGO_BOX_W = Math.round(CANVAS_W * 0.88); // 450
const LOGO_BOX_H = Math.round(CANVAS_H * 0.88); // 253

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

type Margins = { top: number; bottom: number; left: number; right: number; minPct: number };

function measureInkBBox(pixels: Uint8Array, w: number, h: number): Margins | null {
  let minX = w, maxX = -1, minY = h, maxY = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const alpha = pixels[(y * w + x) * 4 + 3]!;
      if (alpha > 8) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) return null; // no ink

  const topPx = minY;
  const bottomPx = h - 1 - maxY;
  const leftPx = minX;
  const rightPx = w - 1 - maxX;

  const top = (topPx / h) * 100;
  const bottom = (bottomPx / h) * 100;
  const left = (leftPx / w) * 100;
  const right = (rightPx / w) * 100;

  return { top, bottom, left, right, minPct: Math.min(top, bottom, left, right) };
}

async function main(): Promise<void> {
  const slugs = (await readdir(publicRoot, { withFileTypes: true }))
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();

  let worstSlug = "";
  let worstMinPct = Infinity;
  let failCount = 0;
  let passCount = 0;

  for (const slug of slugs) {
    const svgPath = join(publicRoot, slug, "logo.svg");
    const svg = await readFile(svgPath).catch(() => null);
    if (!svg) continue;

    const pixels = await rasterize(svg).catch(() => null);
    if (!pixels) { console.log(`  fail ${slug}`); failCount++; continue; }

    const m = measureInkBBox(pixels, CANVAS_W, CANVAS_H);
    if (!m) { console.log(`  blank ${slug}`); continue; }

    const ok = m.minPct >= 4;
    if (ok) passCount++;
    else { failCount++; console.log(`  FAIL ${slug}  top=${m.top.toFixed(1)}% bottom=${m.bottom.toFixed(1)}% left=${m.left.toFixed(1)}% right=${m.right.toFixed(1)}%`); }

    if (m.minPct < worstMinPct) {
      worstMinPct = m.minPct;
      worstSlug = slug;
    }
  }

  console.log(`\nPassed: ${passCount}/${slugs.length}`);
  console.log(`Worst: ${worstSlug}  min_margin=${worstMinPct.toFixed(2)}%`);
  if (failCount > 0) process.exit(1);
}

await main();
