import { defineConfig, devices } from "@playwright/test";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000";

export default defineConfig({
  testMatch: ["smoke.spec.ts"],
  use: {
    baseURL: BASE_URL,
    launchOptions: {
      executablePath: "/ms-playwright/chromium-1187/chrome-linux/chrome",
    },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
