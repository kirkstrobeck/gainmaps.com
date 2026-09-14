// Gainmaps by Kirk Strobeck – https://gainmaps.com

/**
 * Encode Ultra HDR gain map JPEGs at multiple widths for logo assets.
 *
 * Logos render in small square tiles (card ~160px, detail ~240px), so five
 * breakpoints spanning the 1024px source canvas cover every device:
 *   logo-gainmap-128.jpg  — retina-card / thumbnail
 *   logo-gainmap-256.jpg  — 2× card / 1× detail
 *   logo-gainmap-512.jpg  — full SDR equivalent
 *   logo-gainmap-768.jpg  — DPR-1.75 mobile card
 *   logo-gainmap-1024.jpg — max (DPR-2 at 512px tile)
 *   logo-gainmap.jpg      — alias for logo-gainmap-1024.jpg (backward compat)
 *
 * Uses the package encoder primitives so transparent pixels can retain their
 * alpha-derived zero gain while the SDR base gets the site's dark tile matte.
 */
import { mkdirSync, writeFileSync, copyFileSync } from "node:fs";
import { join } from "node:path";

import sharp from "sharp";
import { writeJpegGainMap } from "../../packages/gainmap/node_modules/hdrify/dist/index.js";
import { encodeKeepBaseGainMap, headroomFromBoost } from "../../packages/gainmap/src/encode.ts";

export const LOGO_WIDTHS = [128, 256, 512, 768, 1024] as const;
type LogoWidth = (typeof LOGO_WIDTHS)[number];

/** Lower quality for smaller variants; full quality at source size. */
const QUALITY: Record<LogoWidth, number> = { 128: 75, 256: 80, 512: 90, 768: 90, 1024: 90 };

const TILE_MATTE = [14, 17, 21] as const;

export function flattenLogoRgba(pixels: Uint8Array): Uint8ClampedArray {
  const output = new Uint8ClampedArray(pixels.length);
  for (let offset = 0; offset < pixels.length; offset += 4) {
    const alpha = pixels[offset + 3]! / 255;
    output[offset] = Math.round(pixels[offset]! * alpha + TILE_MATTE[0] * (1 - alpha));
    output[offset + 1] = Math.round(pixels[offset + 1]! * alpha + TILE_MATTE[1] * (1 - alpha));
    output[offset + 2] = Math.round(pixels[offset + 2]! * alpha + TILE_MATTE[2] * (1 - alpha));
    output[offset + 3] = 255;
  }
  return output;
}

export async function resizeRgbaSquare(
  pixels: Uint8Array,
  srcSize: number,
  targetSize: number,
): Promise<Uint8Array> {
  const input = Buffer.from(pixels.buffer, pixels.byteOffset, pixels.byteLength);
  const { data } = await sharp(input, {
    raw: { width: srcSize, height: srcSize, channels: 4 },
  })
    .resize({ width: targetSize, height: targetSize, fit: "fill" })
    .raw()
    .toBuffer({ resolveWithObject: true });
  return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
}

/**
 * Encode and write logo gain map JPEGs at each LOGO_WIDTHS breakpoint into outDir.
 *
 * @param pixels  Raw RGBA at canvas×canvas (always square from build-logos rasterize).
 * @param canvas  Source canvas size in pixels (512 in the current pipeline).
 * @param boost   HDR boost level — use the same constant as the caller.
 */
export async function encodeLogoVariants(
  pixels: Uint8Array,
  canvas: number,
  outDir: string,
  boost: number = 1.0,
): Promise<void> {
  mkdirSync(outDir, { recursive: true });

  const resized = await Promise.all(
    LOGO_WIDTHS.map((w) =>
      (w === canvas
        ? Promise.resolve(pixels)
        : resizeRgbaSquare(pixels, canvas, w)
      ).then((px) => ({ px, w })),
    ),
  );

  for (const { px, w } of resized) {
    const quality = QUALITY[w as LogoWidth];
    const sdr = flattenLogoRgba(px);
    const encoding = encodeKeepBaseGainMap(sdr, w, w, headroomFromBoost(boost), "highlight", px);
    const output = writeJpegGainMap(encoding, { quality, format: "ultrahdr" });
    const dest = join(outDir, `logo-gainmap-${w}.jpg`);
    writeFileSync(dest, output);
    if (w === 1024) {
      copyFileSync(dest, join(outDir, "logo-gainmap.jpg"));
    }
  }
}
