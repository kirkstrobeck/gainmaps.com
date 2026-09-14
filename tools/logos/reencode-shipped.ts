#!/usr/bin/env npx tsx
/** Re-encode every published logo from its checked-in normalized SVG. */
import { copyFile, readFile } from "node:fs/promises";
import { join } from "node:path";

import sharp from "sharp";

import { COMPANIES } from "../../apps/web/lib/logos/companies.ts";
import { encodeLogoVariants, LOGO_WIDTHS } from "./encode-logo-variants.ts";
import { BOOST, CANVAS, rasterize } from "./logo-pipeline.ts";

const root = "apps/web/public/logos";

async function writeSdr(directory: string): Promise<void> {
  for (const width of LOGO_WIDTHS) {
    const gainmap = join(directory, `logo-gainmap-${width}.jpg`);
    const sdr = join(directory, `logo-sdr-${width}.jpg`);
    await sharp(gainmap).jpeg({ quality: width < 512 ? 80 : 90 }).toFile(sdr);
    if (width === 1024) await copyFile(sdr, join(directory, "logo-sdr.jpg"));
  }
}

for (const company of COMPANIES) {
  const directory = join(root, company.slug);
  const pixels = await rasterize(await readFile(join(directory, "logo.svg")));
  await encodeLogoVariants(pixels, CANVAS, directory, BOOST);
  await writeSdr(directory);
  console.log(`encoded ${company.slug}`);
}
