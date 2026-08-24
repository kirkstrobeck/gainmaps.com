import {
  sRGBToLinear,
  writeJpegGainMap,
  type EncodingResult,
} from "hdrify";

import calibration from "../../../fixtures/window/calibration.json" with { type: "json" };

export type GainMapHdrModel = "highlight" | "window";

export type GainMapEncodeOptions = {
  /** 0..1 UI boost. 0.5 ≈ default photo headroom. */
  boost?: number;
  /**
   * `highlight` (default): expand bright regions toward headroom; leave midtones alone.
   * `window`: scene-fit from fixtures/window/calibration.json (accuracy tests only).
   */
  hdrModel?: GainMapHdrModel;
  /**
   * What transparent pixels become, since JPEG has no alpha. `white` (default)
   * suits photos, which are opaque anyway. `checkerboard` suits art with holes
   * — see flattenRgbaOntoCheckerboard.
   */
  matte?: "white" | "checkerboard";
};

export type GainMapEncodeResult = {
  output: Uint8Array;
  note: string;
  width: number;
  height: number;
  headroom: number;
};

export const WINDOW_GAIN_CALIBRATION = {
  headroom: calibration.headroom,
  ev: calibration.ev,
  saturation: calibration.saturation,
  scale: calibration.scale as [number, number, number],
  offset: calibration.offset as [number, number, number],
} as const;

export const DEFAULT_PHOTO_HEADROOM = WINDOW_GAIN_CALIBRATION.headroom;

export function headroomFromBoost(boost: number): number {
  const mid = DEFAULT_PHOTO_HEADROOM;
  if (boost <= 0.5) return 2 + (boost / 0.5) * (mid - 2);
  return mid + ((boost - 0.5) / 0.5) * (6 - mid);
}

/** JPEG has no alpha — transparent pixels become white. */
export function flattenRgbaOntoWhite(
  pixels: Uint8Array,
  width: number,
  height: number,
): Uint8ClampedArray {
  return flattenRgba(pixels, width, height, () => [255, 255, 255]);
}

const CHECKER_SQUARE = 16;
const CHECKER_LIGHT = 245;
const CHECKER_DARK = 226;

/**
 * The transparency matte for art that has holes in it. A photo flattened onto
 * white loses nothing; a logo flattened onto white gains a plate it never had,
 * and the viewer cannot tell the mark's own white from the background. A soft
 * gray checker reads as "nothing here" the way white never can, so a downloaded
 * file still says where the mark ends.
 */
export function flattenRgbaOntoCheckerboard(
  pixels: Uint8Array,
  width: number,
  height: number,
  square: number = CHECKER_SQUARE,
): Uint8ClampedArray {
  return flattenRgba(pixels, width, height, (x, y) => {
    const shade =
      (Math.floor(x / square) + Math.floor(y / square)) % 2 === 0 ? CHECKER_LIGHT : CHECKER_DARK;
    return [shade, shade, shade];
  });
}

function flattenRgba(
  pixels: Uint8Array,
  width: number,
  height: number,
  matteAt: (x: number, y: number) => readonly [number, number, number],
): Uint8ClampedArray {
  const sdr = new Uint8ClampedArray(width * height * 4);
  for (let index = 0; index < width * height; index += 1) {
    const offset = index * 4;
    const alpha = pixels[offset + 3]! / 255;
    const matte = matteAt(index % width, Math.floor(index / width));
    sdr[offset] = Math.round(pixels[offset]! * alpha + matte[0] * (1 - alpha));
    sdr[offset + 1] = Math.round(pixels[offset + 1]! * alpha + matte[1] * (1 - alpha));
    sdr[offset + 2] = Math.round(pixels[offset + 2]! * alpha + matte[2] * (1 - alpha));
    sdr[offset + 3] = 255;
  }
  return sdr;
}

/**
 * General photo HDR target: keep midtones near the SDR base; lift highlights
 * toward `headroom`. Avoids the global EV wash that window calibration applies.
 */
export function applyHighlightSelectiveHdr(
  r: number,
  g: number,
  b: number,
  headroom: number,
): [number, number, number] {
  const y = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  const t = smoothstep(0.28, 0.88, y);
  const weight = t * t;
  const gain = 1 + weight * (Math.max(headroom, 1) - 1);
  return [r * gain, g * gain, b * gain];
}

/**
 * Point-fit transform from fixtures/window/calibration.json:
 * rgb' = rgb * 2^ev * scale + offset; then luma + (rgb'-luma)*saturation
 * Input/output are linear light (Display P3 / scene-referred as ImageIO expands).
 */
