import { defineConfig, devices } from "@playwright/test/index.js";

export default defineConfig({
  testMatch: ["check-layout.spec.ts"],
  use: { baseURL: "http://localhost:3000" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } }],
});
