#!/usr/bin/env tsx
/**
 * Lighthouse harness: build → start → score → stop.
 *
 * Usage:
 *   pnpm lh              # both presets
 *   pnpm lh:desktop      # desktop only
 *   pnpm lh:mobile       # mobile only
 *
 * Chrome required. Resolved from the Playwright installation at runtime.
 */

import { execSync, spawn, type ChildProcess } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import { createServer } from "node:net";
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

async function findFreePort(start: number): Promise<number> {
  return new Promise((resolve, reject) => {
    const srv = createServer();
    srv.listen(start, "127.0.0.1", () => {
      const port = (srv.address() as any).port;
      srv.close(() => resolve(port));
    });
    srv.on("error", () => findFreePort(start + 1).then(resolve).catch(reject));
  });
}

function run(cmd: string, cwd = root, env?: NodeJS.ProcessEnv): void {
  execSync(cmd, { stdio: "inherit", cwd, env: env ?? process.env });
}

function lhci(configFile: string): void {
  const cfg = resolve(__dirname, configFile);
  run(`pnpm exec lhci autorun --config="${cfg}"`, root);
}

async function waitForServer(url: string, timeoutMs = 60_000): Promise<void> {
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
  // Resolve Chromium path from Playwright installation
  let chromePath = "";
  try {
    chromePath = execSync(
      `node -e "const {chromium} = require('/workspace/node_modules/.pnpm/playwright@1.62.1/node_modules/playwright'); console.log(chromium.executablePath())"`,
      { encoding: "utf8" }
    ).trim();
  } catch {
    // fallback: scan /ms-playwright for chromium-* dirs
  }
  if (!chromePath || !existsSync(chromePath)) {
    const msDir = "/ms-playwright";
    const dirs = readdirSync(msDir).filter((d) => d.startsWith("chromium-"));
    for (const d of dirs) {
      const p = `${msDir}/${d}/chrome-linux/chrome`;
      if (existsSync(p)) {
        chromePath = p;
        break;
      }
    }
  }
  if (!chromePath || !existsSync(chromePath)) {
    console.error("Chrome not found. Set CHROME_PATH manually.");
    process.exit(1);
  }
  process.env.CHROME_PATH = chromePath;
  console.log(`Chrome: ${chromePath}`);
  execSync(`"${chromePath}" --version`, { stdio: "inherit" });

  const PORT = await findFreePort(3010);
  const BASE_URL = `http://127.0.0.1:${PORT}`;
  process.env.LHCI_PORT = String(PORT);
  console.log(`Using port: ${PORT}`);

  // Remove any stale distDir so a prior build (potentially run as root or a different uid)
  // cannot leave files that the current user cannot overwrite, then recreate with open
  // permissions so Next.js worker processes can write to it.
  const distDir = resolve(webDir, ".next-prod");
  rmSync(distDir, { recursive: true, force: true });
  mkdirSync(distDir, { recursive: true, mode: 0o777 });

  console.log("\n=== Step 1: build ===");
  run("pnpm -C apps/web build", root, { ...process.env, NEXT_DIST_DIR: ".next-prod" });

  console.log("\n=== Step 2: start production server ===");
  const server: ChildProcess = spawn(
    "node_modules/.bin/next",
    ["start", "-p", String(PORT), "--hostname", "127.0.0.1"],
    { cwd: webDir, shell: true, stdio: "inherit", detached: false, env: { ...process.env, NODE_ENV: "production", NEXT_DIST_DIR: ".next-prod" } },
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
      lhci("lhci-desktop.cjs");
    }
    if (preset === "mobile" || preset === "both") {
      console.log("\n--- mobile ---");
      lhci("lhci-mobile.cjs");
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
