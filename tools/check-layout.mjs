/**
 * Layout check and screenshot script using Playwright API directly.
 * Run with: node tools/check-layout.mjs
 */
import { chromium } from "/workspace/node_modules/.pnpm/playwright@1.62.1/node_modules/playwright/index.mjs";
import { mkdirSync } from "fs";

const BASE = "http://localhost:3000";
const SHOTS_DIR = "/workspace/.sandbox-shots";
const RATIO_16_9 = 16 / 9;

const PAGES = [
  { name: "home", url: "/" },
  { name: "logos", url: "/logos" },
  { name: "photos", url: "/photos" },
];

mkdirSync(SHOTS_DIR, { recursive: true });

const browser = await chromium.launch({
  executablePath: "/tmp/pw-browsers/chromium-1234/chrome-linux/chrome",
});

let totalPassed = 0;
let totalFailed = 0;
const results = [];

const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });

for (const { name, url } of PAGES) {
  const page = await context.newPage();
  console.log(`\nChecking ${name} (${BASE}${url})...`);
  await page.goto(`${BASE}${url}`, { waitUntil: "load", timeout: 60000 });
  await page.waitForTimeout(2000);

  let passed = 0;
  let failed = 0;

  // Find all aspect-video containers
  const tiles = await page.locator("[class*='aspect-video']").all();
  console.log(`  Found ${tiles.length} aspect-video tiles`);

  for (const tile of tiles) {
    const box = await tile.boundingBox();
    if (!box || box.width < 10) continue;

    const ratio = box.width / box.height;
    const ratioDiff = Math.abs(ratio - RATIO_16_9);
    const pixelTol = 2 / box.height;

    if (ratioDiff > pixelTol) {
      console.log(`  FAIL tile ratio=${ratio.toFixed(4)} expected≈1.7778 w=${box.width.toFixed(0)} h=${box.height.toFixed(0)}`);
      failed++;
    } else {
      passed++;
    }

    // Check img object-fit
    // Note: padding is on the tile container, not the img itself
    const imgs = await tile.locator("img").all();
    for (const img of imgs) {
      const src = await img.getAttribute("src") ?? "";
      const isLogo = src.includes("/logos/") || src.endsWith(".svg");
      const objectFit = await img.evaluate((el) => getComputedStyle(el).objectFit);

      if (isLogo) {
        if (objectFit === "contain") {
          passed++;
        } else {
          console.log(`  FAIL logo img object-fit=${objectFit} (expected contain) src=...${src.slice(-40)}`);
          failed++;
        }
      } else {
        if (objectFit === "cover") {
          passed++;
        } else {
          console.log(`  FAIL photo img object-fit=${objectFit} (expected cover) src=...${src.slice(-40)}`);
          failed++;
        }
      }
    }

    // Check tile container padding for logo tiles (contain means logo)
    const tileClass = await tile.getAttribute("class") ?? "";
    if (tileClass.includes("checkerboard")) {
      const tilePad = await tile.evaluate((el) => getComputedStyle(el).paddingTop);
      if (tilePad === "4px") {
        passed++;
      } else {
        console.log(`  FAIL logo tile padding-top=${tilePad} (expected 4px) class="${tileClass.slice(0, 60)}"`);
        failed++;
      }
    }
  }

  console.log(`  [${name}] tiles=${tiles.length} passed=${passed} failed=${failed}`);
  totalPassed += passed;
  totalFailed += failed;
  results.push({ name, passed, failed });

  await page.screenshot({ path: `${SHOTS_DIR}/${name}.png`, fullPage: true });
  console.log(`  Screenshot: ${SHOTS_DIR}/${name}.png`);
  await page.close();
}

await context.close();
await browser.close();

console.log(`\nTotal: passed=${totalPassed} failed=${totalFailed}`);
for (const r of results) {
  console.log(`  ${r.name}: ${r.passed}p/${r.failed}f`);
}
process.exit(totalFailed > 0 ? 1 : 0);
