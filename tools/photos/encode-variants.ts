// Gainmaps by Kirk Strobeck – https://gainmaps.com

/**
 * Encode Ultra HDR gain map JPEGs at multiple widths from a single RGBA buffer.
 *
 * Called by build-photos.ts after rasterising at max edge. Produces:
 *   gainmap-400.jpg  — thumbnail / narrow viewport
 *   gainmap-800.jpg  — mid-size
 *   gainmap-1280.jpg — full size
 *   gainmap.jpg      — alias for gainmap-1280.jpg (backward compat)
 */
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

import sharp from "sharp";

import { encodeRgbaToUltraHdrJpeg } from "../../apps/web/lib/gain-map-encode.ts";

export const PHOTO_WIDTHS = [400, 800, 1280] as const;
type PhotoWidth = (typeof PHOTO_WIDTHS)[number];

/** Lower quality for smaller variants to save more bytes; full quality at max. */
const QUALITY: Record<PhotoWidth, number> = { 400: 75, 800: 80, 1280: 90 };

async function resizeRgba(
  pixels: Uint8Array,
  srcWidth: number,
  srcHeight: number,
  targetWidth: number,
): Promise<{ pixels: Uint8Array; width: number; height: number }> {
  const input = Buffer.from(pixels.buffer, pixels.byteOffset, pixels.byteLength);
  const { data, info } = await sharp(input, {
    raw: { width: srcWidth, height: srcHeight, channels: 4 },
  })
    .resize({ width: targetWidth, fit: "inside", withoutEnlargement: true })
    .raw()
    .toBuffer({ resolveWithObject: true });
  return {
    pixels: new Uint8Array(data.buffer, data.byteOffset, data.byteLength),
    width: info.width,
    height: info.height,
  };
}

/**
 * Encode and write gain map JPEGs at each PHOTO_WIDTHS breakpoint into outDir.
 *
 * @param pixels  Raw RGBA at srcWidth × srcHeight (from rasterize()).
 * @param boost   HDR boost level — use the same constant as the caller.
 */
export async function encodeVariants(
  pixels: Uint8Array,
  srcWidth: number,
  srcHeight: number,
  outDir: string,
  boost: number = 1.0,
): Promise<void> {
  await mkdir(outDir, { recursive: true });

  const resized = await Promise.all(
    PHOTO_WIDTHS.map((w) =>
      resizeRgba(pixels, srcWidth, srcHeight, w).then((r) => ({ ...r, targetW: w })),
    ),
  );

  const writes: Promise<void>[] = [];
  for (const { pixels: px, width, height, targetW } of resized) {
    const quality = QUALITY[targetW as PhotoWidth];
    const encoded = encodeRgbaToUltraHdrJpeg(px, width, height, {
      boost,
      matte: "white",
      quality,
    });
    writes.push(writeFile(join(outDir, `gainmap-${targetW}.jpg`), encoded.output));
    if (targetW === 1280) {
      writes.push(writeFile(join(outDir, "gainmap.jpg"), encoded.output));
    }
  }
  await Promise.all(writes);
}