export function applyWindowGainCalibration(
  r: number,
  g: number,
  b: number,
  headroom: number,
): [number, number, number] {
  const { ev, saturation, scale, offset } = WINDOW_GAIN_CALIBRATION;
  const evAdj = ev + Math.log2(Math.max(headroom, 1.0001) / WINDOW_GAIN_CALIBRATION.headroom);
  const m = 2 ** evAdj;
  const rr = Math.max(0, r * m * scale[0] + offset[0]);
  const gg = Math.max(0, g * m * scale[1] + offset[1]);
  const bb = Math.max(0, b * m * scale[2] + offset[2]);
  if (Math.abs(saturation - 1) <= 1e-4) return [rr, gg, bb];
  const y = 0.2126 * rr + 0.7152 * gg + 0.0722 * bb;
  return [
    Math.max(0, y + (rr - y) * saturation),
    Math.max(0, y + (gg - y) * saturation),
    Math.max(0, y + (bb - y) * saturation),
  ];
}

type HdrMapper = (
  r: number,
  g: number,
  b: number,
  headroom: number,
) => [number, number, number];

function hdrMapperFor(model: GainMapHdrModel): HdrMapper {
  if (model === "window") return applyWindowGainCalibration;
  return applyHighlightSelectiveHdr;
}

/**
 * Keep the SDR JPEG identical to the source look; store HDR/SDR ratios in the
 * gain map so HDR decode expands according to `hdrModel`.
 */
export function encodeKeepBaseGainMap(
  sdr: Uint8ClampedArray,
  width: number,
  height: number,
  headroom: number,
  hdrModel: GainMapHdrModel = "highlight",
): EncodingResult {
  const offsetSdr = [1 / 64, 1 / 64, 1 / 64] as [number, number, number];
  const offsetHdr = [1 / 64, 1 / 64, 1 / 64] as [number, number, number];
  const gamma = [1, 1, 1] as [number, number, number];
  const minContentBoost = 1;
  const maxContentBoost = Math.max(headroom, 1.0001);
  const minLog2 = Math.log2(minContentBoost);
  const maxLog2 = Math.log2(maxContentBoost);
  const invLogRange = 1 / (maxLog2 - minLog2);
  const gainMap = new Uint8ClampedArray(sdr.length);
  const mapHdr = hdrMapperFor(hdrModel);
  const count = width * height;

  for (let index = 0; index < count; index += 1) {
    const offset = index * 4;
    const sdrR = sRGBToLinear(sdr[offset]! / 255);
    const sdrG = sRGBToLinear(sdr[offset + 1]! / 255);
    const sdrB = sRGBToLinear(sdr[offset + 2]! / 255);
    const [hdrR, hdrG, hdrB] = mapHdr(sdrR, sdrG, sdrB, headroom);
    const gainR = (hdrR + offsetHdr[0]) / (sdrR + offsetSdr[0]);
    const gainG = (hdrG + offsetHdr[1]) / (sdrG + offsetSdr[1]);
    const gainB = (hdrB + offsetHdr[2]) / (sdrB + offsetSdr[2]);
    gainMap[offset] = Math.round(255 * clamp((Math.log2(Math.max(gainR, 1e-8)) - minLog2) * invLogRange, 0, 1) ** gamma[0]);
    gainMap[offset + 1] = Math.round(255 * clamp((Math.log2(Math.max(gainG, 1e-8)) - minLog2) * invLogRange, 0, 1) ** gamma[1]);
    gainMap[offset + 2] = Math.round(255 * clamp((Math.log2(Math.max(gainB, 1e-8)) - minLog2) * invLogRange, 0, 1) ** gamma[2]);
    gainMap[offset + 3] = 255;
  }

  return {
    sdr,
    gainMap,
    width,
    height,
    metadata: {
      gamma,
      offsetSdr,
      offsetHdr,
      gainMapMin: [minLog2, minLog2, minLog2],
      gainMapMax: [maxLog2, maxLog2, maxLog2],
      hdrCapacityMin: 0,
      hdrCapacityMax: Math.max(0, maxLog2),
    },
  };
}

export function encodeRgbaToUltraHdrJpeg(
  pixels: Uint8Array,
  width: number,
  height: number,
  options: GainMapEncodeOptions = {},
): GainMapEncodeResult {
  const boost = clamp(Number(options.boost ?? 0.5), 0, 1);
  const headroom = headroomFromBoost(boost);
  const hdrModel = options.hdrModel ?? "highlight";
  const sdr =
    options.matte === "checkerboard"
      ? flattenRgbaOntoCheckerboard(pixels, width, height)
      : flattenRgbaOntoWhite(pixels, width, height);
  const encoding = encodeKeepBaseGainMap(sdr, width, height, headroom, hdrModel);
  const output = writeJpegGainMap(encoding, {
    quality: 92,
    format: "ultrahdr",
  });
  return {
    output,
    width,
    height,
    headroom,
    note: `Gain map JPEG · ${headroom.toFixed(2)}× · ${width}×${height}`,
  };
}

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(Math.max(value, min), max);
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}
