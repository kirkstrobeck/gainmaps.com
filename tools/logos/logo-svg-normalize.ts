// Gainmaps by Kirk Strobeck – https://gainmaps.com

/** Post-download SVG fixups shared by build-logos.ts and backfill-logo-assets.ts. */
import type { LogoSeed } from "./sources.ts";
import { detectBackgroundPlate, type Canvas } from "./plate-detect.ts";

const DARK_LUMINANCE_THRESHOLD = 0.36; // mirrors apps/web/test/lib/logo-file-parity.test.ts
/** Plate coverage must reach this fraction in BOTH axes to be stripped. */
const PLATE_COVERAGE = 0.78;

function hexLuminance(hex: string): number {
  const raw = hex.slice(1);
  const expanded =
    raw.length === 3 || raw.length === 4
      ? raw
          .slice(0, 3)
          .split("")
          .map((c) => c + c)
          .join("")
      : raw.slice(0, 6);
  if (expanded.length !== 6) return 1;
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(expanded.slice(i, i + 2), 16) / 255);
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}

// Logos render on a dark surface; ink dark enough to vanish there must become
// white — same rule apps/web/test/lib/logo-file-parity.test.ts enforces.
export function reverseDarkInkToWhite(svg: Buffer): Buffer {
  let text = svg.toString("utf8");
  text = text.replace(/#[0-9a-fA-F]{3,8}\b/g, (token) =>
    hexLuminance(token) < DARK_LUMINANCE_THRESHOLD ? "#ffffff" : token,
  );
  text = text.replace(/((?:fill|stroke)\s*[:=]\s*"?)black\b/gi, "$1#ffffff");
  text = text.replace(/rgb\(\s*0\s*,\s*0\s*,\s*0\s*\)/gi, "#ffffff");
  if (!/<svg\b[^>]*\bfill\s*=/i.test(text)) text = text.replace(/<svg\b/i, '<svg fill="#ffffff"');
  return Buffer.from(text, "utf8");
}

/** Return [vbW, vbH] from viewBox, or fall back to width/height attributes. */
function parseViewBox(svgText: string): Canvas | null {
  const vbm = svgText.match(/viewBox\s*=\s*["']([^"']+)["']/i);
  if (vbm) {
    const parts = vbm[1]!.trim().split(/[\s,]+/).map(Number);
    return parts.length >= 4 ? { x: parts[0]!, y: parts[1]!, width: parts[2]!, height: parts[3]! } : null;
  }
  // Fall back to top-level width / height attributes
  const svgTag = svgText.match(/<svg\b[^>]*>/is)?.[0] ?? "";
  const w = parseFloat(svgTag.match(/\bwidth\s*=\s*["']?([+-]?\d*\.?\d+)/i)?.[1] ?? "0");
  const h = parseFloat(svgTag.match(/\bheight\s*=\s*["']?([+-]?\d*\.?\d+)/i)?.[1] ?? "0");
  return w > 0 && h > 0 ? { x: 0, y: 0, width: w, height: h } : null;
}

/**
 * Strip any <rect> or <path> element whose coordinate bounding box covers
 * >= PLATE_COVERAGE of the viewBox in both axes. Designed to remove opaque
 * background plates (e.g. the McDonald's rounded rect, path18) before
 * reverseDarkInkToWhite runs, so the plate doesn't become a full-canvas
 * white sheet that receives maximum gainmap boost.
 */
export function stripBackgroundPlate(svgText: string): string {
  const vb = parseViewBox(svgText);
  if (!vb) return svgText;
  const plate = detectBackgroundPlate(svgText, vb, PLATE_COVERAGE);
  if (!plate) return svgText;
  return svgText.slice(0, plate.start) + svgText.slice(plate.end);
}

export function normalizeLogoSvg(seed: LogoSeed, svg: Buffer): Buffer {
  const stripped = stripBackgroundPlate(svg.toString("utf8"));
  const reversed = reverseDarkInkToWhite(Buffer.from(stripped, "utf8"));
  if (seed.slug !== "instagram") return reversed;
  const text = reversed
    .toString("utf8")
    .replace('viewBox="0 0 148.35786 32.804337"', 'viewBox="-6 -2 160.35786 36.804337"')
    .replace('width="148.35786mm"', 'width="160.35786mm"')
    .replace('height="32.804337mm"', 'height="36.804337mm"');
  return Buffer.from(text);
}
