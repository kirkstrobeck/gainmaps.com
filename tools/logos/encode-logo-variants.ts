// Gainmaps by Kirk Strobeck – https://gainmaps.com

/**
 * Encode Ultra HDR gain map JPEGs at multiple widths for logo assets.
 *
 * Logos render in small square tiles (card ~160px, detail ~240px), so three
 * breakpoints spanning the 512px source canvas cover every device:
 *   logo-gainmap-128.jpg — retina-card / thumbnail
 *   logo-gainmap-256.jpg — 2× card / 1× detail
 *   logo-gainmap-512.jpg — full source resolution
 *   logo-gainmap.jpg     — alias for logo-gainmap-512.jpg (backward compat)
 */
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

import sharp from "sharp";

import { encodeRgbaToUltraHdrJpeg } from "../../apps/web/lib/gain-map-encode.ts";

export const LOGO_WIDTHS = [128, 256, 512] as const;
type LogoWidth = (typeof LOGO_WIDTHS)[number];

/** Lower quality for smaller variants; full quality at source size. */
const QUALITY: Record<LogoWidth, number> = { 128: 75, 256: 80, 512: 90 };

async function resizeRgbaSquare(
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
  boost: number = 0.5,
): Promise<void> {
  await mkdir(outDir, { recursive: true });

  const resized = await Promise.all(
    LOGO_WIDTHS.map((w) =>
      (w === canvas
        ? Promise.resolve(pixels)
        : resizeRgbaSquare(pixels, canvas, w)
      ).then((px) => ({ px, w })),
    ),
  );

  const writes: Promise<void>[] = [];
  for (const { px, w } of resized) {
    const quality = QUALITY[w as LogoWidth];
    const encoded = encodeRgbaToUltraHdrJpeg(px, w, w, {
      boost,
      matte: "checkerboard",
      quality,
    });
    writes.push(writeFile(join(outDir, `logo-gainmap-${w}.jpg`), encoded.output));
    if (w === 512) {
      writes.push(writeFile(join(outDir, "logo-gainmap.jpg"), encoded.output));
    }
  }
  await Promise.all(writes);
}
