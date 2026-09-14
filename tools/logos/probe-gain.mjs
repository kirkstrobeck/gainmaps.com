#!/usr/bin/env node
/**
 * Probe the gain map stream embedded in an Ultra HDR JPEG (JPEG-R) and report
 * whether background (transparent-in-source) pixels are getting boosted.
 *
 * Usage: node tools/logos/probe-gain.mjs [file.jpg ...]
 * Defaults to the toyota + mcdonalds logo-gainmap-1024.jpg assets.
 *
 * Layout background: an Ultra HDR JPEG assembled by hdrify's
 * jpeg-assembler.js is [SOI][markers][primary SDR JPEG body incl. its own
 * EOI][SOI][markers][gain map JPEG body incl. its own EOI]. The gain map
 * stream's SOI (FF D8 FF) follows immediately after the primary image's
 * EOI (FF D9), with no gap, so we scan for that boundary and slice the gain
 * map JPEG out for decoding.
 *
 * Gain-byte decode convention (matches encodeKeepBaseGainMap in
 * packages/gainmap/src/encode.ts): value/255 maps linearly across
 * [gainMapMin, gainMapMax] in log2 space, i.e.
 *   gain = 2 ** (minLog2 + (v / 255) * (maxLog2 - minLog2))
 * For the checkerboard-matte logo pipeline minLog2 is always 0, so we decode
 * against a caller-supplied headroom (default: 6x, matching --boost 1).
 */
import { readFileSync } from "node:fs";
import sharp from "/workspace/node_modules/.pnpm/sharp@0.34.5/node_modules/sharp/lib/index.js";

const DEFAULT_FILES = [
  "/workspace/apps/web/public/logos/toyota/logo-gainmap-1024.jpg",
  "/workspace/apps/web/public/logos/mcdonalds/logo-gainmap-1024.jpg",
];

const PASS_RAW_BYTE_MAX = 2; // background raw byte must be <= this to pass
const DEFAULT_HEADROOM = 6; // matches --boost 1 (see headroomFromBoost)

function findMarkerAfter(bytes, marker2, fromOffset) {
  for (let i = fromOffset; i < bytes.length - 2; i += 1) {
    const isMarker = bytes[i] === 0xff && bytes[i + 1] === marker2;
    if (isMarker) return i;
  }
  return -1;
}

/** Find the primary image's EOI (FF D9), then the next SOI (FF D8) after it. */
function findGainMapSlice(bytes) {
  const eoi = findMarkerAfter(bytes, 0xd9, 2);
  const noEoi = eoi === -1;
  if (noEoi) return null;
  const soi = findMarkerAfter(bytes, 0xd8, eoi + 2);
  const noSecondStream = soi === -1;
  if (noSecondStream) return null;
  return bytes.subarray(soi);
}

/** Decode a raw 0-255 gain-map byte into a linear multiplier. */
function decodeGainByte(v, headroom = DEFAULT_HEADROOM) {
  const minLog2 = 0;
  const maxLog2 = Math.log2(Math.max(headroom, 1.0001));
  return 2 ** (minLog2 + (v / 255) * (maxLog2 - minLog2));
}

function samplePixel(data, width, channels, x, y) {
  const offset = (y * width + x) * channels;
  return { r: data[offset], g: data[offset + 1], b: data[offset + 2] };
}

function findBrightest(data, width, height, channels) {
  let best = { x: 0, y: 0, max: -1 };
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const p = samplePixel(data, width, channels, x, y);
      const m = Math.max(p.r, p.g, p.b);
      const isBrighter = m > best.max;
      if (isBrighter) best = { x, y, max: m };
    }
  }
  return best;
}

function formatGain(p) {
  return `${decodeGainByte(p.r).toFixed(4)}x,${decodeGainByte(p.g).toFixed(4)}x,${decodeGainByte(p.b).toFixed(4)}x`;
}

async function probeOne(path) {
  const bytes = readFileSync(path);
  const gainMapJpeg = findGainMapSlice(bytes);
  console.log(`\n=== ${path} ===`);
  const notFound = !gainMapJpeg;
  if (notFound) {
    console.log("FAIL: could not locate a second JPEG stream (gain map) in file");
    return false;
  }

  const { data, info } = await sharp(gainMapJpeg).raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;

  // Gain map is encoded at the same resolution as the source image
  // (encodeKeepBaseGainMap builds it with identical width/height), so full-
  // res pixel (4,4) maps 1:1 onto gain-map pixel (4,4).
  const bgX = Math.min(width - 1, 4);
  const bgY = Math.min(height - 1, 4);
  const bgSample = samplePixel(data, width, channels, bgX, bgY);

  const best = findBrightest(data, width, height, channels);
  const inkSample = samplePixel(data, width, channels, best.x, best.y);

  console.log(`gain-map dimensions: ${width}x${height} (channels=${channels})`);
  console.log(
    `background @ (${bgX},${bgY}): raw=${bgSample.r},${bgSample.g},${bgSample.b} gain=${formatGain(bgSample)}`,
  );
  console.log(
    `ink (brightest) @ (${best.x},${best.y}): raw=${inkSample.r},${inkSample.g},${inkSample.b} gain=${formatGain(inkSample)}`,
  );

  const bgMax = Math.max(bgSample.r, bgSample.g, bgSample.b);
  const pass = bgMax <= PASS_RAW_BYTE_MAX;
  const verdict = pass
    ? `PASS: background raw byte ${bgMax} <= ${PASS_RAW_BYTE_MAX} (not boosted)`
    : `FAIL: background raw byte ${bgMax} > ${PASS_RAW_BYTE_MAX} (background IS boosted, gain=${decodeGainByte(bgMax).toFixed(4)}x)`;
  console.log(verdict);
  return pass;
}

const files = process.argv.slice(2);
const targets = files.length > 0 ? files : DEFAULT_FILES;

const results = [];
for (const path of targets) {
  results.push(await probeOne(path));
}
const allPass = results.every(Boolean);

console.log(`\n${allPass ? "ALL PASS" : "SOME FAILED"}`);
process.exit(allPass ? 0 : 1);
