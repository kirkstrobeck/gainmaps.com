#!/usr/bin/env node
/**
 * Content-aware gainmap corner probe.
 *
 * Walk all logo slug directories and verify that BACKGROUND corner pixels
 * in every gain-map JPEG variant have raw byte ≤ PASS_RAW_BYTE_MAX.
 *
 * "Background" means: the corresponding pixel in the rasterized logo.svg
 * has alpha < CONTENT_ALPHA_MIN — i.e., it is transparent background, not
 * logo ink. Logo-content corners (alpha ≥ CONTENT_ALPHA_MIN) are skipped.
 *
 * PASS_RAW_BYTE_MAX = 30 (not 2) to allow JPEG-block ringing that occurs in
 * small low-quality variants; the old-bug threshold was ~252, far above 30.
 *
 * Usage: node tools/logos/probe-gain-all.mjs
 */
import { readdirSync, existsSync, readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import sharp from "/workspace/node_modules/.pnpm/sharp@0.34.5/node_modules/sharp/lib/index.js";

const LOGOS_DIR = "/workspace/apps/web/public/logos";
const VARIANTS = [
  "logo-gainmap.jpg",
  "logo-gainmap-128.jpg",
  "logo-gainmap-256.jpg",
  "logo-gainmap-512.jpg",
  "logo-gainmap-1024.jpg",
];
const PASS_RAW_BYTE_MAX = 30;
const CONTENT_ALPHA_MIN = 10;   // pixels with alpha >= this are logo ink, not background
const RASTER_SIZE = 1024;       // matches pipeline CANVAS

function findMarkerAfter(bytes, marker2, fromOffset) {
  for (let i = fromOffset; i < bytes.length - 2; i += 1) {
    if (bytes[i] === 0xff && bytes[i + 1] === marker2) return i;
  }
  return -1;
}

function findGainMapSlice(bytes) {
  const eoi = findMarkerAfter(bytes, 0xd9, 2);
  if (eoi === -1) return null;
  const soi = findMarkerAfter(bytes, 0xd8, eoi + 2);
  if (soi === -1) return null;
  return bytes.subarray(soi);
}

function cornerPoints(w, h) {
  return [
    [0, 0], [0, 1], [1, 0], [1, 1],
    [0, h - 1], [0, h - 2], [1, h - 1],
    [w - 1, 0], [w - 2, 0], [w - 1, 1],
    [w - 1, h - 1], [w - 2, h - 1], [w - 1, h - 2],
  ].filter(([x, y]) => x >= 0 && y >= 0 && x < w && y < h);
}

/** Rasterize logo.svg → 1024×1024 alpha channel (Uint8Array, length=1024*1024). */
async function getRasterAlpha(slug) {
  const svgPath = `${LOGOS_DIR}/${slug}/logo.svg`;
  if (!existsSync(svgPath)) return null;
  const svgBuf = readFileSync(svgPath);
  const probe = await sharp(svgBuf).metadata().catch(() => null);
  const longest = probe ? Math.max(probe.width ?? RASTER_SIZE, probe.height ?? RASTER_SIZE) : RASTER_SIZE;
  const density = Math.min(2400, Math.max(72, Math.round(72 * RASTER_SIZE / Math.max(longest, 1))));

  const logo = await sharp(svgBuf, { density })
    .resize({ width: RASTER_SIZE, height: RASTER_SIZE, fit: "inside", withoutEnlargement: false })
    .png().toBuffer();

  const { data } = await sharp({
    create: { width: RASTER_SIZE, height: RASTER_SIZE, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([{ input: logo, gravity: "centre" }])
    .raw().toBuffer({ resolveWithObject: true });

  const alpha = new Uint8Array(RASTER_SIZE * RASTER_SIZE);
  for (let i = 0; i < RASTER_SIZE * RASTER_SIZE; i++) alpha[i] = data[i * 4 + 3];
  return alpha;
}

/** Downsample alpha1024 (1024×1024) to targetW×targetW by averaging. */
function resizeAlpha(alpha1024, targetW) {
  if (targetW === RASTER_SIZE) return alpha1024;
  const scale = RASTER_SIZE / targetW;
  const out = new Uint8Array(targetW * targetW);
  for (let y = 0; y < targetW; y++) {
    for (let x = 0; x < targetW; x++) {
      const sx = Math.min(Math.round(x * scale), RASTER_SIZE - 1);
      const sy = Math.min(Math.round(y * scale), RASTER_SIZE - 1);
      out[y * targetW + x] = alpha1024[sy * RASTER_SIZE + sx];
    }
  }
  return out;
}

async function probeFile(path, alphaMask) {
  if (!existsSync(path)) return { status: "missing", fail: true };
  const bytes = await readFile(path);
  const gmSlice = findGainMapSlice(bytes);
  if (!gmSlice) return { status: "no-gainmap-stream", fail: true };

  const { data, info } = await sharp(gmSlice).raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const resizedAlpha = alphaMask ? resizeAlpha(alphaMask, width) : null;

  const corners = cornerPoints(width, height);
  let maxCornerRaw = 0;
  const failedCorners = [];

  for (const [x, y] of corners) {
    if (resizedAlpha && resizedAlpha[y * width + x] >= CONTENT_ALPHA_MIN) continue;
    const offset = (y * width + x) * channels;
    const maxRaw = Math.max(data[offset] ?? 0, data[offset + 1] ?? 0, data[offset + 2] ?? 0);
    if (maxRaw > maxCornerRaw) maxCornerRaw = maxRaw;
    if (maxRaw > PASS_RAW_BYTE_MAX) failedCorners.push({ x, y, maxRaw });
  }

  const pass = failedCorners.length === 0;
  return { status: pass ? "pass" : "fail", fail: !pass, width, height, maxCornerRaw, failedCorners };
}

const slugs = readdirSync(LOGOS_DIR, { withFileTypes: true })
  .filter((e) => e.isDirectory())
  .map((e) => e.name)
  .sort();

let totalFiles = 0;
let totalFail = 0;

for (const slug of slugs) {
  const alphaMask = await getRasterAlpha(slug);
  for (const variant of VARIANTS) {
    const filePath = `${LOGOS_DIR}/${slug}/${variant}`;
    totalFiles++;
    const result = await probeFile(filePath, alphaMask);
    const label = result.fail ? "FAIL" : "PASS";
    const dims = result.width ? `${result.width}x${result.height}` : "";
    const detail = result.fail
      ? ` maxCornerRaw=${result.maxCornerRaw} failedCorners=${result.failedCorners?.length ?? "?"}`
      : ` maxCornerRaw=${result.maxCornerRaw}`;
    console.log(`${label}  ${slug}/${variant}  ${dims}${detail}`);
    if (result.fail) totalFail++;
  }
}

console.log("");
if (totalFail > 0) {
  console.log(`FAILED ${totalFail} of ${totalFiles} files`);
  process.exit(1);
} else {
  console.log(`ALL PASS ${totalFiles} files`);
}
