/**
 * Convert-page gain default check using Playwright API directly.
 * Verifies the Gain slider (#boost) defaults to max headroom (boost=1,
 * readout "6.00×") instead of the old 50% default.
 *
 * Run with: node tools/merge/check-convert-gain.mjs [baseUrl]
 * Base URL resolution order: BASE_URL env var, first CLI arg, default http://localhost:3999/convert
 * Chromium executable resolution order: CHROMIUM_PATH env var, default /ms-playwright/chromium-1187/chrome-linux/chrome
 */
import { chromium } from "/workspace/apps/web/node_modules/@playwright/test/index.mjs";

const BASE = process.env.BASE_URL ?? process.argv[2] ?? "http://localhost:3999/convert";
const CHROMIUM_PATH = process.env.CHROMIUM_PATH ?? "/ms-playwright/chromium-1187/chrome-linux/chrome";
const EXPECTED_BOOST = "1";
const EXPECTED_GAIN_TEXT = "6.00×"; // U+00D7 MULTIPLICATION SIGN

// A minimal valid 1x1 transparent PNG, base64-encoded.
const ONE_BY_ONE_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";

const browser = await chromium.launch({
  executablePath: CHROMIUM_PATH,
  args: ["--no-sandbox"],
});

let exitCode = 0;

try {
  const page = await browser.newPage();
  await page.goto(BASE, { waitUntil: "load", timeout: 60000 });

  await page.setInputFiles("input[type=file]", {
    name: "pixel.png",
    mimeType: "image/png",
    buffer: Buffer.from(ONE_BY_ONE_PNG_BASE64, "base64"),
  });

  const boostInput = page.locator("#boost");
  await boostInput.waitFor({ state: "attached", timeout: 15000 });
  const actualBoost = await boostInput.inputValue();
  if (actualBoost !== EXPECTED_BOOST) {
    console.error(`FAIL #boost value="${actualBoost}" expected="${EXPECTED_BOOST}"`);
    exitCode = 1;
  } else {
    console.log(`PASS #boost value="${actualBoost}"`);
  }

  const gainReadout = page.locator("span.font-mono.tabular-nums").first();
  const actualGainText = await gainReadout.textContent();
  if (actualGainText !== EXPECTED_GAIN_TEXT) {
    console.error(`FAIL gain readout text="${actualGainText}" expected="${EXPECTED_GAIN_TEXT}"`);
    exitCode = 1;
  } else {
    console.log(`PASS gain readout text="${actualGainText}"`);
  }

  console.log(exitCode === 0 ? "SUCCESS: convert page defaults to max headroom (6.00×)" : "FAILURE: convert page gain default check failed");
} catch (err) {
  console.error(`FAIL script error: ${err?.stack ?? err}`);
  exitCode = 1;
} finally {
  await browser.close();
}

process.exit(exitCode);
