// Gainmaps by Kirk Strobeck – https://gainmaps.com

/** Post-download SVG fixups shared by build-logos.ts and backfill-logo-assets.ts. */
import type { LogoSeed } from "./sources.ts";

const DARK_LUMINANCE_THRESHOLD = 0.36; // mirrors apps/web/test/lib/logo-file-parity.test.ts

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

export function normalizeLogoSvg(seed: LogoSeed, svg: Buffer): Buffer {
  const reversed = reverseDarkInkToWhite(svg);
  if (seed.slug !== "instagram") return reversed;
  const text = reversed
    .toString("utf8")
    .replace('viewBox="0 0 148.35786 32.804337"', 'viewBox="-6 -2 160.35786 36.804337"')
    .replace('width="148.35786mm"', 'width="160.35786mm"')
    .replace('height="32.804337mm"', 'height="36.804337mm"');
  return Buffer.from(text);
}
