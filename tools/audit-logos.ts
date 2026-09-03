/**
 * Logo audit script — rasterizes each logo SVG and culls monochrome/invisible entries.
 * Run with: node /path/to/tsx/dist/cli.mjs tools/audit-logos.ts
 */

import * as fs from "fs";
import * as path from "path";
import { createRequire } from "module";

const SHARP_PATH = "/workspace/node_modules/.pnpm/sharp@0.35.3_@types+node@26.1.2/node_modules/sharp";

const require2 = createRequire(import.meta.url);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sharp = require2(SHARP_PATH) as any;

const PUBLIC_LOGOS = "/workspace/apps/web/public/logos";
const COMPANIES_TS = "/workspace/apps/web/lib/logos/companies.ts";

type AuditResult = {
  slug: string;
  decision: "KEEP" | "DELETE";
  reason: string;
};

async function analyzesvg(svgFilePath: string, slug: string): Promise<AuditResult> {
  const buf = fs.readFileSync(svgFilePath);
  let raw: Buffer;
  let info: { width: number; height: number; channels: number };

  try {
    const result = await sharp(buf)
      .resize(256, 256, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .raw()
      .toBuffer({ resolveWithObject: true });
    raw = result.data;
    info = result.info as { width: number; height: number; channels: number };
  } catch (e) {
    return { slug, decision: "KEEP", reason: `rasterize-error: ${e}` };
  }

  const channels = info.channels;
  const pixelCount = info.width * info.height;
  let opaque = 0;
  let whitePx = 0;
  let darkPx = 0;
  let colorPx = 0;
  let brightColorPx = 0;

  for (let i = 0; i < pixelCount; i++) {
    const base = i * channels;
    const r = raw[base];
    const g = raw[base + 1];
    const b = raw[base + 2];
    const a = channels === 4 ? raw[base + 3] : 255;

    if (a <= 16) continue;
    opaque++;

    const mn = Math.min(r, g, b);
    const mx = Math.max(r, g, b);
    const range = mx - mn;

    if (mn >= 235) whitePx++;
    if (mx <= 80) darkPx++;
    if (range >= 40 && mx >= 120) colorPx++;
    if (range >= 40 && mx >= 180) brightColorPx++;
  }

  if (opaque === 0) {
    return { slug, decision: "DELETE", reason: "fully-transparent" };
  }

  const colorFrac = colorPx / opaque;
  const whiteFrac = whitePx / opaque;
  const brightColorFrac = brightColorPx / opaque;

  if (colorFrac < 0.02) {
    return { slug, decision: "DELETE", reason: `monochrome color_frac=${colorFrac.toFixed(4)}` };
  }

  if ((whiteFrac + brightColorFrac) < 0.02) {
    return { slug, decision: "DELETE", reason: `dark/invisible white_frac=${whiteFrac.toFixed(4)} bright_color_frac=${brightColorFrac.toFixed(4)}` };
  }

  return { slug, decision: "KEEP", reason: `ok color_frac=${colorFrac.toFixed(4)} white_frac=${whiteFrac.toFixed(4)} bright_frac=${brightColorFrac.toFixed(4)}` };
}

function parseSlugsFromCompaniesTs(src: string): string[] {
  const slugs: string[] = [];
  const re = /slug:\s*"([^"]+)"/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src)) !== null) {
    slugs.push(m[1]);
  }
  return slugs;
}

function removeSlugFromCompaniesTs(src: string, slug: string): string {
  // Remove the entire line containing this slug
  const lines = src.split("\n");
  const filtered = lines.filter((line) => !line.includes(`slug: "${slug}"`));
  return filtered.join("\n");
}

async function main() {
  const companiesSrc = fs.readFileSync(COMPANIES_TS, "utf8");
  const slugs = parseSlugsFromCompaniesTs(companiesSrc);

  console.log(`Auditing ${slugs.length} logos...`);

  const results: AuditResult[] = [];
  for (const slug of slugs) {
    const svgPath = path.join(PUBLIC_LOGOS, slug, "logo.svg");
    if (!fs.existsSync(svgPath)) {
      results.push({ slug, decision: "DELETE", reason: "svg-missing" });
      continue;
    }
    const result = await analyzesvg(svgPath, slug);
    results.push(result);
    const icon = result.decision === "DELETE" ? "✗" : "✓";
    console.log(`  ${icon} ${slug}: ${result.reason}`);
  }

  const toDelete = results.filter((r) => r.decision === "DELETE");
  const toKeep = results.filter((r) => r.decision === "KEEP");

  // Apply deletions
  let updatedSrc = companiesSrc;
  for (const { slug } of toDelete) {
    // Remove directory
    const dir = path.join(PUBLIC_LOGOS, slug);
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
      console.log(`  rm -rf ${dir}`);
    }
    // Remove from companies.ts
    updatedSrc = removeSlugFromCompaniesTs(updatedSrc, slug);
  }

  // Write updated companies.ts
  if (toDelete.length > 0) {
    fs.writeFileSync(COMPANIES_TS, updatedSrc);
    console.log(`\nUpdated ${COMPANIES_TS}`);
  }

  console.log(`\ndeleted=${toDelete.length}: ${toDelete.map((r) => r.slug).join(",")}`);
  console.log(`kept=${toKeep.length}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
