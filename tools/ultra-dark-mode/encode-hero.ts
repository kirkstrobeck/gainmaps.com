#!/usr/bin/env npx tsx
// Ultra mode by Kirk Strobeck – https://UltraDarkMode.com

/**
 * Encode the ultradarkmode.com hero photo into a gain map JPEG.
 *
 * Source: apps/web/public/appearance/peaks.jpg (SDR)
 * Output: apps/ultra-dark-mode/public/peaks-ultra.jpg (Ultra HDR)
 *
 * The note this prints is what the caption under the photo shows, so it is
 * copied into apps/ultra-dark-mode/lib/hero-photo.ts by hand. Re-run this and
 * update that constant if the source photo or the boost ever changes.
 *
 * Decoding is jpeg-js, not `sips`: sips is macOS-only and this runs in a linux
 * container.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import jpeg from "jpeg-js";

import { encodeRgbaToUltraHdrJpeg } from "../../apps/web/lib/gain-map-encode.ts";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "../..");
const sourceJpeg = join(repo, "apps/web/public/appearance/peaks.jpg");
const outJpeg = join(repo, "apps/ultra-dark-mode/public/peaks-ultra.jpg");

const decoded = jpeg.decode(readFileSync(sourceJpeg), { useTArray: true });
const rgba = new Uint8Array(
  decoded.data.buffer,
  decoded.data.byteOffset,
  decoded.data.byteLength,
);

// Default highlight model: lift the bright parts into headroom, leave midtones.
const encoded = encodeRgbaToUltraHdrJpeg(rgba, decoded.width, decoded.height, {
  boost: 0.5,
});

writeFileSync(outJpeg, encoded.output);
process.stdout.write(`${outJpeg}\n${encoded.note}\nbytes=${encoded.output.byteLength}\n`);
