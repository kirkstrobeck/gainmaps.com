/** @type {import('@lhci/cli').LhciConfig} */
module.exports = {
  ci: {
    collect: {
      url: [
        "http://localhost:3000/",
        "http://localhost:3000/convert",
        "http://localhost:3000/photos",
        "http://localhost:3000/docs",
        "http://localhost:3000/logos",
        "http://localhost:3000/text",
      ],
      numberOfRuns: 3,
      settings: {
        preset: "desktop",
        // Skip service worker and PWA checks (no HTTPS in local CI)
        disableStorageReset: false,
        chromeFlags: "--no-sandbox --disable-dev-shm-usage",
      },
    },
    assert: {
      assertions: {
        "categories:performance": ["error", { minScore: 1 }],
        "categories:accessibility": ["error", { minScore: 1 }],
        "categories:best-practices": ["error", { minScore: 1 }],
        "categories:seo": ["error", { minScore: 1 }],
      },
    },
    upload: {
      target: "filesystem",
      outputDir: ".lhci-reports/desktop",
    },
  },
};
