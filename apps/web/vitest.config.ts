import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
    },
  },
  test: {
    include: ["test/**/*.test.{ts,tsx}"],
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    coverage: {
      provider: "v8",
      include: [
        "lib/**/*.ts",
        "components/copy-button.tsx",
        "components/nav-pill.tsx",
        "components/install-switcher.tsx",
      ],
      exclude: [
        "lib/appearance-hello.ts",
        "lib/ultra-fill.ts",
        "lib/gain-map-encode.ts",
        "lib/svg-raster.ts",
      ],
      thresholds: {
        statements: 100,
        branches: 100,
        functions: 100,
        lines: 100,
      },
    },
  },
});
