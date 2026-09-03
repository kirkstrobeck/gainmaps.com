/**
 * Playwright layout assertions for 16:9 tiles.
 * Run with: PLAYWRIGHT_BROWSERS_PATH=/tmp/pw-browsers playwright test tools/check-layout.spec.ts --browser chromium
 */
import { test, expect, type Page } from "@playwright/test/index.js";
import { writeFileSync, mkdirSync } from "fs";

const BASE = "http://localhost:3000";
const SHOTS_DIR = "/workspace/.sandbox-shots";

const PAGES: Array<{ name: string; url: string }> = [
  { name: "home", url: "/" },
  { name: "logos", url: "/logos" },
  { name: "photos", url: "/photos" },
];

const RATIO_16_9 = 16 / 9;
const TOLERANCE_PX = 2;

async function assertTiles(page: Page, pageLabel: string) {
  let passed = 0;
  let failed = 0;

  // Find all tile containers (aspect-video class elements)
  const tiles = await page.locator("[class*='aspect-video']").all();

  for (const tile of tiles) {
    const box = await tile.boundingBox();
    if (!box || box.width < 10) continue;

    const actualRatio = box.width / box.height;
    const ratioDiff = Math.abs(actualRatio - RATIO_16_9);
    // tolerance: at 16/9, 1px height deviation for a 160px wide tile = 160/90 = 1.78 ratio vs 1.777 = diff 0.003
    // Allow tolerance_px / box.height
    const pixelTolerance = TOLERANCE_PX / box.height;

    if (ratioDiff > pixelTolerance) {
      console.log(`  FAIL [${pageLabel}] tile ratio=${actualRatio.toFixed(4)} expected=${RATIO_16_9.toFixed(4)} box=${JSON.stringify(box)}`);
      failed++;
      continue;
    }

    // Check imgs inside the tile
    const imgs = await tile.locator("img").all();
    for (const img of imgs) {
      const src = await img.getAttribute("src") ?? "";
      const isGainmapJpg = src.includes("logo-gainmap") || src.includes("photo");
      const isSvgLogo = src.endsWith(".svg");
      const isPhoto = src.includes("images.unsplash") || src.includes("/photos/") || (!isSvgLogo && !src.includes("/logos/"));

      const objectFit = await img.evaluate((el) => getComputedStyle(el).objectFit);
      const padding = await img.evaluate((el) => getComputedStyle(el).padding);

      if (isPhoto && !src.includes("logo")) {
        // Photos should be cover
        if (objectFit !== "cover") {
          console.log(`  FAIL [${pageLabel}] photo img object-fit=${objectFit} src=${src.slice(-50)}`);
          failed++;
          continue;
        }
      } else {
        // Logos should be contain with 4px padding
        if (objectFit !== "contain") {
          console.log(`  FAIL [${pageLabel}] logo img object-fit=${objectFit} src=${src.slice(-50)}`);
          failed++;
          continue;
        }
        if (padding !== "4px") {
          // Check if all sides are 4px
          const padTop = await img.evaluate((el) => getComputedStyle(el).paddingTop);
          if (padTop !== "4px") {
            console.log(`  FAIL [${pageLabel}] logo img padding=${padding} src=${src.slice(-50)}`);
            failed++;
            continue;
          }
        }
      }
      passed++;
    }

    // If no imgs, count the tile itself as passed
    if (imgs.length === 0) passed++;
  }

  console.log(`  [${pageLabel}] tiles=${tiles.length} passed=${passed} failed=${failed}`);
  return { passed, failed };
}

test.describe("16:9 tile layout", () => {
  for (const { name, url } of PAGES) {
    test(`${name} page tiles are 16:9`, async ({ page }) => {
      await page.goto(`${BASE}${url}`, { waitUntil: "networkidle", timeout: 30000 });
      await page.waitForTimeout(1000);

      const { passed, failed } = await assertTiles(page, name);

      // Save screenshot
      mkdirSync(SHOTS_DIR, { recursive: true });
      await page.screenshot({ path: `${SHOTS_DIR}/${name}.png`, fullPage: true });
      console.log(`  Screenshot saved: ${SHOTS_DIR}/${name}.png`);

      expect(failed, `${failed} tile assertions failed on ${name}`).toBe(0);
      expect(passed, "at least 1 passing assertion").toBeGreaterThan(0);
    });
  }
});
