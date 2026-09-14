// Gainmaps by Kirk Strobeck – https://gainmaps.com

/** Geometry-only source guard for an already-shipped normalized logo. */
export const MAX_ASPECT_DELTA = 0.02;

export type SvgGeometry = { readonly width: number; readonly height: number; readonly aspect: number };

export function svgGeometry(svg: Buffer | string): SvgGeometry {
  const tag = String(svg).match(/<(?:[A-Za-z_][\w.-]*:)?svg\b[^>]*>/i)?.[0] ?? "";
  const viewBox = tag.match(/\bviewBox\s*=\s*["']([^"']+)["']/i)?.[1];
  const parts = viewBox?.trim().split(/[\s,]+/).map(Number);
  if (parts && parts.length >= 4 && Number.isFinite(parts[2]) && Number.isFinite(parts[3]) && parts[2]! > 0 && parts[3]! > 0) {
    return { width: parts[2]!, height: parts[3]!, aspect: parts[2]! / parts[3]! };
  }
  const width = Number(tag.match(/\bwidth\s*=\s*["']?([+-]?(?:\d+\.?\d*|\.\d+))/i)?.[1]);
  const height = Number(tag.match(/\bheight\s*=\s*["']?([+-]?(?:\d+\.?\d*|\.\d+))/i)?.[1]);
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    throw new Error("SVG has no usable viewBox or width/height");
  }
  return { width, height, aspect: width / height };
}

export function aspectDelta(shipped: SvgGeometry, candidate: SvgGeometry): number {
  return Math.abs(candidate.aspect / shipped.aspect - 1);
}

export function hasAspectParity(shipped: Buffer | string, candidate: Buffer | string): boolean {
  return aspectDelta(svgGeometry(shipped), svgGeometry(candidate)) <= MAX_ASPECT_DELTA;
}
