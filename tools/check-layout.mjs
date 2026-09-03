/**
 * Layout check and screenshot script using Playwright API directly.
 * Run with: node tools/check-layout.mjs
 */
import { chromium } from "/workspace/node_modules/.pnpm/playwright@1.62.1/node_modules/playwright/index.mjs";
import { mkdirSync } from "fs";

const BASE = "http://localhost:3000";
const SHOTS_DIR = "/workspace/.sandbox-shots";
const RATIO_16_9 = 16 / 9;
const RATIO_1_1 = 1;

const PAGES = [
  { name: "home", url: "/" },
  { name: "logos", url: "/logos" },
  { name: "logos-tesla", url: "/logos/tesla" },
  { name: "logos-lego", url: "/logos/lego" },
  { name: "photos", url: "/photos" },
];

mkdirSync(SHOTS_DIR, { recursive: true });

const browser = await chromium.launch({
  executablePath: "/tmp/pw-browsers/chromium-1234/chrome-linux/chrome",
});

let totalPassed = 0;
let totalFailed = 0;
const results = [];

// reducedMotion: 'reduce' disables the @media(prefers-reduced-motion:no-preference) block,
// which contains animation-timeline:view() scroll-driven animations. Without this,
// fullPage screenshots capture below-fold sections at opacity:0 (their initial scroll-
// animated state), producing hundreds of pixels of apparent black space.
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  reducedMotion: "reduce",
});

for (const { name, url } of PAGES) {
  const page = await context.newPage();
  console.log(`\nChecking ${name} (${BASE}${url})...`);
  await page.goto(`${BASE}${url}`, { waitUntil: "load", timeout: 60000 });

  // Scroll the page from top to bottom so lazy-loaded images enter the viewport
  // and the browser starts decoding them.
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let y = 0;
      const step = () => {
        window.scrollBy(0, 400);
        y += 400;
        if (y < document.body.scrollHeight) {
          requestAnimationFrame(step);
        } else {
          window.scrollTo(0, 0);
          resolve(undefined);
        }
      };
      requestAnimationFrame(step);
    });
  });

  // Wait for every img to finish decoding (naturalWidth > 0 means not broken).
  await page.waitForFunction(() => {
    const imgs = Array.from(document.querySelectorAll("img"));
    return imgs.every((img) => img.complete && img.naturalWidth > 0);
  }, { timeout: 30000 }).catch(() => {
    // If some images never load, continue anyway and let the layout checks surface it.
  });

  await page.waitForTimeout(500);

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

  // Find all aspect-square containers (logo tiles)
  const squareTiles = await page.locator("[class*='aspect-square']").all();
  console.log(`  Found ${squareTiles.length} aspect-square tiles`);

  for (const tile of squareTiles) {
    const box = await tile.boundingBox();
    if (!box || box.width < 10) continue;

    const ratio = box.width / box.height;
    const tolerance = 0.01; // 1%

    if (Math.abs(ratio - RATIO_1_1) > tolerance) {
      console.log(`  FAIL square tile ratio=${ratio.toFixed(4)} expected≈1.0000 w=${box.width.toFixed(0)} h=${box.height.toFixed(0)}`);
      failed++;
    } else {
      passed++;
    }
  }

  // Clearance check: each img in a .checkerboard tile must have >= 4px margin on all sides
  const checkerTiles = await page.locator(".checkerboard").all();
  for (const tile of checkerTiles) {
    const tileBox = await tile.boundingBox();
    if (!tileBox || tileBox.width < 10) continue;
    const imgs = await tile.locator("img").all();
    for (const img of imgs) {
      const imgBox = await img.boundingBox();
      if (!imgBox) continue;
      const src = await img.getAttribute("src") ?? "";
      const clearL = imgBox.x - tileBox.x;
      const clearR = (tileBox.x + tileBox.width) - (imgBox.x + imgBox.width);
      const clearT = imgBox.y - tileBox.y;
      const clearB = (tileBox.y + tileBox.height) - (imgBox.y + imgBox.height);
      // Assert img element fits within tile (tile has 4px padding)
      if (clearL >= 3.5 && clearR >= 3.5 && clearT >= 3.5 && clearB >= 3.5) {
        passed++;
      } else {
        console.log(`  FAIL clearance L=${clearL.toFixed(1)} R=${clearR.toFixed(1)} T=${clearT.toFixed(1)} B=${clearB.toFixed(1)} src=...${src.slice(-40)}`);
        failed++;
      }
      // Assert img rendered size fits within tile content area (tile - 8px padding)
      const maxW = tileBox.width - 8;
      const maxH = tileBox.height - 8;
      if (imgBox.width <= maxW + 0.5 && imgBox.height <= maxH + 0.5) {
        passed++;
      } else {
        console.log(`  FAIL img size ${imgBox.width.toFixed(1)}x${imgBox.height.toFixed(1)} exceeds tile content ${maxW.toFixed(1)}x${maxH.toFixed(1)} src=...${src.slice(-40)}`);
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
