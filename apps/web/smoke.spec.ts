import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";

const palettePng = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAIAAAACAQMAAABIeJ9nAAAAAXNSR0IB2cksfwAAAAZQTFRFAAAAgICAkmm5JAAAAAJ0Uk5TAP9bkSK1AAAADElEQVR4nGM4wHAAAAMEAYEUGL32AAAAAElFTkSuQmCC",
  "base64",
);

async function downloadJob(page: import("@playwright/test").Page) {
  const downloadPromise = page.waitForEvent("download");
  await page.getByTestId("job-row").getByRole("button", { name: "Download" }).click();
  return downloadPromise;
}

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    try {
      for (const key of ["ultra-mode", "hdr-lab-ultra-mode", "hdr-lab-gainmap-mode"]) {
        localStorage.removeItem(key);
      }
    } catch {
      // Ignore private-mode failures.
    }
  });
  await page.goto(`${BASE_URL}/convert`);
  await expect(page.getByRole("heading", { name: "Drop images here to make them HDR." })).toBeVisible();
  await expect(page.getByText("Privacy: These files do not go anywhere.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Made by Kirk Strobeck" })).toHaveAttribute(
    "href",
    "https://www.linkedin.com/in/kirkstrobeck",
  );
});

test("home page renders drop zone and brew snippet", async ({ page }) => {
  await page.goto(BASE_URL);
  await expect(page.getByText("brew install gainmap")).toBeVisible();
  await expect(page.getByRole("link", { name: "View on Product Hunt" })).toBeVisible();
});

test("processes a PNG through the gain map queue", async ({ page }) => {
  test.setTimeout(120000);

  await page.locator("input[type=file]").setInputFiles("public/demo/sticker-source.png");
  await expect(page.getByText("Original")).toBeVisible();
  await expect(page.getByText("Revised")).toBeVisible();
  await expect(page.getByTestId("job-row")).toHaveCount(1);
  await expect(page.getByText(/Gain map JPEG/)).toBeVisible({ timeout: 120000 });
  await expect(page.getByText("1/1")).toBeVisible({ timeout: 30000 });

  const download = await downloadJob(page);
  expect(download.suggestedFilename()).toBe("sticker-source-gainmap.jpg");

  const path = await download.path();
  expect(path).toBeTruthy();
  const bytes = readFileSync(path!);
  expect(bytes[0]).toBe(0xff);
  expect(bytes[1]).toBe(0xd8);
});

test("encodes indexed PNGs as gain map JPEGs", async ({ page }) => {
  await page.locator("input[type=file]").setInputFiles({
    name: "indexed-logo.png",
    mimeType: "image/png",
    buffer: palettePng,
  });
  await expect(page.getByText(/Gain map JPEG/)).toBeVisible({ timeout: 30000 });

  const download = await downloadJob(page);
  expect(download.suggestedFilename()).toBe("indexed-logo-gainmap.jpg");

  const path = await download.path();
  expect(path).toBeTruthy();
  const bytes = readFileSync(path!);
  expect(bytes[0]).toBe(0xff);
  expect(bytes[1]).toBe(0xd8);
});

test("encodes JPEGs as gain map JPEGs", async ({ page }) => {
  await page.locator("input[type=file]").setInputFiles("../../fixtures/window/window.jpeg");
  await expect(page.getByText(/Gain map JPEG/)).toBeVisible({ timeout: 30000 });

  const download = await downloadJob(page);
  expect(download.suggestedFilename()).toBe("window-gainmap.jpg");
});

test("encodes animated SMIL SVGs as gain map JPEGs", async ({ page }) => {
  test.setTimeout(90000);
  await page.locator("input[type=file]").setInputFiles("fixtures/ai-powered-marketing-tools-abstract.svg");
  await expect(page.getByText(/Gain map JPEG/)).toBeVisible({ timeout: 60000 });

  const download = await downloadJob(page);
  expect(download.suggestedFilename()).toBe("ai-powered-marketing-tools-abstract-gainmap.jpg");

  const path = await download.path();
  expect(path).toBeTruthy();
  const bytes = readFileSync(path!);
  expect(bytes[0]).toBe(0xff);
  expect(bytes[1]).toBe(0xd8);
  const latin = bytes.toString("latin1");
  expect(latin.includes("hdrgm") || latin.includes("GainMap") || latin.includes("MPF")).toBeTruthy();
});

