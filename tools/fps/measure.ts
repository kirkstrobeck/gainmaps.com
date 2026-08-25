#!/usr/bin/env tsx
/**
 * FPS baseline measurement. Runs 5 interaction scenarios 3 times each via Playwright.
 * Outputs raw frame-timing metrics with no pass/fail thresholds.
 *
 * Usage:
 *   FPS_BASE_URL=http://127.0.0.1:3000 pnpm tsx tools/fps/measure.ts
 */

import { chromium } from "@playwright/test";
import { probeEnv } from "./gpu-probe.js";
import { photosScroll } from "./scenarios/photos-scroll.js";
import { seamDrag } from "./scenarios/seam-drag.js";
import { textIdle } from "./scenarios/text-idle.js";
import { homeIdle } from "./scenarios/home-idle.js";
import { convertDrop } from "./scenarios/convert-drop.js";
import { formatEnv, formatRun } from "./format.js";
import type { ScenarioRun, FrameMetrics } from "./types.js";

type ScenarioFn = (page: import("@playwright/test").Page) => Promise<FrameMetrics | null>;

interface ScenarioDef {
  name: string;
  fn: ScenarioFn;
  skipIfNoWebGpu?: boolean;
}

const SCENARIOS: ScenarioDef[] = [
  { name: "/photos scroll", fn: photosScroll },
  { name: "/ seam drag", fn: seamDrag },
  { name: "/text idle 5s", fn: textIdle, skipIfNoWebGpu: true },
  { name: "/ home idle 5s", fn: homeIdle },
  { name: "/convert drop", fn: convertDrop },
];

const RUNS = 3;

async function runScenario(
  page: import("@playwright/test").Page,
  def: ScenarioDef,
  run: number,
  webGpuAvailable: boolean,
): Promise<ScenarioRun> {
  if (def.skipIfNoWebGpu && !webGpuAvailable) {
    return { scenario: def.name, run, metrics: null, error: "NOT MEASURED: WebGPU unavailable in this environment" };
  }
  try {
    const metrics = await def.fn(page);
    return { scenario: def.name, run, metrics };
  } catch (err) {
    return { scenario: def.name, run, metrics: null, error: String(err) };
  }
}

async function main(): Promise<void> {
  // headless: true is default; no real display in container
  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    executablePath: "/ms-playwright/chromium-1187/chrome-linux/chrome",
  });

  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const probePage = await context.newPage();

  const env = await probeEnv(probePage, true);
  await probePage.close();

  console.log("=== ENV ===");
  console.log(formatEnv(env));
  console.log("");

  const results: ScenarioRun[] = [];

  for (const def of SCENARIOS) {
    for (let run = 1; run <= RUNS; run++) {
      const page = await context.newPage();
      const result = await runScenario(page, def, run, env.webGpuAvailable);
      await page.close();
      results.push(result);
      console.log(formatRun(result));
      console.log("");
    }
  }

  await browser.close();

  // Write JSON for machine consumption
  const jsonOut = JSON.stringify({ env, results }, null, 2);
  const { writeFileSync } = await import("node:fs");
  const { resolve, dirname } = await import("node:path");
  const { fileURLToPath } = await import("node:url");
  const __dirname = dirname(fileURLToPath(import.meta.url));
  writeFileSync(resolve(__dirname, "results.json"), jsonOut, "utf8");
  console.log("Results written to tools/fps/results.json");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
