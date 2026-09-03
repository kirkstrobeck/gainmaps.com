import { chromium } from "/workspace/node_modules/.pnpm/playwright@1.62.1/node_modules/playwright/index.mjs";
import { mkdirSync } from "fs";

const SHOTS_DIR = "/workspace/.sandbox-shots";
mkdirSync(SHOTS_DIR, { recursive: true });

const browser = await chromium.launch({
  executablePath: "/tmp/pw-browsers/chromium-1234/chrome-linux/chrome",
});
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 2,
  reducedMotion: "reduce",
});
const page = await context.newPage();
await page.goto("http://localhost:3000/logos", { waitUntil: "load", timeout: 60000 });

// Scroll to trigger lazy loading
await page.evaluate(async () => {
  await new Promise(r => {
    let y = 0;
    const step = () => { window.scrollBy(0, 400); y += 400; if (y < document.body.scrollHeight) requestAnimationFrame(step); else { window.scrollTo(0,0); r(); } };
    requestAnimationFrame(step);
  });
});
await page.waitForFunction(() => Array.from(document.querySelectorAll("img")).every(i => i.complete), { timeout: 15000 }).catch(() => {});
await page.waitForTimeout(500);

// Find logo pair containers (each .flex with two figures)
const logoPairs = await page.locator(".checkerboard").all();
const logos = ["tesla", "microsoft", "google", "lego", "coca-cola", "nvidia"];

// Take screenshot of each checkerboard tile (both standard and ultra)
for (let i = 0; i < Math.min(logos.length * 2, logoPairs.length); i += 2) {
  const logoName = logos[Math.floor(i / 2)] ?? `logo-${i}`;
  if (i < logoPairs.length) {
    // Screenshot the parent flex container (both tiles)
    const standardTile = logoPairs[i];
    const ultraTile = logoPairs[i + 1];
    if (standardTile && ultraTile) {
      // Get bounding boxes to create a combined screenshot
      const sBox = await standardTile.boundingBox();
      const uBox = ultraTile ? await ultraTile.boundingBox() : null;
      if (sBox) {
        await standardTile.screenshot({ path: `${SHOTS_DIR}/standard-crops-${logoName}-standard.png` });
        console.log(`Saved standard-crops-${logoName}-standard.png`);
      }
      if (uBox && ultraTile) {
        await ultraTile.screenshot({ path: `${SHOTS_DIR}/standard-crops-${logoName}-ultra.png` });
        console.log(`Saved standard-crops-${logoName}-ultra.png`);
      }
    }
  }
}

await page.close();
await context.close();
await browser.close();
console.log("Done.");