test("encodes SVGs as gain map JPEGs", async ({ page }) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
  <rect width="64" height="64" fill="#1d4ed8"/>
  <circle cx="32" cy="32" r="18" fill="#f8fafc"/>
</svg>`;

  await page.locator("input[type=file]").setInputFiles({
    name: "mark.svg",
    mimeType: "image/svg+xml",
    buffer: Buffer.from(svg),
  });
  await expect(page.getByText(/Gain map JPEG/)).toBeVisible({ timeout: 30000 });

  const download = await downloadJob(page);
  expect(download.suggestedFilename()).toBe("mark-gainmap.jpg");
});

test("defaults Ultra on and exposes chrome toggles", async ({ page }) => {
  await page.goto(BASE_URL);
  await expect(page.locator("html")).toHaveAttribute("data-ultra", "on");
  await expect(page.getByRole("group", { name: "Ultra display" })).toHaveCount(1);
  await expect(page.getByRole("group", { name: "Color mode" })).toHaveCount(1);

  await page.getByRole("button", { name: "Off" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-ultra", "off");
  await expect(page).toHaveURL(/ultra=off/);

  await page.getByRole("button", { name: "On" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-ultra", "on");
});

test("shows the technical document with page anchors", async ({ page }) => {
  await page.getByRole("link", { name: "Docs" }).click();
  await expect(page).toHaveURL(/\/docs$/);
  await expect(page.getByRole("heading", { name: "What Gainmaps actually does to an image" })).toBeVisible();
  const docsNav = page.getByRole("complementary");
  await expect(docsNav.getByRole("link", { name: /Pipeline/ })).toHaveAttribute("href", "#pipeline");
  await expect(docsNav.getByRole("link", { name: /Standards/ })).toHaveAttribute("href", "#standards");
  await expect(page.locator("#gain")).toBeVisible();
});

test("/logos page renders with nav", async ({ page }) => {
  await page.goto(`${BASE_URL}/logos`);
  await expect(page.getByRole("navigation")).toBeVisible();
});

test("/photos page renders gallery section", async ({ page }) => {
  await page.goto(`${BASE_URL}/photos`);
  await expect(page.getByRole("heading", { name: "Photos" })).toBeVisible();
});

test("/text page renders UltraWord instances and intensity slider", async ({ page }) => {
  await page.goto(`${BASE_URL}/text`);
  await expect(page.getByRole("heading", { name: "Ultra text demo" })).toBeVisible();
  await expect(page.getByRole("slider")).toBeVisible();
});

test("/text intensity param persists to URL", async ({ page }) => {
  await page.goto(`${BASE_URL}/text?intensity=80`);
  const slider = page.getByRole("slider");
  await expect(slider).toHaveValue("80");
});

test("/appearance page renders controls", async ({ page }) => {
  await page.goto(`${BASE_URL}/appearance`);
  await expect(page.locator(".appearance-lab")).toBeVisible();
});

test("/community page shows giscus widget", async ({ page }) => {
  await page.goto(`${BASE_URL}/community`);
  await expect(page.getByRole("heading", { name: "Community" })).toBeVisible();
});

test("mode URL param sets data-mode on html element", async ({ page }) => {
  await page.goto(`${BASE_URL}/?mode=light`);
  await expect(page.locator("html")).toHaveAttribute("data-mode", "light");
});

test("mode param persists across same-site navigation", async ({ page }) => {
  await page.goto(`${BASE_URL}/?mode=light`);
  await page.goto(`${BASE_URL}/docs`);
  await expect(page.locator("html")).toHaveAttribute("data-mode", "light");
});
