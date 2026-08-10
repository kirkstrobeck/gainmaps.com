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

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    try {
      // Every key readUltraMode() consults, or a legacy value decides the test.
      for (const key of ["ultra-mode", "hdr-lab-ultra-mode", "hdr-lab-gainmap-mode"]) {
        localStorage.removeItem(key);
      }
    } catch {
      // Ignore private-mode failures.
    }
  });
  await page.goto(process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3001");
  await expect(page.getByRole("heading", { name: "Drop images here to make them HDR." })).toBeVisible();
  await expect(page.getByText("Privacy: These files do not go anywhere.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Made by Kirk Strobeck" })).toHaveAttribute(
    "href",
    "https://www.linkedin.com/in/kirkstrobeck",
  );
});

test("processes a PNG through the ultra queue", async ({ page }) => {
  test.setTimeout(120000);

  await page.locator("input[type=file]").setInputFiles("public/demo/sticker-source.png");
  await expect(page.getByText("Original")).toBeVisible();
  await expect(page.getByText("Revised")).toBeVisible();
  await expect(page.getByTestId("job-row")).toHaveCount(1);
  await expect(page.getByText(/Ultra JPEG/)).toBeVisible({ timeout: 120000 });
  await expect(page.getByText("1/1")).toBeVisible({ timeout: 30000 });

  const download = await downloadJob(page);
  expect(download.suggestedFilename()).toBe("sticker-source-ultra.jpg");

  const path = await download.path();
  expect(path).toBeTruthy();
  const bytes = readFileSync(path!);
  expect(bytes[0]).toBe(0xff);
  expect(bytes[1]).toBe(0xd8);
});

test("encodes indexed PNGs as Ultra JPEGs", async ({ page }) => {
  await page.locator("input[type=file]").setInputFiles({
    name: "indexed-logo.png",
    mimeType: "image/png",
    buffer: palettePng,
  });
  await expect(page.getByText(/Ultra JPEG/)).toBeVisible({ timeout: 30000 });

  const download = await downloadJob(page);
  expect(download.suggestedFilename()).toBe("indexed-logo-ultra.jpg");

  const path = await download.path();
  expect(path).toBeTruthy();
  const bytes = readFileSync(path!);
  expect(bytes[0]).toBe(0xff);
  expect(bytes[1]).toBe(0xd8);
});

test("encodes JPEGs as Ultra JPEGs", async ({ page }) => {
  await page.locator("input[type=file]").setInputFiles("../../fixtures/window/window.jpeg");
  await expect(page.getByText(/Ultra JPEG/)).toBeVisible({ timeout: 30000 });

  const download = await downloadJob(page);
  expect(download.suggestedFilename()).toBe("window-ultra.jpg");
});

test("encodes animated SMIL SVGs as Ultra JPEGs", async ({ page }) => {
  test.setTimeout(90000);
  await page.locator("input[type=file]").setInputFiles("fixtures/ai-powered-marketing-tools-abstract.svg");
  await expect(page.getByText(/Ultra JPEG/)).toBeVisible({ timeout: 60000 });

  const download = await downloadJob(page);
  expect(download.suggestedFilename()).toBe("ai-powered-marketing-tools-abstract-ultra.jpg");

  const path = await download.path();
  expect(path).toBeTruthy();
  const bytes = readFileSync(path!);
  expect(bytes[0]).toBe(0xff);
  expect(bytes[1]).toBe(0xd8);
  const latin = bytes.toString("latin1");
  expect(latin.includes("hdrgm") || latin.includes("GainMap") || latin.includes("MPF")).toBeTruthy();
});

test("encodes SVGs as Ultra JPEGs", async ({ page }) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
  <rect width="64" height="64" fill="#1d4ed8"/>
  <circle cx="32" cy="32" r="18" fill="#f8fafc"/>
</svg>`;

  await page.locator("input[type=file]").setInputFiles({
    name: "mark.svg",
    mimeType: "image/svg+xml",
    buffer: Buffer.from(svg),
  });
  await expect(page.getByText(/Ultra JPEG/)).toBeVisible({ timeout: 30000 });

  const download = await downloadJob(page);
  expect(download.suggestedFilename()).toBe("mark-ultra.jpg");
});

test("toggles the Ultra site theme", async ({ page }) => {
  const html = page.locator("html");
  await expect(html).toHaveAttribute("data-ultra", "on");
  await page.getByRole("button", { name: "Off" }).click();
  await expect(html).toHaveAttribute("data-ultra", "off");
  await page.getByRole("button", { name: "On" }).click();
  await expect(html).toHaveAttribute("data-ultra", "on");
});

test("shows the technical document with page anchors", async ({ page }) => {
  await page.getByRole("link", { name: "Docs" }).click();
  await expect(page).toHaveURL(/\/docs$/);
  await expect(page.getByRole("heading", { name: "What Ultra actually does to an image" })).toBeVisible();
  const docsNav = page.getByRole("complementary");
  await expect(docsNav.getByRole("link", { name: /Pipeline/ })).toHaveAttribute("href", "#pipeline");
  await expect(docsNav.getByRole("link", { name: /Standards/ })).toHaveAttribute("href", "#standards");
  await expect(page.locator("#ultra")).toBeVisible();
});
