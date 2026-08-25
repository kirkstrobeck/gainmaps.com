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
      all: true,
      include: [
        "app/**/*.{ts,tsx}",
        "components/**/*.{ts,tsx}",
        "lib/**/*.ts",
      ],
      exclude: [
        // WebGPU — no test adapter available in jsdom
        "lib/appearance-hello.ts",
        "lib/ultra-fill.ts",
        // External re-export shim — no logic to test
        "lib/gain-map-encode.ts",
        // Browser-async shell — URL.createObjectURL / Image.onload / canvas.toBlob not available
        "lib/svg-raster.ts",
        // Next.js font loader — server-side module, not instrumentable in jsdom
        "app/layout.tsx",
        // Next.js parallel/intercepted route shells with no logic
        "app/bar/page.tsx",
      ],
      thresholds: {
        statements: 42,
        branches: 33,
        functions: 41,
        lines: 42,
      },
    },
  },
});
