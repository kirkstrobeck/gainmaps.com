#!/usr/bin/env tsx
/**
 * Lighthouse harness: build → start → score → stop.
 *
 * Usage:
 *   pnpm lh              # both presets
 *   pnpm lh:desktop      # desktop only
 *   pnpm lh:mobile       # mobile only
 *
 * Chrome required. In CI, ubuntu-latest provides it via actions/setup-chrome
 * or the google-chrome package. Locally, ensure `google-chrome` or
 * `chromium-browser` is on PATH.
 */

import { execSync, spawn, type ChildProcess } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "../..");
const webDir = resolve(root, "apps/web");

const preset = process.argv[2] ?? "both";
if (preset !== "desktop" && preset !== "mobile" && preset !== "both") {
  console.error("Usage: run.ts [desktop|mobile|both]");
  process.exit(1);
}

const PORT = 3000;
const BASE_URL = `http://localhost:${PORT}`;

function run(cmd: string, cwd = root): void {
  execSync(cmd, { stdio: "inherit", cwd });
}

function lhci(configFile: string): void {
  const cfg = resolve(__dirname, configFile);
  run(`pnpm exec lhci autorun --config="${cfg}"`, root);
}

async function waitForServer(url: string, timeoutMs = 30_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      // not ready yet
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`Server at ${url} did not become ready within ${timeoutMs}ms`);
}

async function main(): Promise<void> {
  console.log("\n=== Step 1: build ===");
  run("pnpm -C apps/web build", root);

  console.log("\n=== Step 2: start production server ===");
  const server: ChildProcess = spawn(
    "pnpm",
    ["-C", "apps/web", "start"],
    { cwd: root, stdio: "pipe", detached: false },
  );

  const cleanup = () => {
    server.kill("SIGTERM");
  };
  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);
  process.on("exit", cleanup);

  try {
    await waitForServer(BASE_URL);
    console.log(`Server ready at ${BASE_URL}`);

    console.log("\n=== Step 3: Lighthouse ===");
    if (preset === "desktop" || preset === "both") {
      console.log("\n--- desktop ---");
      lhci("lhci-desktop.js");
    }
    if (preset === "mobile" || preset === "both") {
      console.log("\n--- mobile ---");
      lhci("lhci-mobile.js");
    }
  } finally {
    cleanup();
  }

  console.log("\n=== Done ===");
  console.log("HTML reports in .lhci-reports/");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
