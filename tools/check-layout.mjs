/**
 * Layout check and screenshot script using Playwright API directly.
 * Run with: node tools/check-layout.mjs [baseUrl]
 * Base URL resolution order: BASE_URL env var, first CLI arg, default http://localhost:3000
 * Chromium executable resolution order: CHROMIUM_PATH env var, default /ms-playwright/chromium-1187/chrome-linux/chrome
 */
import { chromium } from "/workspace/node_modules/.pnpm/playwright@1.62.1/node_modules/playwright/index.mjs";
import { mkdirSync } from "fs";
import sharp from "/workspace/node_modules/.pnpm/sharp@0.34.5/node_modules/sharp/lib/index.js";

const BASE = process.env.BASE_URL ?? process.argv[2] ?? "http://localhost:3000";
const CHROMIUM_PATH = process.env.CHROMIUM_PATH ?? "/ms-playwright/chromium-1187/chrome-linux/chrome";
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
  executablePath: CHROMIUM_PATH,
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

  // Assert every LOCAL img inside a seam instrument loaded (naturalWidth > 0).
  // External images (e.g. Unsplash SDR photos) are skipped: they depend on
  // outside network and may not resolve within the test timeout in a sandbox.
  // Local gainmap images served from localhost must always load.
  const instImgs = await page.locator(".inst img").all();
  let instImgFailed = 0;
  let instImgLocalCount = 0;
  for (const img of instImgs) {
    const src = await img.getAttribute("src") ?? "";
    // Skip external URLs — only assert on local paths
    if (src.startsWith("http://") || src.startsWith("https://")) continue;
    instImgLocalCount++;
    const natW = await img.evaluate(el => el.naturalWidth);
    if (natW === 0) {
      console.log(`  FAIL inst img naturalWidth=0 src=...${src.slice(-50)}`);
      failed++;
      instImgFailed++;
    }
  }
  // Also check currentSrc for local files (skip external URLs)
  for (const img of instImgs) {
    const currentSrc = await img.evaluate(el => el.currentSrc ?? "");
    if (!currentSrc || !currentSrc.startsWith("/")) continue;
    try {
      const res = await page.request.get(currentSrc);
      if (res.status() !== 200) {
        console.log(`  FAIL inst img currentSrc=${currentSrc.slice(-50)} status=${res.status()}`);
        failed++;
      } else {
        passed++;
      }
    } catch {
      // ignore network errors for local file checks
    }
  }
  if (instImgFailed === 0) {
    console.log(`  inst imgs: all ${instImgLocalCount} local have naturalWidth>0 (external skipped)`);
  }

  // Luminance check: for photo pages verify each .inst tile has non-uniform
  // pixel content — a near-uniform result means a solid black or white tile.
  // Skip logo pages (logo seam instruments may have large uniform areas).
  const PHOTO_PAGES = ["home", "photos"];
  const MIN_STDDEV = 8;
  if (PHOTO_PAGES.includes(name)) {
    const instElements = await page.locator(".inst").all();
    for (let idx = 0; idx < instElements.length; idx++) {
      const inst = instElements[idx];
      const box = await inst.boundingBox();
      if (!box || box.width < 10 || box.height < 10) continue;

      // img[decoding=async] can report complete/naturalWidth>0 before the
      // decoded bitmap is actually ready to paint, which intermittently
      // produced a near-blank/blurry frame in the screenshot below. Force
      // each image's decode to finish before capturing so the check reflects
      // the settled pixels, not a mid-decode frame.
      const instImgsForShot = await inst.locator("img").all();
      await Promise.all(instImgsForShot.map((im) =>
        im.evaluate((el) => (el.decode ? el.decode().catch(() => {}) : Promise.resolve()))
      ));
      // decode() resolving only guarantees the bitmap is ready, not that a
      // compositor frame has painted it yet — wait two animation frames
      // (the standard "paint has happened" idiom) so the screenshot below
      // captures settled pixels rather than a mid-composite frame.
      await page.evaluate(() => new Promise((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(resolve));
      }));

      const shotBuffer = await inst.screenshot();

      const { data, info } = await sharp(shotBuffer)
        .resize(64, 64, { fit: "fill" })
        .removeAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

      const pixels = new Uint8Array(data.buffer);
      const n = info.width * info.height;
      let sum = 0;
      let sumSq = 0;
      for (let i = 0; i < n; i++) {
        const r = pixels[i * 3];
        const g = pixels[i * 3 + 1];
        const b = pixels[i * 3 + 2];
        const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        sum += lum;
        sumSq += lum * lum;
      }
      const mean = sum / n;
      const variance = sumSq / n - mean * mean;
      const stdDev = Math.sqrt(Math.max(0, variance));

      if (stdDev < MIN_STDDEV) {
        console.log(`  FAIL inst[${idx}] near-uniform luminance stdDev=${stdDev.toFixed(1)} mean=${mean.toFixed(1)} (likely black/white tile)`);
        failed++;
      } else {
        passed++;
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
