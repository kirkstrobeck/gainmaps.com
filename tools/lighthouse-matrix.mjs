#!/usr/bin/env node
/** Run the required Lighthouse route/form-factor matrix. */
import { existsSync, mkdirSync, renameSync, rmSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";

const phase = process.argv[2] ?? "before";
const run = process.argv[3];
const base = process.env.BASE_URL ?? "http://127.0.0.1:3000";
const chrome = process.env.CHROMIUM_PATH ?? "/ms-playwright/chromium-1187/chrome-linux/chrome";
// Resolve lighthouse CLI from pnpm store or npx cache.
const CLI_CANDIDATES = [
  "node_modules/.pnpm/lighthouse@12.6.1/node_modules/lighthouse/cli/index.js",
  "/home/agent/.npm/_npx/0f94ee7615faf582/node_modules/lighthouse/cli/index.js",
];
const cli = CLI_CANDIDATES.find(existsSync) ?? null;
const outputDir = "sandbox-shots-tmp/lighthouse";
const routes = [
  ["home", "/"],
  ["convert", "/convert"],
  ["logos", "/logos"],
  ["photos", "/photos"],
  ["logos-toyota", "/logos/toyota"],
  ["photos-zebras", "/photos/zebras-in-a-golden-sunlit-grassy-field"],
];

mkdirSync(outputDir, { recursive: true });
for (const [name, path] of routes) {
  for (const form of ["desktop", "mobile"]) {
    const suffix = run ? `-${phase}${run}` : `-${phase}`;
    const target = join(outputDir, `${name}-${form}${suffix}`);
    const temporary = `${target}-report`;
    rmSync(`${temporary}.report.json`, { force: true });
    rmSync(`${temporary}.report.html`, { force: true });
    const preset = form === "desktop" ? ["--preset=desktop"] : [];
    console.log(`RUN ${name} ${form} ${phase}${run ?? ""}`);
    const lhArgs = [`${base}${path}`,
      "--chrome-flags=--headless=new --no-sandbox --disable-dev-shm-usage", `--chrome-path=${chrome}`,
      "--output=json", "--output=html", `--output-path=${temporary}`, "--quiet", ...preset];
    const result = cli
      ? spawnSync(process.execPath, [cli, ...lhArgs], {
          encoding: "utf8", env: { ...process.env, CHROME_PATH: chrome }, maxBuffer: 20 * 1024 * 1024,
        })
      : spawnSync("npx", ["--yes", "lighthouse", ...lhArgs], {
          encoding: "utf8", env: { ...process.env, CHROME_PATH: chrome }, maxBuffer: 20 * 1024 * 1024, shell: true,
        });
    process.stdout.write(result.stdout);
    process.stderr.write(result.stderr);
    if (result.status !== 0) process.exit(result.status ?? 1);
    renameSync(`${temporary}.report.json`, `${target}.json`);
    renameSync(`${temporary}.report.html`, `${target}.html`);
  }
}
