#!/usr/bin/env npx tsx
// Gainmaps by Kirk Strobeck – https://gainmaps.com

/**
 * Shipped-tile exclusion metric at 128px. Provisional best measurable cut:
 * Tesla (0.683965) < 0.707314 < McDonald's (0.730662). Seven required sources
 * normalize to zero ink, so the production gate is infeasible and disabled.
 */
import sharp from "sharp";

import { resizeRgbaSquare } from "./encode-logo-variants.ts";
import { CANVAS, rasterize } from "./logo-pipeline.ts";
import { normalizeLogoSvg } from "./logo-svg-normalize.ts";
import { pixelStats, shippedPixelStats, type InkPixelStats, type ShippedInkStats } from "./pixel-stats.ts";
import { prepareSvgForRaster, svgSourceProblem } from "./svg-source.ts";
import type { LogoSeed } from "./sources.ts";

const SIZE = 512;
const TILE_SIZE = 128;
export const BRIGHT_LUM = 0.36;
export const SATURATION_MIN = 0.85;
export const LUMINANCE_FLOOR = 0.04;
export const SCORE_MIN = 0.707314;
export const GATE_FEASIBLE = false;
export type InkMetricResult = ShippedInkStats & { readonly raw: InkPixelStats };

export async function rawColorMetric(svgBuffer: Buffer, size = SIZE): Promise<InkPixelStats> {
  const problem = svgSourceProblem(svgBuffer);
  if (problem) throw new Error(problem);
  const prepared = prepareSvgForRaster(svgBuffer);
  const metadata = await sharp(prepared).metadata();
  const longest = Math.max(metadata.width ?? size, metadata.height ?? size);
  const density = Math.min(2400, Math.max(72, Math.round((72 * size) / Math.max(longest, 1))));
  const logo = await sharp(prepared, { density })
    .resize({ width: size, height: size, fit: "inside", withoutEnlargement: false })
    .png().toBuffer();
  const { data } = await sharp({
    create: { width: size, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  }).composite([{ input: logo, gravity: "centre" }]).ensureAlpha().raw()
    .toBuffer({ resolveWithObject: true });
  const stats = pixelStats(data, {
    brightLum: BRIGHT_LUM,
    saturationMin: SATURATION_MIN,
    luminanceFloor: LUMINANCE_FLOOR,
  });
  if (stats.inkPixels === 0) throw new Error("rasterized SVG has zero ink pixels");
  return stats;
}

export async function inkMetric(seed: LogoSeed, svgBuffer: Buffer): Promise<InkMetricResult> {
  const raw = await rawColorMetric(svgBuffer);
  const normalized = normalizeLogoSvg(seed, svgBuffer);
  const raster = await rasterize(normalized);
  const tile = await resizeRgbaSquare(raster, CANVAS, TILE_SIZE);
  const shipped = shippedPixelStats(tile, {
    brightLum: BRIGHT_LUM,
    saturationMin: SATURATION_MIN,
    luminanceFloor: LUMINANCE_FLOOR,
  });
  if (shipped.inkPixels === 0) throw new Error("rasterized SVG has zero ink pixels at 128px");
  return { ...shipped, raw };
}

export function shouldKeep(metric: InkMetricResult): boolean {
  return metric.inkPixels > 0 && metric.score >= SCORE_MIN;
}
