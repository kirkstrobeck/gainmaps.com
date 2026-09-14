#!/usr/bin/env npx tsx
// Gainmaps by Kirk Strobeck – https://gainmaps.com

/**
 * Ink quality metric for logo SVGs.
 *
 * Measures what fraction of ink pixels have original luminance ≥ the
 * reverseDarkInkToWhite threshold (0.36) — i.e., colours that survive
 * normalisation unchanged.  Logos where almost all colour is below the
 * threshold become boring white blobs on the dark instrument background
 * and are poor Ultra-HDR demonstrations.
 */
import sharp from "sharp";

const SIZE = 512;
const LUMINANCE_THRESHOLD = 0.36; // mirrors logo-svg-normalize.ts

export const BRIGHT_FRACTION_THRESHOLD = 0.30;

export type InkMetricResult = {
  inkPixels: number;
  maxOriginalLuminance: number;
  preservedFraction: number; // fraction of ink pixels with lum >= LUMINANCE_THRESHOLD
};

function sRGBToLinear(v: number): number {
  const c = v / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

export async function inkMetric(svgBuffer: Buffer, size = SIZE): Promise<InkMetricResult> {
  // Rasterize WITHOUT reverseDarkInkToWhite — measure original colours
  const probe = await sharp(svgBuffer).metadata();
  const longest = Math.max(probe.width ?? size, probe.height ?? size);
  const density = Math.min(2400, Math.max(72, Math.round(72 * size / Math.max(longest, 1))));

  const logo = await sharp(svgBuffer, { density })
    .resize({ width: size, height: size, fit: "inside", withoutEnlargement: false })
    .png().toBuffer();

  const { data } = await sharp({
    create: { width: size, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([{ input: logo, gravity: "centre" }])
    .ensureAlpha().raw().toBuffer({ resolveWithObject: true });

  let inkPixels = 0;
  let preservedPixels = 0;
  let maxLum = 0;
  const count = size * size;
  for (let i = 0; i < count; i++) {
    const a = data[i * 4 + 3]!;
    if (a < 128) continue;
    inkPixels++;
    const lr = sRGBToLinear(data[i * 4]!);
    const lg = sRGBToLinear(data[i * 4 + 1]!);
    const lb = sRGBToLinear(data[i * 4 + 2]!);
    const lum = 0.2126 * lr + 0.7152 * lg + 0.0722 * lb;
    if (lum > maxLum) maxLum = lum;
    if (lum >= LUMINANCE_THRESHOLD) preservedPixels++;
  }
  const preservedFraction = inkPixels > 0 ? preservedPixels / inkPixels : 0;
  return { inkPixels, maxOriginalLuminance: maxLum, preservedFraction };
}

export function shouldKeep(metric: InkMetricResult): boolean {
  return metric.preservedFraction >= BRIGHT_FRACTION_THRESHOLD;
}
