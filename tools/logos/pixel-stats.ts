// Gainmaps by Kirk Strobeck – https://gainmaps.com

export type InkPixelStats = {
  readonly inkPixels: number;
  readonly meanLum: number;
  readonly maxLum: number;
  readonly brightFraction: number;
  readonly saturatedFraction: number;
  readonly vividFraction: number;
  readonly dominant: { readonly r: number; readonly g: number; readonly b: number; readonly hex: string };
};

export type MetricThresholds = {
  readonly brightLum: number;
  readonly saturationMin: number;
  readonly luminanceFloor: number;
};

export type ShippedInkStats = {
  readonly inkPixels: number;
  readonly meanAlpha: number;
  readonly solidFraction: number;
  readonly score: number;
};

function linearChannel(byte: number): number {
  const channel = byte / 255;
  if (channel <= 0.04045) return channel / 12.92;
  return ((channel + 0.055) / 1.055) ** 2.4;
}

function luminance(r: number, g: number, b: number): number {
  return 0.2126 * linearChannel(r) + 0.7152 * linearChannel(g) + 0.0722 * linearChannel(b);
}

function hslSaturation(r: number, g: number, b: number): number {
  const high = Math.max(r, g, b) / 255;
  const low = Math.min(r, g, b) / 255;
  const delta = high - low;
  if (delta === 0) return 0;
  const lightness = (high + low) / 2;
  return delta / (1 - Math.abs(2 * lightness - 1));
}

function hexByte(value: number): string {
  return Math.round(value).toString(16).padStart(2, "0");
}

export function pixelStats(data: Buffer, thresholds: MetricThresholds): InkPixelStats {
  let inkPixels = 0;
  let lumSum = 0;
  let maxLum = 0;
  let bright = 0;
  let saturated = 0;
  let vivid = 0;
  let red = 0;
  let green = 0;
  let blue = 0;
  for (let offset = 0; offset < data.length; offset += 4) {
    if (data[offset + 3]! < 128) continue;
    const r = data[offset]!;
    const g = data[offset + 1]!;
    const b = data[offset + 2]!;
    const lum = luminance(r, g, b);
    const saturation = hslSaturation(r, g, b);
    const isBright = lum >= thresholds.brightLum;
    const isSaturated = saturation >= thresholds.saturationMin;
    const isVivid = isBright || (isSaturated && lum >= thresholds.luminanceFloor);
    inkPixels += 1;
    lumSum += lum;
    maxLum = Math.max(maxLum, lum);
    red += r;
    green += g;
    blue += b;
    if (isBright) bright += 1;
    if (isSaturated) saturated += 1;
    if (isVivid) vivid += 1;
  }
  const divisor = Math.max(inkPixels, 1);
  const r = red / divisor;
  const g = green / divisor;
  const b = blue / divisor;
  const hex = `#${hexByte(r)}${hexByte(g)}${hexByte(b)}`;
  return {
    inkPixels,
    meanLum: lumSum / divisor,
    maxLum,
    brightFraction: bright / divisor,
    saturatedFraction: saturated / divisor,
    vividFraction: vivid / divisor,
    dominant: { r, g, b, hex },
  };
}

export function shippedPixelStats(
  pixels: Uint8Array,
  thresholds: MetricThresholds,
): ShippedInkStats {
  let inkPixels = 0;
  let alphaSum = 0;
  let solid = 0;
  let vividAlpha = 0;
  for (let offset = 0; offset < pixels.length; offset += 4) {
    const alpha = pixels[offset + 3]!;
    if (alpha === 0) continue;
    const lum = luminance(pixels[offset]!, pixels[offset + 1]!, pixels[offset + 2]!);
    const saturation = hslSaturation(pixels[offset]!, pixels[offset + 1]!, pixels[offset + 2]!);
    const vivid = lum >= thresholds.brightLum
      || (saturation >= thresholds.saturationMin && lum >= thresholds.luminanceFloor);
    inkPixels += 1;
    alphaSum += alpha / 255;
    if (alpha >= 0.9 * 255) solid += 1;
    if (vivid) vividAlpha += alpha / 255;
  }
  const divisor = Math.max(inkPixels, 1);
  return {
    inkPixels,
    meanAlpha: alphaSum / divisor,
    solidFraction: solid / divisor,
    score: vividAlpha / divisor,
  };
}
