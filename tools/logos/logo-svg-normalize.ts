// Gainmaps by Kirk Strobeck – https://gainmaps.com

/** Post-download SVG fixups shared by build-logos.ts and backfill-logo-assets.ts. */
import type { LogoSeed } from "./sources.ts";

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
function parseViewBox(svgText: string): [number, number] | null {
  const vbm = svgText.match(/viewBox\s*=\s*["']([^"']+)["']/i);
  if (vbm) {
    const parts = vbm[1]!.trim().split(/[\s,]+/).map(Number);
    return parts.length >= 4 ? [parts[2]!, parts[3]!] : null;
  }
  // Fall back to top-level width / height attributes
  const svgTag = svgText.match(/<svg\b[^>]*>/is)?.[0] ?? "";
  const w = parseFloat(svgTag.match(/\bwidth\s*=\s*["']?([+-]?\d*\.?\d+)/i)?.[1] ?? "0");
  const h = parseFloat(svgTag.match(/\bheight\s*=\s*["']?([+-]?\d*\.?\d+)/i)?.[1] ?? "0");
  return w > 0 && h > 0 ? [w, h] : null;
}

/** Scan a path `d` attribute for all absolute coordinates; return bounding box. */
function pathCoordBounds(d: string): { xMin: number; xMax: number; yMin: number; yMax: number } | null {
  let cx = 0, cy = 0;
  let xMin = Infinity, xMax = -Infinity, yMin = Infinity, yMax = -Infinity;

  function track(x: number, y: number): void {
    if (x < xMin) xMin = x;
    if (x > xMax) xMax = x;
    if (y < yMin) yMin = y;
    if (y > yMax) yMax = y;
  }

  // Tokenise: split on command letters, keeping the letter
  const tokens = d.match(/[MmLlHhVvCcSsQqAaZz][^MmLlHhVvCcSsQqAaZz]*/g);
  if (!tokens) return null;

  for (const token of tokens) {
    const cmd = token[0]!;
    const nums = token.slice(1).trim().split(/[\s,]+/).map(Number).filter((n) => !isNaN(n));
    switch (cmd) {
      case "M": for (let i = 0; i + 1 < nums.length; i += 2) { cx = nums[i]!; cy = nums[i+1]!; track(cx, cy); } break;
      case "m": for (let i = 0; i + 1 < nums.length; i += 2) { cx += nums[i]!; cy += nums[i+1]!; track(cx, cy); } break;
      case "L": for (let i = 0; i + 1 < nums.length; i += 2) { cx = nums[i]!; cy = nums[i+1]!; track(cx, cy); } break;
      case "l": for (let i = 0; i + 1 < nums.length; i += 2) { cx += nums[i]!; cy += nums[i+1]!; track(cx, cy); } break;
      case "H": for (const n of nums) { cx = n; track(cx, cy); } break;
      case "h": for (const n of nums) { cx += n; track(cx, cy); } break;
      case "V": for (const n of nums) { cy = n; track(cx, cy); } break;
      case "v": for (const n of nums) { cy += n; track(cx, cy); } break;
      case "C": for (let i = 0; i + 5 < nums.length; i += 6) { cx = nums[i+4]!; cy = nums[i+5]!; track(cx, cy); } break;
      case "c": for (let i = 0; i + 5 < nums.length; i += 6) { cx += nums[i+4]!; cy += nums[i+5]!; track(cx, cy); } break;
      case "S": for (let i = 0; i + 3 < nums.length; i += 4) { cx = nums[i+2]!; cy = nums[i+3]!; track(cx, cy); } break;
      case "s": for (let i = 0; i + 3 < nums.length; i += 4) { cx += nums[i+2]!; cy += nums[i+3]!; track(cx, cy); } break;
      case "Q": for (let i = 0; i + 3 < nums.length; i += 4) { cx = nums[i+2]!; cy = nums[i+3]!; track(cx, cy); } break;
      case "q": for (let i = 0; i + 3 < nums.length; i += 4) { cx += nums[i+2]!; cy += nums[i+3]!; track(cx, cy); } break;
      case "A": for (let i = 0; i + 6 < nums.length; i += 7) { cx = nums[i+5]!; cy = nums[i+6]!; track(cx, cy); } break;
      case "a": for (let i = 0; i + 6 < nums.length; i += 7) { cx += nums[i+5]!; cy += nums[i+6]!; track(cx, cy); } break;
    }
  }
  return xMin <= xMax && yMin <= yMax ? { xMin, xMax, yMin, yMax } : null;
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
  const [vbW, vbH] = vb;

  // Match <rect ...> or <path ...> tags (single-line or multiline, self-closing or open)
  return svgText.replace(/<(rect|path)\b([^>]*?)\/?>/gis, (full, tagName: string, attrs: string) => {
    const tag = tagName.toLowerCase();
    if (tag === "rect") {
      const x = parseFloat(attrs.match(/\bx\s*=\s*["']?([+-]?\d*\.?\d+)/i)?.[1] ?? "0");
      const y = parseFloat(attrs.match(/\by\s*=\s*["']?([+-]?\d*\.?\d+)/i)?.[1] ?? "0");
      const w = parseFloat(attrs.match(/\bwidth\s*=\s*["']?([+-]?\d*\.?\d+)/i)?.[1] ?? "0");
      const h = parseFloat(attrs.match(/\bheight\s*=\s*["']?([+-]?\d*\.?\d+)/i)?.[1] ?? "0");
      // Coverage check: bounding box vs viewBox
      const covW = (Math.min(x + w, vbW) - Math.max(x, 0)) / vbW;
      const covH = (Math.min(y + h, vbH) - Math.max(y, 0)) / vbH;
      const isPlate = covW >= PLATE_COVERAGE && covH >= PLATE_COVERAGE;
      return isPlate ? "" : full;
    }
    // <path>
    const dMatch = attrs.match(/\bd\s*=\s*["']([^"']*)/i);
    if (!dMatch) return full;
    const bounds = pathCoordBounds(dMatch[1]!);
    if (!bounds) return full;
    const spanW = bounds.xMax - bounds.xMin;
    const spanH = bounds.yMax - bounds.yMin;
    const isPlate = spanW / vbW >= PLATE_COVERAGE && spanH / vbH >= PLATE_COVERAGE;
    return isPlate ? "" : full;
  });
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
