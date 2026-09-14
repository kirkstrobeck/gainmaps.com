// Gainmaps by Kirk Strobeck – https://gainmaps.com

/** Validation and raster preparation for untouched downloaded SVG sources. */
const DRAWABLE = /<(?:path|rect|circle|ellipse|polygon|polyline|line|text|image|use)\b/i;

export function svgSourceProblem(bytes: Buffer): string | null {
  const text = bytes.toString("utf8");
  if (!/<(?:[\w-]+:)?svg[\s>]/i.test(text.slice(0, 4096))) return "response is not an SVG";
  if (/<(?:html|!doctype\s+html)\b/i.test(text.slice(0, 4096))) return "response is HTML";
  if (!DRAWABLE.test(text)) return "SVG has no drawable children";
  return null;
}

function rootWithDimensions(root: string): string {
  const hasWidth = /\bwidth\s*=/.test(root);
  const hasHeight = /\bheight\s*=/.test(root);
  if (hasWidth && hasHeight) return root;
  const viewBox = root.match(/\bviewBox\s*=\s*["']([^"']+)["']/i)?.[1];
  if (!viewBox) return root;
  const values = viewBox.trim().split(/[\s,]+/).map(Number);
  if (values.length < 4 || !(values[2]! > 0) || !(values[3]! > 0)) return root;
  const width = hasWidth ? "" : ` width="${values[2]}"`;
  const height = hasHeight ? "" : ` height="${values[3]}"`;
  return root.replace(/>$/, `${width}${height}>`);
}

/** Supply intrinsic dimensions from viewBox for librsvg without changing ink. */
export function prepareSvgForRaster(bytes: Buffer): Buffer {
  const text = bytes.toString("utf8");
  const prepared = text.replace(/<(?:[\w-]+:)?svg\b[^>]*>/i, rootWithDimensions);
  return Buffer.from(prepared, "utf8");
}
