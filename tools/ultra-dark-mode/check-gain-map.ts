#!/usr/bin/env npx tsx
// Ultra mode by Kirk Strobeck – https://UltraDarkMode.com

/**
 * Prove the hero photo actually carries a gain map.
 *
 * A gain map JPEG is a normal JPEG with a second image appended, so the only
 * honest check is a byte check. File size alone proves nothing.
 *
 * The markers below are the Adobe/Google "Ultra HDR" flavour that
 * apps/web/lib/gain-map-encode.ts writes: the hdr-gain-map XMP namespace, the
 * GainMap item semantic in the container directory, and the MPF
 * (Multi-Picture Format) marker that points at the second image. This encoder
 * does not emit the ISO 21496-1 URN, so looking for that would fail on a file
 * that is in fact a correct gain map.
 */
import { readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "../..");
const publicDir = join(repo, "apps/ultra-dark-mode/public");

const sdr = join(publicDir, "peaks.jpg");
const ultra = join(publicDir, "peaks-ultra.jpg");

const sdrBytes = statSync(sdr).size;
const ultraBytes = statSync(ultra).size;
const text = readFileSync(ultra).toString("latin1");

const checks = [
  ["peaks-ultra.jpg larger than peaks.jpg", ultraBytes > sdrBytes],
  [
    "hdr-gain-map XMP namespace present",
    text.includes("http://ns.adobe.com/hdr-gain-map"),
  ],
  ["GainMap item semantic present", text.includes("GainMap")],
  ["MPF multi-picture marker present", text.includes("MPF")],
] as const;

process.stdout.write(`peaks.jpg       ${sdrBytes} bytes\n`);
process.stdout.write(`peaks-ultra.jpg ${ultraBytes} bytes\n`);
for (const [label, ok] of checks) {
  process.stdout.write(`${ok ? "PASS" : "FAIL"}  ${label}\n`);
}

const failed = checks.some(([, ok]) => !ok);
if (failed) process.exit(1);
