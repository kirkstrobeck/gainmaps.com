/** Browser layout checks for the production site. */
import { chromium } from "/workspace/node_modules/.pnpm/playwright@1.62.1/node_modules/playwright/index.mjs";
import { mkdirSync } from "node:fs";

const base = process.env.BASE_URL ?? process.argv[2] ?? "http://localhost:3000";
const executablePath = process.env.CHROMIUM_PATH ?? "/ms-playwright/chromium-1187/chrome-linux/chrome";
const shots = "/workspace/.sandbox-shots";
const pages = [
  { name: "home", path: "/" },
  { name: "logos", path: "/logos" },
  { name: "logos-toyota", path: "/logos/toyota", detail: true },
  { name: "logos-mcdonalds", path: "/logos/mcdonalds", detail: true },
  { name: "photos", path: "/photos" },
];

function record(condition, message, counts) {
  if (condition) {
    counts.passed += 1;
    return;
  }
  counts.failed += 1;
  console.log(`  FAIL ${message}`);
}

async function settleImages(page) {
  const decline = page.getByRole("button", { name: "No", exact: true });
  if (await decline.count()) await decline.click();
  const done = page.getByRole("button", { name: "Done", exact: true });
  if (await done.count()) await done.click();
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 600) {
      window.scrollTo(0, y);
      await new Promise((resolve) => requestAnimationFrame(resolve));
    }
    window.scrollTo(0, 0);
  });
  await page.evaluate(async () => {
    const images = Array.from(document.querySelectorAll("img"));
    await Promise.all(images.map((image) => Promise.race([
      image.decode().catch(() => undefined),
      new Promise((resolve) => setTimeout(resolve, 5000)),
    ])));
  });
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}

async function checkRatios(page, selector, ratio, counts) {
  const elements = await page.locator(selector).all();
  for (const element of elements) {
    const box = await element.boundingBox();
    if (!box || box.width < 10) continue;
    record(Math.abs(box.width / box.height - ratio) <= 2 / box.height,
      `${selector} ratio ${(box.width / box.height).toFixed(4)} expected ${ratio.toFixed(4)}`, counts);
  }
  return elements.length;
}

async function checkImages(page, counts) {
  const images = await page.locator("img").all();
  for (const image of images) {
    const state = await image.evaluate((node) => ({
      declaredSrc: node.getAttribute("src") ?? "",
      src: node.currentSrc,
      naturalWidth: node.naturalWidth,
      naturalHeight: node.naturalHeight,
    }));
    if (state.declaredSrc.startsWith("http://") || state.declaredSrc.startsWith("https://")) continue;
    record(state.naturalWidth > 0 && state.naturalHeight > 0,
      `image failed to load ${state.src}`, counts);
  }
  return images.length;
}

mkdirSync(shots, { recursive: true });
const browser = await chromium.launch({ executablePath, args: ["--no-sandbox"] });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
const totals = { passed: 0, failed: 0 };
const results = [];

try {
  for (const item of pages) {
    const page = await context.newPage();
    const counts = { passed: 0, failed: 0 };
    const response = await page.goto(`${base}${item.path}`, { waitUntil: "load", timeout: 60000 });
    record(response?.status() === 200, `${item.path} returned HTTP ${response?.status()}`, counts);
    await settleImages(page);
    const video = await checkRatios(page, "[class*='aspect-video']", 16 / 9, counts);
    const square = await checkRatios(page, "[class*='aspect-square']", 1, counts);
    const images = await checkImages(page, counts);
    if (item.detail) record(await page.locator(".inst").count() === 1, `${item.path} must render one .inst`, counts);
    await page.screenshot({ path: `${shots}/${item.name}.png`, fullPage: true });
    console.log(`  [${item.name}] video=${video} square=${square} images=${images} passed=${counts.passed} failed=${counts.failed}`);
    totals.passed += counts.passed;
    totals.failed += counts.failed;
    results.push({ name: item.name, ...counts });
    await page.close();
  }
} finally {
  await context.close();
  await browser.close();
}

console.log(`Total: passed=${totals.passed} failed=${totals.failed}`);
for (const result of results) console.log(`  ${result.name}: ${result.passed}p/${result.failed}f`);
process.exitCode = totals.failed > 0 ? 1 : 0;
